'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import type { BillingPeriod } from '@/config/pricing';

declare global {
    interface Window {
        Razorpay: any;
        dataLayer: any[];
    }
}

interface PaymentButtonProps {
    /** Legacy: billing period (monthly/annual) */
    plan?: BillingPeriod;
    /** New: product ID from pricing config (e.g., 'single_10q', 'pack_5', 'pro_yearly') */
    productId?: string;
    /** Optional promo code to apply */
    promoCode?: string;
    label?: string;
    className?: string;
    /** GA4 event variant for tracking */
    variant?: string;
}

/** Push GA4 tracking event */
function trackEvent(eventName: string, params: Record<string, any> = {}) {
    if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: eventName, ...params });
    }
}

export default function PaymentButton({
    plan,
    productId,
    promoCode,
    label,
    className,
    variant,
}: PaymentButtonProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handlePayment() {
        if (status !== 'authenticated') {
            router.push('/login?callbackUrl=/pricing');
            return;
        }

        // GA4: purchase_start
        trackEvent('purchase_start', {
            product: productId || plan,
            variant: variant || 'default',
        });

        setLoading(true);
        try {
            // 1. Create order on server
            const body: Record<string, string> = {};
            if (productId) {
                body.productId = productId;
            } else if (plan) {
                body.plan = plan;
            }
            if (promoCode) {
                body.promoCode = promoCode;
            }

            const res = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
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
                description: `${order.planLabel}`,
                order_id: order.orderId,
                prefill: {
                    name: session?.user?.name || '',
                    email: session?.user?.email || '',
                },
                theme: {
                    color: '#1E3A8A',
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
                            trackEvent('purchase_complete', {
                                product: productId || plan,
                                orderId: response.razorpay_order_id,
                            });
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
                <><CreditCard size={16} /> {label || 'Buy Now'}</>
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
