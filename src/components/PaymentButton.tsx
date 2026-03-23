'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import type { BillingPeriod } from '@/config/pricing';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface PaymentButtonProps {
    plan: BillingPeriod;
    label?: string;
    className?: string;
}

export default function PaymentButton({ plan, label, className }: PaymentButtonProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handlePayment() {
        if (status !== 'authenticated') {
            router.push('/login?callbackUrl=/pricing');
            return;
        }

        setLoading(true);
        try {
            // 1. Create order on server
            const res = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Failed to create order. Please try again.');
                return;
            }

            const order = await res.json();

            // 2. Load Razorpay SDK if not loaded
            if (!window.Razorpay) {
                await loadRazorpayScript();
            }

            // 3. Open Razorpay checkout
            const options = {
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                name: 'CurrentPrep',
                description: `Pro Plan — ${order.planLabel}`,
                order_id: order.orderId,
                prefill: {
                    name: session?.user?.name || '',
                    email: session?.user?.email || '',
                },
                theme: {
                    color: '#3b82f6',
                },
                handler: async (response: any) => {
                    // 4. Verify payment on server
                    try {
                        const verifyRes = await fetch('/api/payments/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });

                        if (verifyRes.ok) {
                            // Refresh session to get updated premium status
                            router.push('/dashboard?upgraded=true');
                            router.refresh();
                        } else {
                            alert('Payment verification failed. Contact support if money was deducted.');
                        }
                    } catch {
                        alert('Could not verify payment. Please contact support.');
                    }
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Payment error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className={className || 'btn-accent'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}
        >
            {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Processing…</>
            ) : (
                <><CreditCard size={16} /> {label || 'Upgrade to Pro'}</>
            )}
        </button>
    );
}

function loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector('script[src*="razorpay"]')) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.head.appendChild(script);
    });
}
