'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Crown, CreditCard, Clock, ChevronRight, Loader2,
    Shield, Calendar, CheckCircle, AlertCircle,
} from 'lucide-react';
import { PLANS, formatPrice } from '@/config/pricing';

export const dynamic = 'force-dynamic';

interface Subscription {
    plan: string;
    status: string;
    amount_paise: number;
    created_at: string;
}

export default function SubscriptionPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [history, setHistory] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            router.replace('/login?callbackUrl=/profile/subscription');
        }
        if (authStatus === 'authenticated') {
            fetchSubscription();
        }
    }, [authStatus, router]);

    async function fetchSubscription() {
        try {
            const res = await fetch('/api/payments/subscription', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setSubscription(data.active);
                setHistory(data.history || []);
            }
        } catch (err) {
            console.error('Failed to fetch subscription:', err);
        } finally {
            setLoading(false);
        }
    }

    const isPremium = (session?.user as any)?.is_premium;
    const user = session?.user;

    if (authStatus === 'loading' || loading) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                <Loader2 className="animate-spin" size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
            <div className="max-w-3xl mx-auto px-4 py-12">
                <h1 className="text-2xl font-heading font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Subscription
                </h1>
                <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                    Manage your CurrentPrep subscription and billing
                </p>

                {/* Current Plan Card */}
                <div
                    className="p-6 rounded-2xl border-2 mb-8"
                    style={{
                        background: 'var(--bg-card)',
                        borderColor: isPremium ? '#f59e0b' : 'var(--border-color)',
                    }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        {isPremium ? (
                            <Crown className="text-accent-500" size={24} />
                        ) : (
                            <Shield size={24} style={{ color: 'var(--text-muted)' }} />
                        )}
                        <div>
                            <h2 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                {isPremium ? 'Pro Plan' : 'Free Plan'}
                            </h2>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {isPremium && subscription
                                    ? `${subscription.plan} billing · Paid ${new Date(subscription.created_at).toLocaleDateString('en-IN')}`
                                    : 'Basic access to CurrentPrep features'
                                }
                            </p>
                        </div>
                        {isPremium && (
                            <span className="ml-auto px-3 py-1 bg-green-500/15 text-green-500 rounded-full text-xs font-bold flex items-center gap-1">
                                <CheckCircle size={12} /> Active
                            </span>
                        )}
                    </div>

                    {!isPremium && (
                        <div className="mt-4">
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                Unlock unlimited quizzes, daily ePaper, mock tests, and all premium features.
                            </p>
                            <Link
                                href="/pricing"
                                className="btn-accent text-sm inline-flex items-center gap-2"
                            >
                                <Crown size={14} /> Upgrade to Pro
                                <ChevronRight size={14} />
                            </Link>
                        </div>
                    )}
                </div>

                {/* Available Plans (if free) */}
                {!isPremium && (
                    <div className="mb-8">
                        <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
                            Available Plans
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {PLANS.map((plan) => (
                                <div
                                    key={plan.id}
                                    className="p-4 rounded-xl border text-center"
                                    style={{
                                        background: 'var(--bg-card)',
                                        borderColor: plan.popular ? '#f59e0b' : 'var(--border-color)',
                                        borderWidth: plan.popular ? 2 : 1,
                                    }}
                                >
                                    {plan.popular && (
                                        <span className="text-xs font-bold text-accent-500 mb-2 block">BEST VALUE</span>
                                    )}
                                    <div className="font-heading font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                                        {plan.label}
                                    </div>
                                    <div className="text-2xl font-heading font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>
                                        {formatPrice(plan.price)}
                                    </div>
                                    <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                                        {formatPrice(plan.pricePerMonth)}/month
                                        {plan.savings && (
                                            <span className="block text-green-500 font-semibold mt-1">{plan.savings}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment History */}
                {history.length > 0 && (
                    <div>
                        <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
                            Payment History
                        </h3>
                        <div className="space-y-3">
                            {history.map((payment, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-4 rounded-xl border"
                                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                                >
                                    <CreditCard size={18} style={{ color: 'var(--text-muted)' }} />
                                    <div className="flex-1">
                                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {payment.plan.charAt(0).toUpperCase() + payment.plan.slice(1)} Plan
                                        </span>
                                        <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                                            {formatPrice(payment.amount_paise / 100)}
                                        </span>
                                    </div>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        <Calendar size={10} style={{ display: 'inline', marginRight: 4 }} />
                                        {new Date(payment.created_at).toLocaleDateString('en-IN')}
                                    </span>
                                    <span
                                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                                        style={{
                                            background: payment.status === 'paid' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                            color: payment.status === 'paid' ? '#10b981' : '#ef4444',
                                        }}
                                    >
                                        {payment.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Help Section */}
                <div className="mt-12 p-5 rounded-xl border text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <AlertCircle size={20} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Need help with billing? Contact us at{' '}
                        <a href="mailto:support@currentprep.in" style={{ color: 'var(--accent-500, #f59e0b)' }}>
                            support@currentprep.in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
