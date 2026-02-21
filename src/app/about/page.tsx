'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import { Target, Heart, Users, Globe, Lightbulb, Shield, TrendingUp, XCircle } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.5 },
    }),
};

const team = [
    { name: 'Arjun Sharma', role: 'Founder & CEO', desc: 'Former UPSC aspirant, IIT Delhi alumnus. Built CurrentPrep to solve problems he faced during his own preparation.', emoji: '👨‍💻' },
    { name: 'Kavitha R.', role: 'Content Head', desc: 'M.A. History, JNU. 5 years of UPSC content creation. Ensures all summaries are accurate and exam-relevant.', emoji: '👩‍🏫' },
    { name: 'Vikram P.', role: 'Tech Lead', desc: 'Full-stack developer with passion for EdTech. Builds the AI tools and ensures the platform runs smoothly.', emoji: '👨‍🔧' },
    { name: 'Deepa M.', role: 'Community Manager', desc: 'IAS 2019 batch (AIR 342). Manages the forum, mentorship program, and aspirant support.', emoji: '👩‍⚖️' },
];

const blueOcean = [
    { icon: XCircle, label: 'Eliminate', items: ['Expensive live video classes', 'Crowded batch limitations', 'Geographic restrictions', 'Hidden fee structures'], color: 'text-red-500' },
    { icon: TrendingUp, label: 'Raise', items: ['Free syllabus-aligned content quality', 'Mobile-first offline access', 'AI-powered personalization', 'Community engagement depth'], color: 'text-green-500' },
    { icon: Lightbulb, label: 'Create', items: ['Tamil language support', 'Walking-break wellness timers', 'Peer answer review system', 'Gamified study tracking'], color: 'text-accent-500' },
];

export default function AboutPage() {
    const { t } = useLanguage();

    return (
        <div style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <section className="hero-bg py-16 lg:py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
                        {t('about_title')}
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-lg text-blue-100/90 max-w-xl mx-auto">
                        {t('about_mission')}
                    </motion.p>
                </div>
            </section>

            {/* Mission */}
            <section className="section-padding">
                <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400 text-sm font-medium mb-4">
                            <Heart className="w-4 h-4" /> Our Mission
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-6 gradient-text">
                            Democratizing UPSC Prep for Self-Study Warriors
                        </h2>
                        <p className="text-base leading-relaxed max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                            Every year, millions of aspirants across India dream of cracking the UPSC Civil Services Exam.
                            But most quality resources are locked behind expensive coaching centers concentrated in metros like Delhi.
                            We believe a student in Chennai, Coimbatore, or Madurai deserves the same access as someone in Rajinder Nagar.
                        </p>
                        <p className="text-base leading-relaxed max-w-3xl mx-auto mt-4" style={{ color: 'var(--text-secondary)' }}>
                            CurrentPrep was born from this belief. We curate free, public-domain content—NCERT summaries,
                            official syllabus breakdowns, previous year papers—and enhance it with AI-powered tools.
                            No subscriptions needed. No video classes. Just pure, focused self-study resources designed for aspirants
                            who are disciplined enough to chart their own path.
                        </p>
                    </motion.div>

                    {/* Values */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
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

            {/* Blue Ocean Strategy */}
            <section className="section-padding" style={{ background: 'var(--bg-secondary)' }}>
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-8 gradient-text text-center">
                        Our Blue Ocean Strategy
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {blueOcean.map((col, i) => {
                            const Icon = col.icon;
                            return (
                                <motion.div key={col.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                    className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Icon className={`w-6 h-6 ${col.color}`} />
                                        <h3 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{col.label}</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {col.items.map((item) => (
                                            <li key={item} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${col.color.replace('text-', 'bg-')}`} />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="section-padding">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-8 gradient-text text-center">
                        Meet the Team
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {team.map((member, i) => (
                            <motion.div key={member.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                className="p-6 rounded-2xl border text-center card-hover" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                <span className="text-5xl block mb-3">{member.emoji}</span>
                                <h3 className="font-heading font-semibold" style={{ color: 'var(--text-primary)' }}>{member.name}</h3>
                                <div className="text-xs text-accent-500 font-medium mb-2">{member.role}</div>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{member.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
