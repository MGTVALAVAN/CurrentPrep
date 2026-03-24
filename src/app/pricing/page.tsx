'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import { Check, X, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

const plans = [
    {
        id: 'free',
        features: [
            { text: 'Full NCERT Summaries (All Subjects)', included: true },
            { text: 'UPSC Syllabus Hub with PDF Links', included: true },
            { text: 'Daily Current Affairs Digest', included: true },
            { text: 'Community Forum Access', included: true },
            { text: 'Basic AI Quiz (10/day)', included: true },
            { text: 'Progress Tracker & Badges', included: true },
            { text: 'Bilingual (EN/Tamil)', included: true },
            { text: 'Offline Access', included: true },
            { text: 'Advanced AI Answer Evaluation', included: false },
            { text: 'Personalized Study Roadmap', included: false },
            { text: 'Mock Interview Simulator', included: false },
            { text: '1:1 Mentor Chat', included: false },
            { text: 'Priority Support', included: false },
        ],
    },
    {
        id: 'premium',
        features: [
            { text: 'Everything in Free tier', included: true },
            { text: 'Unlimited AI Quiz Generation', included: true },
            { text: 'AI Answer Evaluation (Unlimited)', included: true },
            { text: 'Personalized Study Roadmap', included: true },
            { text: 'Mock Interview Simulator', included: true },
            { text: '1:1 Mentor Chat (2 sessions/month)', included: true },
            { text: 'Advanced Analytics Dashboard', included: true },
            { text: 'Priority Forum Badge', included: true },
            { text: 'Early Access to New Features', included: true },
            { text: 'Priority Email Support', included: true },
        ],
    },
];

export default function PricingPage() {
    const { t } = useLanguage();

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
                        <Link href="/syllabus" className="btn-primary text-sm w-full text-center block">
                            {t('pricing_get_started')}
                        </Link>
                        <ul className="mt-6 space-y-3">
                            {plans[0].features.map((f) => (
                                <li key={f.text} className="flex items-start gap-2 text-sm">
                                    {f.included ? (
                                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <X className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <span style={{ color: f.included ? 'var(--text-primary)' : 'var(--text-muted)' }}>{f.text}</span>
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
                            <Zap className="w-5 h-5 text-accent-500" />
                            <span className="font-heading font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                                {t('pricing_premium')}
                            </span>
                        </div>
                        <div className="mb-2">
                            <span className="text-4xl font-heading font-extrabold" style={{ color: 'var(--text-primary)' }}>₹999</span>
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('pricing_month')}</span>
                        </div>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            {t('pricing_premium_desc')}
                        </p>
                        <button className="btn-accent text-sm w-full">
                            {t('pricing_upgrade')}
                        </button>
                        <ul className="mt-6 space-y-3">
                            {plans[1].features.map((f) => (
                                <li key={f.text} className="flex items-start gap-2 text-sm">
                                    <Check className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                                    <span style={{ color: 'var(--text-primary)' }}>{f.text}</span>
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
                            { q: 'Is the free tier really free forever?', a: 'Yes! Our mission is to democratize UPSC preparation. All core content—NCERT summaries, syllabus hub, current affairs, and community—will always be free.' },
                            { q: 'Can I cancel premium anytime?', a: 'Absolutely. No lock-in, no hidden charges. Cancel from your dashboard anytime and continue with the free tier.' },
                            { q: 'Is the content in Tamil complete?', a: 'We\'re continuously expanding Tamil content. Currently, all UI, summaries, and quizzes are available in Tamil. More detailed notes are being translated.' },
                            { q: 'Do I need internet for offline access?', a: 'Once you\'ve loaded a page, our PWA technology caches it for offline reading. Download content while connected, study anywhere.' },
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
