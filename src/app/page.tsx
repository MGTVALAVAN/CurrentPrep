'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import {
    Brain, Users, BarChart3, Newspaper,
    Sparkles, BookOpen, Target, Trophy, Zap,
    Heart, Shield, Globe, Rss, Route, Upload,
    CheckCircle2, Mail, User, ArrowRight
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
    }),
};

function StatCounter({ value, label }: { value: string; label: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center px-4"
        >
            <div className="text-2xl sm:text-3xl font-heading font-bold text-white">{value}</div>
            <div className="text-sm text-blue-200 mt-1">{label}</div>
        </motion.div>
    );
}

/* ── What We Offer — 6 consolidated cards ── */
const offerings = [
    {
        icon: Target, title: 'Practice Mock Tests',
        desc: 'Custom & full-length UPSC Prelims mocks from our 7,200+ question pool. Choose subjects, difficulty, and question count.',
        features: ['Custom mock builder', 'Full-length 100-Q UPSC paper', 'Subject-wise analysis', 'Negative marking options'],
        color: 'from-violet-500 to-purple-600',
        href: '/mock-tests', cta: 'Start Practicing →',
    },
    {
        icon: Newspaper, title: 'Daily Current Affairs',
        desc: 'A newspaper-style page updated daily with 15–20 curated articles from The Hindu, Indian Express, PIB.',
        features: ['Auto-curated from top sources', 'GS paper & category tagging', 'Prelims + Mains pointers', 'Expandable detailed analysis'],
        color: 'from-blue-500 to-indigo-600',
        href: '/current-affairs', cta: 'View Current Affairs →',
    },
    {
        icon: Rss, title: 'Daily ePaper (A4 PDF)',
        desc: 'A beautifully designed 6–8 page A4 ePaper delivered to your inbox every morning. Print-ready editorial layout.',
        features: ['Print-ready A4 layout', 'Emailed daily to your inbox', 'Includes Prelims MCQs & Mains Qs', 'Archive of all past editions'],
        color: 'from-orange-500 to-red-600',
        href: '/daily-epaper/archive', cta: 'Browse ePaper Archive →',
    },
    {
        icon: Brain, title: 'Daily Mock Practice',
        desc: 'Practice with 4–5 Prelims MCQs and 4 Mains descriptive questions generated daily from the day\'s current affairs.',
        features: ['Current affairs-based questions', 'Interactive MCQ with explanations', 'Mains approach guidance', 'Builds up date-wise'],
        color: 'from-purple-500 to-pink-600',
        href: '/daily-mock', cta: 'Start Daily Mock →',
    },
    {
        icon: BookOpen, title: 'Syllabus Hub',
        desc: 'Complete UPSC CSE syllabus breakdown with NCERT summaries, official PDF links, and previous year question papers.',
        features: ['Prelims + Mains coverage', 'NCERT chapter summaries', 'Official PDF downloads', 'PYQ database (1995–2025)'],
        color: 'from-emerald-500 to-teal-600',
        href: '/syllabus', cta: 'Explore Syllabus →',
    },
    {
        icon: Upload, title: 'AI Tools',
        desc: 'Answer Evaluation and Personalized Study Roadmap — AI-powered tools to supercharge your preparation.',
        features: ['Answer sheet evaluation', 'Structure & content scoring', 'Week-by-week study plan', 'Adaptive to your progress'],
        color: 'from-amber-500 to-orange-600',
        badge: 'Coming Soon',
    },
];

