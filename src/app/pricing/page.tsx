'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';
import Link from 'next/link';
import PaymentButton from '@/components/PaymentButton';
import { PLANS, FEATURES, formatPrice } from '@/config/pricing';
import type { BillingPeriod } from '@/config/pricing';

export default function PricingPage() {
    const { t } = useLanguage();
    const [billing, setBilling] = useState<BillingPeriod>('quarterly');
    const selectedPlan = PLANS.find(p => p.id === billing)!;

    return (
        <div style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <section className="hero-bg py-16 lg:py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
                        {t('pricing_title')}
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-lg text-blue-100/90 max-w-xl mx-auto">
                        {t('pricing_subtitle')}
                    </motion.p>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Free Tier */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="p-8 rounded-2xl border"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-primary-700 dark:text-primary-400" />
                            <span className="font-heading font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                                {t('pricing_free')}
                            </span>
                        </div>
                        <div className="mb-2">
                            <span className="text-4xl font-heading font-extrabold" style={{ color: 'var(--text-primary)' }}>₹0</span>
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}> forever</span>
                        </div>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            {t('pricing_free_desc')}
                        </p>
                        <Link href="/register" className="btn-primary text-sm w-full text-center block">
                            {t('pricing_get_started')}
                        </Link>
                        <ul className="mt-6 space-y-3">
                            {FEATURES.map((f) => (
                                <li key={f.text} className="flex items-start gap-2 text-sm">
                                    {f.free ? (
                                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <X className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <span style={{ color: f.free ? 'var(--text-primary)' : 'var(--text-muted)' }}>{f.text}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Premium Tier */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="p-8 rounded-2xl border-2 border-accent-500 relative overflow-hidden shadow-xl"
                        style={{ background: 'var(--bg-card)' }}
                    >
                        <div className="absolute top-0 right-0 px-4 py-1 bg-accent-500 text-white text-xs font-bold rounded-bl-xl">
                            RECOMMENDED
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <Crown className="w-5 h-5 text-accent-500" />
                            <span className="font-heading font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                                {t('pricing_premium')}
                            </span>
                        </div>

                        {/* Price with billing toggle */}
                        <div className="mb-1">
                            <span className="text-4xl font-heading font-extrabold" style={{ color: 'var(--text-primary)' }}>
                                {formatPrice(selectedPlan.pricePerMonth)}
                            </span>
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/month</span>
                        </div>
                        {selectedPlan.id !== 'monthly' && (
                            <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                                Billed {formatPrice(selectedPlan.price)} / {selectedPlan.duration}
                                {selectedPlan.savings && (
                                    <span className="ml-2 px-2 py-0.5 bg-green-500/15 text-green-500 rounded-full text-xs font-semibold">
                                        {selectedPlan.savings}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Billing period selector */}
                        <div className="flex rounded-lg overflow-hidden border mb-6" style={{ borderColor: 'var(--border-color)' }}>
                            {PLANS.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setBilling(p.id)}
                                    className="flex-1 py-2 px-3 text-xs font-semibold transition-all"
                                    style={{
                                        background: billing === p.id ? 'var(--accent-500, #f59e0b)' : 'transparent',
                                        color: billing === p.id ? '#fff' : 'var(--text-muted)',
                                    }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                            {t('pricing_premium_desc')}
                        </p>

                        <PaymentButton plan={billing} label={`Upgrade — ${formatPrice(selectedPlan.price)}/${selectedPlan.duration}`} />

                        <ul className="mt-6 space-y-3">
                            {FEATURES.filter(f => f.pro).map((f) => (
                                <li key={f.text} className="flex items-start gap-2 text-sm">
                                    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${f.highlight ? 'text-accent-500' : 'text-green-500'}`} />
                                    <span style={{ color: 'var(--text-primary)', fontWeight: f.highlight ? 600 : 400 }}>
                                        {f.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {/* FAQ */}
                <div className="mt-16 text-center">
                    <h3 className="font-heading font-bold text-xl mb-6 gradient-text">Frequently Asked Questions</h3>
                    <div className="max-w-2xl mx-auto space-y-4 text-left">
                        {[
                            { q: 'Is the free tier really free forever?', a: 'Yes! Our mission is to democratize UPSC preparation. All core content—current affairs, syllabus hub, and community—will always be free.' },
                            { q: 'Can I cancel premium anytime?', a: 'Absolutely. No lock-in, no hidden charges. Cancel from your dashboard anytime and continue with the free tier.' },
                            { q: 'How does billing work?', a: 'Choose monthly (₹299), quarterly (₹799, save 11%), or annual (₹2,499, save 30%). Payments are processed securely via Razorpay. Auto-renewal can be disabled.' },
                            { q: 'What payment methods are accepted?', a: 'UPI, credit/debit cards, net banking, and wallets—all through Razorpay\'s secure payment gateway.' },
                            { q: 'Is the content in Tamil complete?', a: 'We\'re continuously expanding Tamil content. Currently, all UI, summaries, and quizzes are available in Tamil.' },
                        ].map((faq) => (
                            <div key={faq.q} className="p-5 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{faq.q}</h4>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
