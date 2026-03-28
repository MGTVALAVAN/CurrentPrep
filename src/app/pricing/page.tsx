'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Check, X, Star, Zap, Shield, Crown,
    ChevronDown, ChevronUp, ArrowRight, Sparkles,
    Clock, Users, Award, Target, TrendingUp, Gift,
    MessageCircle, Flame, CheckCircle2,
} from 'lucide-react';
import PaymentButton from '@/components/PaymentButton';
import {
    SINGLE_TESTS,
    TEST_PACKS,
    PRO_PLANS,
    COMPETITOR_COMPARISON,
    PRICING_FAQ,
    formatPrice,
} from '@/config/pricing';

// ── GA4 Tracking ───────────────────────────────────────────────────────

function trackEvent(event: string, params: Record<string, any> = {}) {
    if (typeof window !== 'undefined') {
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({ event, ...params });
    }
}

// ── Animation variants ─────────────────────────────────────────────────

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
    }),
};

const stagger = {
    visible: { transition: { staggerChildren: 0.08 } },
};

// ── Star Rating Component ──────────────────────────────────────────────

function StarRating({ rating = 5 }: { rating?: number }) {
    return (
        <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`w-4 h-4 ${i < rating ? 'star-filled fill-current' : 'text-gray-300'}`}
                />
            ))}
        </div>
    );
}

// ── Testimonials ───────────────────────────────────────────────────────

const testimonials = [
    {
        name: 'Priya R.',
        location: 'Chennai',
        text: 'Switched from a ₹7,000 coaching test series. CurrentPrep gives me 3x the tests at 1/3 the price. The difficulty calibration is spot-on.',
        rating: 5,
        avatar: '👩‍🎓',
    },
    {
        name: 'Arjun M.',
        location: 'Lucknow',
        text: 'The Pro plan is a steal. Unlimited tests with actual explanations — not just answer keys. My Prelims score jumped 40 marks in 3 months.',
        rating: 5,
        avatar: '👨‍💻',
    },
    {
        name: 'Deepa S.',
        location: 'Coimbatore',
        text: 'As a working professional, I needed flexible practice. Single test purchases let me study at my own pace without wasting money on unused subscriptions.',
        rating: 5,
        avatar: '👩‍💼',
    },
];

// ── FAQ Accordion Item ─────────────────────────────────────────────────