export default function HomePage() {
    const { t } = useLanguage();
    const [signupEmail, setSignupEmail] = useState('');
    const [signupName, setSignupName] = useState('');
    const [signupSubmitted, setSignupSubmitted] = useState(false);

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Hook up to actual signup API
        setSignupSubmitted(true);
        setTimeout(() => setSignupSubmitted(false), 4000);
    };

    return (
        <>
            {/* ═══════════════════════════════════════════════
                 1. HERO — left: headline + CTA, right: sign-up
                ═══════════════════════════════════════════════ */}
            <section className="hero-bg relative overflow-hidden min-h-[90vh] flex items-center">
                {/* Floating decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* LEFT: Headline */}
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm text-blue-100 mb-8"
                            >
                                <Sparkles className="w-4 h-4 text-accent-400" />
                                <span>100% Free • AI-Powered • Mobile-First</span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.1 }}
                                className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-white leading-tight mb-6"
                            >
                                {t('hero_title')}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.2 }}
                                className="text-lg sm:text-xl text-blue-100/90 max-w-xl leading-relaxed mb-10"
                            >
                                {t('hero_subtitle')}
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.3 }}
                                className="flex flex-col sm:flex-row items-start gap-4"
                            >
                                <Link href="/syllabus"
                                    className="px-8 py-4 bg-white text-primary-800 font-bold rounded-xl
                                    hover:bg-blue-50 transition-all duration-300 shadow-xl hover:shadow-2xl
                                    hover:-translate-y-0.5 flex items-center gap-2 text-lg">
                                    <BookOpen className="w-5 h-5" />
                                    {t('hero_cta_syllabus')}
                                </Link>
                                <Link href="/mock-tests"
                                    className="px-8 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold rounded-xl
                                    hover:from-accent-400 hover:to-accent-500 transition-all duration-300 shadow-xl hover:shadow-2xl
                                    hover:-translate-y-0.5 flex items-center gap-2 text-lg animate-pulse-glow">
                                    <Zap className="w-5 h-5" />
                                    Practice Mock Tests
                                </Link>
                            </motion.div>
                        </div>

                        {/* RIGHT: Sign-up Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 mb-4 shadow-lg">
                                        <Trophy className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-xl font-heading font-bold text-white mb-1">
                                        Start Your UPSC Journey
                                    </h3>
                                    <p className="text-sm text-blue-200/80">
                                        Free forever. No credit card needed.
                                    </p>
                                </div>

                                {signupSubmitted ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-8"
                                    >
                                        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                        <p className="text-white font-semibold text-lg">Welcome aboard! 🎉</p>
                                        <p className="text-blue-200/80 text-sm mt-1">Check your email to get started.</p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSignup} className="space-y-4">
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/60" />
                                            <input
                                                type="text"
                                                placeholder="Your Name"
                                                value={signupName}
                                                onChange={(e) => setSignupName(e.target.value)}
                                                required
                                                className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50
                                                    focus:outline-none focus:border-accent-400 focus:bg-white/15 transition-all text-sm"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/60" />
                                            <input
                                                type="email"
                                                placeholder="Email Address"
                                                value={signupEmail}
                                                onChange={(e) => setSignupEmail(e.target.value)}
                                                required
                                                className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50
                                                    focus:outline-none focus:border-accent-400 focus:bg-white/15 transition-all text-sm"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full py-3.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold rounded-xl
                                                hover:from-accent-400 hover:to-accent-500 transition-all duration-300 shadow-lg hover:shadow-xl
                                                flex items-center justify-center gap-2 text-sm"
                                        >
                                            Sign Up Free <ArrowRight className="w-4 h-4" />
                                        </button>
                                        <p className="text-center text-xs text-blue-200/50 mt-2">
                                            Join 10,000+ aspirants already preparing smarter.
                                        </p>
                                    </form>
                                )}

                                {/* Trust badges */}
                                <div className="flex items-center justify-center gap-4 mt-6 pt-5 border-t border-white/10">
                                    {['🔒 Secure', '🆓 100% Free', '📱 Mobile Ready'].map((badge) => (
                                        <span key={badge} className="text-xs text-blue-200/60">{badge}</span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════
                 2. STATS BAR
                ═══════════════════ */}
            <section className="bg-gradient-to-r from-primary-800 via-primary-700 to-primary-800 py-8 -mt-1">
                <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <StatCounter value="10,000+" label={t('stats_aspirants').replace('10,000+ ', '')} />
                    <StatCounter value="100%" label={t('stats_ncert').replace('100% ', '')} />
                    <StatCounter value="Daily" label={t('stats_current_affairs').replace('Daily ', '')} />
                    <StatCounter value="7,200+" label="Mock Questions" />
                </div>
            </section>

            {/* ═══════════════════════════════════
                 3. WHAT WE OFFER — 6 cards
                ═══════════════════════════════════ */}
            <section className="section-padding" style={{ background: 'var(--bg-primary)' }}>
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-500/10 text-accent-500 text-sm font-semibold mb-4">
                            <Sparkles className="w-4 h-4" /> Everything in One Place
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4 gradient-text">
                            What We Offer
                        </h2>
                        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                            Every tool a UPSC aspirant needs — from syllabus to mock tests to daily current affairs. All free.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {offerings.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <motion.div
                                    key={item.title}
                                    custom={i}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeUp}
                                    className="group p-6 rounded-2xl border card-hover relative flex flex-col"
                                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                                >
                                    {item.badge && (
                                        <span className="absolute top-4 right-4 px-2.5 py-1 bg-amber-500/15 text-amber-500 text-xs font-semibold rounded-full border border-amber-500/30">
                                            {item.badge}
                                        </span>
                                    )}
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5
                                        group-hover:scale-110 transition-transform shadow-lg`}>
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="font-heading font-semibold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                                        {item.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                                        {item.desc}
                                    </p>
                                    <ul className="space-y-1.5 mb-5">
                                        {item.features.map((f) => (
                                            <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-auto">
                                        {item.href ? (
                                            <Link href={item.href} className="btn-primary text-sm w-full block text-center">
                                                {item.cta}
                                            </Link>
                                        ) : (
                                            <button disabled className="btn-primary text-sm w-full opacity-50 cursor-not-allowed">
                                                Coming Soon
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════
                 4. OUR MISSION / VALUES
                ═══════════════════════════════ */}
            <section className="section-padding" style={{ background: 'var(--bg-secondary)' }}>
                <div className="max-w-5xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400 text-sm font-medium mb-4">
                            <Heart className="w-4 h-4" /> Our Mission
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-6 gradient-text">
                            Democratizing UPSC Prep for Self-Study Warriors
                        </h2>
                        <p className="text-base leading-relaxed max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                            Every year, millions of aspirants across India dream of cracking the UPSC Civil Services Exam.
                            But most quality resources are locked behind expensive coaching centers concentrated in metros.
                            We believe a student in Chennai, Coimbatore, or Madurai deserves the same access as someone in Rajinder Nagar.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: Shield, title: 'Free Forever', desc: 'Core content will always be free. We monetize only through optional premium AI features.' },
                            { icon: Target, title: 'Syllabus-Aligned', desc: 'Every piece of content maps directly to UPSC official syllabus. No fluff, no filler.' },
                            { icon: Globe, title: 'Inclusive by Design', desc: 'Mobile-first, offline-capable, bilingual (English/Tamil). Built for Tier 2/3 city aspirants.' },
                        ].map((val, i) => {
                            const Icon = val.icon;
                            return (
                                <motion.div key={val.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                    className="p-6 rounded-2xl border text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                    <Icon className="w-10 h-10 mx-auto text-primary-700 dark:text-primary-400 mb-3" />
                                    <h3 className="font-heading font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{val.title}</h3>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{val.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
}
