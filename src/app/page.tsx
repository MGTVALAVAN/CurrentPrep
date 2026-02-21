'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import {
    Brain, Users, BarChart3, Wifi, Languages, Newspaper,
    ChevronRight, Sparkles, BookOpen, Target, Trophy, Zap
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
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

const features = [
    { icon: Brain, titleKey: 'feature_ai_title' as const, descKey: 'feature_ai_desc' as const, color: 'from-purple-500 to-indigo-600' },
    { icon: Users, titleKey: 'feature_community_title' as const, descKey: 'feature_community_desc' as const, color: 'from-emerald-500 to-teal-600' },
    { icon: BarChart3, titleKey: 'feature_tracker_title' as const, descKey: 'feature_tracker_desc' as const, color: 'from-amber-500 to-orange-600' },
    { icon: Wifi, titleKey: 'feature_offline_title' as const, descKey: 'feature_offline_desc' as const, color: 'from-cyan-500 to-blue-600' },
    { icon: Languages, titleKey: 'feature_bilingual_title' as const, descKey: 'feature_bilingual_desc' as const, color: 'from-pink-500 to-rose-600' },
    { icon: Newspaper, titleKey: 'feature_digest_title' as const, descKey: 'feature_digest_desc' as const, color: 'from-violet-500 to-purple-600' },
];

const testimonials = [
    { name: 'Priya S.', city: 'Chennai', text: 'The NCERT summaries saved me months of note-making. Cleared Prelims in my first attempt!', avatar: '👩‍🎓' },
    { name: 'Rajesh K.', city: 'Coimbatore', text: 'AI Answer Checker helped me understand UPSC marking patterns. The Tamil support is a game-changer.', avatar: '👨‍💼' },
    { name: 'Anitha M.', city: 'Madurai', text: 'Best free resource I have found. The community forum keeps me motivated during my preparation.', avatar: '👩‍💻' },
];

export default function HomePage() {
    const { t } = useLanguage();

    return (
        <>
            {/* Hero Section */}
            <section className="hero-bg relative overflow-hidden min-h-[90vh] flex items-center">
                {/* Floating decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                    <div className="text-center max-w-4xl mx-auto">
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
                            className="text-lg sm:text-xl text-blue-100/90 max-w-2xl mx-auto mb-10 leading-relaxed"
                        >
                            {t('hero_subtitle')}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <Link href="/syllabus"
                                className="w-full sm:w-auto px-8 py-4 bg-white text-primary-800 font-bold rounded-xl
                  hover:bg-blue-50 transition-all duration-300 shadow-xl hover:shadow-2xl
                  hover:-translate-y-0.5 flex items-center justify-center gap-2 text-lg">
                                <BookOpen className="w-5 h-5" />
                                {t('hero_cta_syllabus')}
                            </Link>
                            <Link href="/features"
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold rounded-xl
                  hover:from-accent-400 hover:to-accent-500 transition-all duration-300 shadow-xl hover:shadow-2xl
                  hover:-translate-y-0.5 flex items-center justify-center gap-2 text-lg animate-pulse-glow">
                                <Zap className="w-5 h-5" />
                                {t('hero_cta_quiz')}
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="bg-gradient-to-r from-primary-800 via-primary-700 to-primary-800 py-8 -mt-1">
                <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <StatCounter value="10,000+" label={t('stats_aspirants').replace('10,000+ ', '')} />
                    <StatCounter value="100%" label={t('stats_ncert').replace('100% ', '')} />
                    <StatCounter value="Daily" label={t('stats_current_affairs').replace('Daily ', '')} />
                    <StatCounter value="500+" label={t('stats_topics').replace('500+ ', '')} />
                </div>
            </section>

            {/* Features Section */}
            <section className="section-padding" style={{ background: 'var(--bg-primary)' }}>
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4 gradient-text">
                            {t('features_title')}
                        </h2>
                        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                            {t('features_subtitle')}
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feat, i) => {
                            const Icon = feat.icon;
                            return (
                                <motion.div
                                    key={feat.titleKey}
                                    custom={i}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeUp}
                                    className="group p-6 rounded-2xl border card-hover cursor-pointer"
                                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4
                    group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                                    >
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="font-heading font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                                        {t(feat.titleKey)}
                                    </h3>
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                        {t(feat.descKey)}
                                    </p>
                                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-accent-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Learn more <ChevronRight className="w-4 h-4" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Syllabus Quick Access */}
            <section className="section-padding" style={{ background: 'var(--bg-secondary)' }}>
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4 gradient-text">
                            Quick Syllabus Access
                        </h2>
                        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                            Jump straight to any paper. All content is free and aligned with UPSC official syllabus.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                            { label: 'Prelims GS1', icon: Target, href: '/syllabus?tab=prelims' },
                            { label: 'CSAT', icon: Brain, href: '/syllabus?tab=prelims&sub=csat' },
                            { label: 'Mains GS1', icon: BookOpen, href: '/syllabus?tab=mains' },
                            { label: 'Mains GS2', icon: Users, href: '/syllabus?tab=mains&sub=gs2-mains' },
                            { label: 'Mains GS3', icon: BarChart3, href: '/syllabus?tab=mains&sub=gs3-mains' },
                            { label: 'Ethics GS4', icon: Trophy, href: '/syllabus?tab=mains&sub=gs4-mains' },
                        ].map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <motion.div key={item.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                                    <Link href={item.href}
                                        className="flex flex-col items-center gap-3 p-6 rounded-2xl border card-hover text-center"
                                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                        <Icon className="w-8 h-8 text-primary-700 dark:text-primary-400" />
                                        <span className="font-heading font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="section-padding" style={{ background: 'var(--bg-primary)' }}>
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4 gradient-text">
                            Loved by Aspirants
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div key={t.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-3xl">{t.avatar}</span>
                                    <div>
                                        <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.city}</div>
                                    </div>
                                </div>
                                <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
                                    &ldquo;{t.text}&rdquo;
                                </p>
                                <div className="mt-3 flex gap-1">{[...Array(5)].map((_, j) => <span key={j} className="text-accent-500 text-sm">★</span>)}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="hero-bg relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
                            {t('cta_title')}
                        </h2>
                        <p className="text-lg text-blue-100/90 mb-8 max-w-xl mx-auto">
                            {t('cta_subtitle')}
                        </p>
                        <Link href="/syllabus"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-800 font-bold rounded-xl
                hover:bg-blue-50 transition-all duration-300 shadow-xl hover:shadow-2xl text-lg">
                            {t('cta_button')} <ChevronRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