function FAQItem({ question, answer, isOpen, onToggle }: {
    question: string; answer: string; isOpen: boolean; onToggle: () => void;
}) {
    return (
        <motion.div
            className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 text-left"
                style={{ color: 'var(--text-primary)' }}
            >
                <span className="font-semibold text-sm pr-4">{question}</span>
                {isOpen
                    ? <ChevronUp className="w-5 h-5 flex-shrink-0 text-primary-600" />
                    : <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                }
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN PRICING PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function PricingPage() {
    const [openFAQ, setOpenFAQ] = useState<number | null>(0);
    const [selectedProPlan, setSelectedProPlan] = useState<'monthly' | 'yearly'>('yearly');

    // ── Early Access State ─────────────────────────────────────────────
    const [eaStatus, setEaStatus] = useState<{
        totalSlots: number; claimed: number; remaining: number; isAvailable: boolean;
    } | null>(null);
    const [eaLoading, setEaLoading] = useState(false);
    const [eaSuccess, setEaSuccess] = useState<{ slotNumber: number } | null>(null);
    const [eaError, setEaError] = useState('');
    const [eaRating, setEaRating] = useState(0);
    const [eaHoverRating, setEaHoverRating] = useState(0);
    const [eaLike, setEaLike] = useState('');
    const [eaImprove, setEaImprove] = useState('');
    const [eaRecommend, setEaRecommend] = useState(true);

    // GA4: track pricing page view + fetch early access status
    useEffect(() => {
        trackEvent('pricing_view');
        fetch('/api/early-access/status')
            .then(r => r.json())
            .then(data => setEaStatus(data))
            .catch(() => setEaStatus({ totalSlots: 250, claimed: 0, remaining: 250, isAvailable: true }));
    }, []);

    async function handleEarlyClaim(e: React.FormEvent) {
        e.preventDefault();
        setEaError('');
        if (eaRating === 0) { setEaError('Please select a star rating.'); return; }
        if (eaLike.trim().length < 10) { setEaError('Please tell us what you like (at least 10 characters).'); return; }
        if (eaImprove.trim().length < 10) { setEaError('Please tell us what to improve (at least 10 characters).'); return; }

        setEaLoading(true);
        trackEvent('early_access_claim_start');
        try {
            const res = await fetch('/api/early-access/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedbackRating: eaRating,
                    feedbackWhatYouLike: eaLike,
                    feedbackWhatToImprove: eaImprove,
                    feedbackWouldRecommend: eaRecommend,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setEaSuccess({ slotNumber: data.slotNumber });
                trackEvent('early_access_claimed', { slot: data.slotNumber });
                // Refresh status
                fetch('/api/early-access/status').then(r => r.json()).then(setEaStatus);
            } else {
                setEaError(data.error || 'Something went wrong. Please try again.');
            }
        } catch {
            setEaError('Network error. Please try again.');
        } finally {
            setEaLoading(false);
        }
    }

    const yearlyPlan = PRO_PLANS.find(p => p.billingPeriod === 'yearly')!;
    const monthlyPlan = PRO_PLANS.find(p => p.billingPeriod === 'monthly')!;
    const activePro = selectedProPlan === 'yearly' ? yearlyPlan : monthlyPlan;

    return (
        <div style={{ background: 'var(--bg-primary)' }}>

            {/* ═══════════════════════════════════════════════
                 1. HERO SECTION
                ═══════════════════════════════════════════════ */}
            <section className="hero-bg relative overflow-hidden py-20 lg:py-28">
                {/* Floating decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
                </div>

                <div className="relative max-w-5xl mx-auto px-4 text-center">
                    {/* Trust signal pill */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm text-blue-100 mb-8"
                    >
                        <Shield className="w-4 h-4 text-green-400" />
                        <span>Trusted by 5,000+ UPSC Aspirants</span>
                        <span className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                            ))}
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.7 }}
                        className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-extrabold text-white leading-tight mb-6"
                    >
                        Unlimited UPSC Tests for{' '}
                        <span className="gold-text">Price of 2 Full Mocks</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-lg sm:text-xl text-blue-100/90 max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        Master Prelims & Mains with 1,000+ tests. No subscription traps.
                        <br className="hidden sm:block" />
                        <span className="font-semibold text-white">Stop wasting ₹5,000 on just 30 tests.</span>
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            href="/mock-tests"
                            className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold rounded-xl
                                hover:from-yellow-400 hover:to-amber-500 transition-all duration-300 shadow-xl hover:shadow-2xl
                                hover:-translate-y-0.5 flex items-center gap-2 text-lg"
                        >
                            <Zap className="w-5 h-5" />
                            Start Free Test →
                        </Link>
                        <span className="text-sm text-blue-200/70">10 Questions • Easy Level • No card required</span>
                    </motion.div>

                    {/* Urgency badge */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-400/30 text-red-200 text-sm urgency-badge"
                    >
                        <Clock className="w-4 h-4" />
                        <span>Limited Year 1 slots at ₹3,999 — Introductory pricing ends soon</span>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                 1.5 EARLY ACCESS — First 250 users get Pro FREE
                ═══════════════════════════════════════════════ */}
            {eaStatus && eaStatus.isAvailable && !eaSuccess && (
                <section className="section-padding relative overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                    {/* Subtle background glow */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-3xl" />
                    </div>

                    <div className="relative max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-8"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-bold mb-4 urgency-badge">
                                <Flame className="w-4 h-4" /> First 250 Users Get Pro FREE
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                                Get <span className="gold-text">1 Year of Pro</span> — Absolutely Free
                            </h2>
                            <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
                                We&apos;re giving our first 250 users free Pro access for a full year.
                                All we ask is honest feedback to help us improve.
                            </p>
                        </motion.div>

                        {/* Progress bar + counter */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-8"
                        >
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {eaStatus.claimed} of {eaStatus.totalSlots} claimed
                                </span>
                                <span className="font-bold text-green-600 dark:text-green-400">
                                    {eaStatus.remaining} slots left!
                                </span>
                            </div>
                            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${(eaStatus.claimed / eaStatus.totalSlots) * 100}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                                />
                            </div>
                        </motion.div>

                        {/* Feedback Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="rounded-2xl border p-6 sm:p-8"
                            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                        >
                            <div className="flex items-center gap-2 mb-5">
                                <MessageCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <h3 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                    Share your feedback & claim free Pro
                                </h3>
                            </div>

                            <form onSubmit={handleEarlyClaim} className="space-y-5">
                                {/* Star Rating */}
                                <div>
                                    <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                                        How would you rate CurrentPrep so far? *
                                    </label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onMouseEnter={() => setEaHoverRating(star)}
                                                onMouseLeave={() => setEaHoverRating(0)}
                                                onClick={() => setEaRating(star)}
                                                className="p-1 transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={`w-7 h-7 transition-colors ${
                                                        star <= (eaHoverRating || eaRating)
                                                            ? 'text-yellow-400 fill-yellow-400'
                                                            : 'text-gray-300 dark:text-gray-600'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                        {eaRating > 0 && (
                                            <span className="ml-2 text-sm self-center" style={{ color: 'var(--text-muted)' }}>
                                                {['', 'Needs work', 'Fair', 'Good', 'Great', 'Excellent'][eaRating]}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* What you like */}
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                                        What do you like about CurrentPrep? *
                                    </label>
                                    <textarea
                                        value={eaLike}
                                        onChange={(e) => setEaLike(e.target.value)}
                                        placeholder="e.g., The daily current affairs are well-curated, mock test difficulty is realistic..."
                                        rows={3}
                                        className="input-field text-sm resize-none"
                                        required
                                    />
                                </div>

                                {/* What to improve */}
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                                        What should we improve? *
                                    </label>
                                    <textarea
                                        value={eaImprove}
                                        onChange={(e) => setEaImprove(e.target.value)}
                                        placeholder="e.g., Add more optional subject coverage, improve search functionality..."
                                        rows={3}
                                        className="input-field text-sm resize-none"
                                        required
                                    />
                                </div>

                                {/* Would recommend */}
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        Would you recommend us to a friend?
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEaRecommend(true)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                                                eaRecommend
                                                    ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                                                    : 'border-transparent'
                                            }`}
                                            style={!eaRecommend ? { color: 'var(--text-muted)', borderColor: 'var(--border-color)' } : {}}
                                        >
                                            👍 Yes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEaRecommend(false)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                                                !eaRecommend
                                                    ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                                                    : 'border-transparent'
                                            }`}
                                            style={eaRecommend ? { color: 'var(--text-muted)', borderColor: 'var(--border-color)' } : {}}
                                        >
                                            👎 No
                                        </button>
                                    </div>
                                </div>

                                {/* Error message */}
                                {eaError && (
                                    <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
                                        {eaError}
                                    </p>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={eaLoading}
                                    className="btn-gold text-sm w-full"
                                >
                                    {eaLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Claiming your slot...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Gift className="w-4 h-4" />
                                            Submit Feedback & Get Free Pro Access
                                        </span>
                                    )}
                                </button>

                                <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                                    You must be signed in to claim. • One claim per user.
                                </p>
                            </form>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* Early Access — Success State */}
            {eaSuccess && (
                <section className="section-padding" style={{ background: 'var(--bg-secondary)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-2xl mx-auto text-center"
                    >
                        <div className="rounded-2xl border p-8 sm:p-10" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-heading font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                🎉 You&apos;re Early Access User #{eaSuccess.slotNumber}!
                            </h2>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                12 months of Pro access has been activated on your account.
                                Thank you for your valuable feedback — it helps us build a better platform for all aspirants.
                            </p>
                            <Link
                                href="/mock-tests"
                                className="btn-gold text-sm inline-flex mx-auto"
                            >
                                <Zap className="w-4 h-4" /> Start Unlimited Tests Now
                            </Link>
                        </div>
                    </motion.div>
                </section>
            )}

            {/* Early Access — Sold Out State */}
            {eaStatus && !eaStatus.isAvailable && !eaSuccess && (
                <section className="py-6" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="max-w-3xl mx-auto px-4 text-center">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                ✅ All 250 early access slots have been claimed — check out our plans below!
                            </span>
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════════
                 2. THREE-COLUMN PRICING CARDS
                ═══════════════════════════════════════════════ */}
            <section className="section-padding" style={{ background: 'var(--bg-primary)' }}>
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-800/10 dark:bg-primary-400/10 text-primary-700 dark:text-primary-300 text-sm font-semibold mb-4">
                            <Target className="w-4 h-4" /> Choose Your Plan
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold gradient-text mb-3">
                            Pick What Works for You
                        </h2>
                        <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                            From single practice tests to unlimited everything — 70-80% cheaper than competitors.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pricing-grid-3 items-start">

                        {/* ─── CARD 1: Single Tests ─── */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="pricing-card rounded-2xl p-6 lg:p-8"
                            style={{ background: 'var(--bg-card)' }}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <h3 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                    Try Single Tests
                                </h3>
                            </div>
                            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                                Perfect for targeted practice
                            </p>

                            {/* Price menu */}
                            <div className="space-y-3 mb-6">
                                {SINGLE_TESTS.map((test) => (
                                    <div
                                        key={test.id}
                                        className="flex items-center justify-between py-2.5 px-3 rounded-lg border"
                                        style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
                                    >
                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {test.label}
                                        </span>
                                        <span className="text-sm font-bold text-primary-700 dark:text-primary-400">
                                            {formatPrice(test.price)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <PaymentButton
                                productId="single_50q"
                                label="Buy a Test"
                                className="btn-primary text-sm w-full flex items-center justify-center gap-2"
                            />
                        </motion.div>

                        {/* ─── CARD 3: Pro Unlimited ★ FEATURED ─── */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="pricing-featured-card rounded-2xl p-6 lg:p-8 relative md:-mt-4 md:mb-4"
                            style={{ background: 'var(--bg-card)' }}
                        >
                            {/* Featured badge */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="gold-gradient text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shimmer flex items-center gap-1.5">
                                    <Crown className="w-3.5 h-3.5" /> MOST POPULAR
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-1 mt-3">
                                <Crown className="w-5 h-5 text-amber-500" />
                                <h3 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                    Pro Unlimited
                                </h3>
                            </div>
                            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                                Everything unlimited — cancel anytime
                            </p>

                            {/* Monthly / Yearly toggle */}
                            <div className="flex rounded-lg p-1 mb-5" style={{ background: 'var(--bg-secondary)' }}>
                                <button
                                    onClick={() => { setSelectedProPlan('monthly'); trackEvent('plan_selected', { plan: 'pro_monthly' }); }}
                                    className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                                        selectedProPlan === 'monthly'
                                            ? 'bg-white dark:bg-dark-card shadow-sm text-primary-700 dark:text-primary-300'
                                            : ''
                                    }`}
                                    style={selectedProPlan !== 'monthly' ? { color: 'var(--text-muted)' } : {}}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => { setSelectedProPlan('yearly'); trackEvent('plan_selected', { plan: 'pro_yearly' }); }}
                                    className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                                        selectedProPlan === 'yearly'
                                            ? 'bg-white dark:bg-dark-card shadow-sm text-primary-700 dark:text-primary-300'
                                            : ''
                                    }`}
                                    style={selectedProPlan !== 'yearly' ? { color: 'var(--text-muted)' } : {}}
                                >
                                    Yearly
                                    <span className="ml-1 text-xs text-green-600 dark:text-green-400 font-bold">Save 44%</span>
                                </button>
                            </div>

                            {/* Price display */}
                            <div className="mb-1">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedProPlan}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <span className="text-4xl font-heading font-extrabold gold-text">
                                            {formatPrice(activePro.price)}
                                        </span>
                                        <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>
                                            /{selectedProPlan === 'yearly' ? 'yr' : 'mo'}
                                        </span>
                                    </motion.div>
                                </AnimatePresence>
                                {selectedProPlan === 'yearly' && (
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                        Just {formatPrice(activePro.pricePerMonth)}/month •{' '}
                                        <span className="price-strike">{formatPrice(monthlyPlan.price * 12)}</span>
                                    </p>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-2.5 my-5">
                                {activePro.features.map((feat) => (
                                    <li key={feat} className="flex items-center gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        <span style={{ color: 'var(--text-primary)' }}>{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <PaymentButton
                                productId={activePro.id}
                                label="Start Pro Free Trial"
                                className="btn-gold text-sm"
                                variant={selectedProPlan}
                            />

                            <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                                7-day free trial • Cancel anytime • No lock-in
                            </p>
                        </motion.div>

                        {/* ─── CARD 2: Test Packs ─── */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="pricing-card rounded-2xl p-6 lg:p-8"
                            style={{ background: 'var(--bg-card)' }}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <h3 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                    Buy Test Packs
                                </h3>
                            </div>
                            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                                Best for serious practice
                            </p>

                            <div className="space-y-4 mb-6">
                                {TEST_PACKS.map((pack) => (
                                    <div
                                        key={pack.id}
                                        className="p-4 rounded-xl border"
                                        style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                {pack.label}
                                            </span>
                                            <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                                {pack.savings}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-lg font-bold text-primary-700 dark:text-primary-400">
                                                {formatPrice(pack.price)}
                                            </span>
                                            <span className="text-xs price-strike" style={{ color: 'var(--text-muted)' }}>
                                                {formatPrice(pack.originalPrice)}
                                            </span>
                                        </div>
                                        {pack.description && (
                                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                                {pack.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <PaymentButton
                                productId="pack_5"
                                label="Grab Pack Deal"
                                className="btn-accent text-sm w-full flex items-center justify-center gap-2"
                            />
                        </motion.div>
                    </div>

                    {/* Smart upsell */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-8 p-4 rounded-xl text-center border"
                        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                    >
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            <TrendingUp className="w-4 h-4 inline mr-1 text-green-500" />
                            <strong>Bought 3+ single tests?</strong> Upgrade to Pro and save ₹1,000+ — your test history carries over.
                            <Link href="#pro-unlimited" className="ml-2 text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                                See savings →
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                 3. COMPETITOR COMPARISON TABLE
                ═══════════════════════════════════════════════ */}
            <section className="section-padding" style={{ background: 'var(--bg-secondary)' }}>
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-10"
                    >
                        <h2 className="text-2xl sm:text-3xl font-heading font-bold gradient-text mb-3">
                            Why Aspirants Are Switching
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            See how we stack up against ₹5,000–₹9,000 test series
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="rounded-2xl overflow-hidden border shadow-lg"
                        style={{ borderColor: 'var(--border-color)' }}
                    >
                        <table className="w-full comparison-table" style={{ background: 'var(--bg-card)' }}>
                            <thead>
                                <tr className="hero-bg text-white">
                                    <th className="text-left text-sm font-semibold py-4 px-5">Feature</th>
                                    <th className="text-center text-sm font-semibold py-4 px-5">Others</th>
                                    <th className="text-center text-sm font-semibold py-4 px-5">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Crown className="w-4 h-4 text-yellow-300" />
                                            Our Pro
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPETITOR_COMPARISON.map((row, i) => (
                                    <tr key={row.feature} className={row.highlight ? 'font-semibold' : ''}>
                                        <td className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                            {row.feature}
                                        </td>
                                        <td className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                                            {row.others}
                                        </td>
                                        <td className="text-center text-sm font-semibold text-green-600 dark:text-green-400">
                                            {row.ours}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-6 text-center"
                    >
                        <PaymentButton
                            productId="pro_yearly"
                            label="Choose Unlimited — ₹3,999/yr"
                            className="btn-gold text-sm inline-flex mx-auto"
                        />
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                 4. SOCIAL PROOF — Testimonials
                ═══════════════════════════════════════════════ */}
            <section className="section-padding" style={{ background: 'var(--bg-primary)' }}>
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-10"
                    >
                        <h2 className="text-2xl sm:text-3xl font-heading font-bold gradient-text mb-3">
                            What Aspirants Say
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={t.name}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="testimonial-card"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-lg">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {t.name}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {t.location}
                                        </p>
                                    </div>
                                </div>
                                <StarRating rating={t.rating} />
                                <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                    &ldquo;{t.text}&rdquo;
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                 5. FAQ SECTION
                ═══════════════════════════════════════════════ */}
            <section className="section-padding" style={{ background: 'var(--bg-secondary)' }}>
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-10"
                    >
                        <h2 className="text-2xl sm:text-3xl font-heading font-bold gradient-text mb-3">
                            Frequently Asked Questions
                        </h2>
                    </motion.div>

                    <div className="space-y-3">
                        {PRICING_FAQ.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <FAQItem
                                    question={faq.question}
                                    answer={faq.answer}
                                    isOpen={openFAQ === i}
                                    onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                 6. FOOTER CTA
                ═══════════════════════════════════════════════ */}
            <section className="hero-bg relative overflow-hidden py-16 lg:py-24">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/3 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-3xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-blue-100 mb-6">
                            <Users className="w-4 h-4" />
                            <span>Join 5,000+ Aspirants Crushing UPSC</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-white mb-4">
                            Ready to Practice{' '}
                            <span className="gold-text">Without Limits?</span>
                        </h2>

                        <p className="text-blue-100/80 mb-8 max-w-lg mx-auto">
                            Start with a free test today. No credit card, no commitment.
                            <br />
                            Upgrade when you&apos;re ready — we&apos;ll be here.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/mock-tests"
                                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold rounded-xl
                                    hover:from-yellow-400 hover:to-amber-500 transition-all duration-300 shadow-xl hover:shadow-2xl
                                    hover:-translate-y-0.5 flex items-center gap-2 text-lg"
                            >
                                <Zap className="w-5 h-5" />
                                Start Free Test
                            </Link>
                            <Link
                                href="#"
                                onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="text-blue-200 hover:text-white transition-colors text-sm flex items-center gap-1"
                            >
                                View all plans <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Security badges */}
                        <div className="flex items-center justify-center gap-6 mt-10">
                            {[
                                { icon: Shield, text: '100% Secure' },
                                { icon: Award, text: 'Razorpay Protected' },
                                { icon: Sparkles, text: 'Instant Access' },
                            ].map((badge) => (
                                <span key={badge.text} className="flex items-center gap-1.5 text-xs text-blue-200/60">
                                    <badge.icon className="w-3.5 h-3.5" />
                                    {badge.text}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
