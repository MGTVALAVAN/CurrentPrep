'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import {
    Brain, Upload, Route,
    Newspaper, Rss, BarChart3, Trophy, Footprints,
    Sparkles, CheckCircle2
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.5 },
    }),
};

const aiTools = [
    {
        icon: Brain, title: 'AI Quiz Generator', titleTa: 'AI வினாடி வினா உருவாக்கி',
        desc: 'Generate unlimited practice quizzes aligned with UPSC syllabus. Choose topic, difficulty, and number of questions. Get instant scoring with detailed explanations.',
        descTa: 'UPSC பாடத்திட்டத்துடன் இணைந்த வரம்பற்ற பயிற்சி வினாடி வினாக்களை உருவாக்கவும்.',
        color: 'from-violet-500 to-purple-600',
        features: ['Prelims MCQs', 'Mains-style questions', 'Topic-wise or mixed', 'Difficulty: Easy/Medium/Hard'],
    },
    {
        icon: Upload, title: 'Answer Evaluation', titleTa: 'பதில் மதிப்பீடு',
        desc: 'Upload a photo of your handwritten answer or type an essay. Our AI evaluates it against UPSC standards—structure, content, word limit, and presentation.',
        descTa: 'உங்கள் கையெழுத்து பதிலின் புகைப்படத்தை பதிவேற்றவும். UPSC தரநிலைகளுக்கு எதிராக AI மதிப்பீடு செய்யும்.',
        color: 'from-emerald-500 to-teal-600',
        features: ['Photo upload or text input', 'Structure & content scores', 'Improvement suggestions', 'Model answer comparison'],
    },
    {
        icon: Route, title: 'Personalized Study Roadmap', titleTa: 'தனிப்பயனாக்கப்பட்ட படிப்பு வழிகாட்டி',
        desc: 'Tell us your target exam year, available study hours, and background. Get a customized week-by-week study plan covering all subjects with NCERT reading schedules.',
        descTa: 'உங்கள் இலக்கு தேர்வு ஆண்டு, படிப்பு நேரம் ஆகியவற்றைக் கூறுங்கள். தனிப்பயனாக்கப்பட்ட வாரம்-வாரம் படிப்பு திட்டத்தைப் பெறுங்கள்.',
        color: 'from-amber-500 to-orange-600',
        features: ['Week-by-week schedule', 'Subject prioritization', 'Revision cycles built-in', 'Adaptive to your progress'],
    },
];



const badges = [
    { icon: '🏆', name: 'First Quiz', desc: 'Complete your first quiz' },
    { icon: '🔥', name: '7-Day Streak', desc: 'Study 7 days in a row' },
    { icon: '📚', name: 'NCERT Master', desc: 'Complete all NCERT summaries' },
    { icon: '🚶', name: 'Healthy Mind', desc: '10 walking breaks taken' },
    { icon: '✍️', name: 'Essay Writer', desc: 'Submit 5 essay evaluations' },
    { icon: '🎯', name: 'Prelims Ready', desc: 'Score 60%+ on mock test' },
];

export default function FeaturesPage() {
    const { t, language } = useLanguage();

    return (
        <div style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <section className="hero-bg py-16 lg:py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
                        {t('features_page_title')}
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-lg text-blue-100/90 max-w-2xl mx-auto">
                        {t('features_page_subtitle')}
                    </motion.p>
                </div>
            </section>

            {/* AI Tools */}
            <section className="section-padding">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-accent-500" />
                        <span className="text-sm font-semibold text-accent-500 uppercase tracking-wider">AI-Powered</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-8 gradient-text">
                        Smart Tools for Smarter Prep
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {aiTools.map((tool, i) => {
                            const Icon = tool.icon;
                            const title = language === 'ta' ? tool.titleTa : tool.title;
                            const desc = language === 'ta' ? tool.descTa : tool.desc;
                            return (
                                <motion.div key={tool.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                    className="group p-6 rounded-2xl border card-hover"
                                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-5
                    group-hover:scale-110 transition-transform shadow-lg`}>
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="font-heading font-semibold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                                    <ul className="space-y-1.5">
                                        {tool.features.map((f) => (
                                            <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button className="mt-5 btn-primary text-sm w-full">Try Now – Free</button>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>


            {/* Daily Digest */}
            <section className="section-padding">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <Rss className="w-5 h-5 text-accent-500" />
                        <span className="text-sm font-semibold text-accent-500 uppercase tracking-wider">Daily Digest</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-3 gradient-text">
                        Your Daily UPSC Current Affairs Hub
                    </h2>
                    <p className="text-base leading-relaxed mb-8 max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
                        Every morning, we curate the most UPSC-relevant news from The Hindu, Indian Express, PIB, and other authoritative sources.
                        Each article is analysed for GS relevance, tagged with Prelims &amp; Mains pointers, and enriched with key terms and explainers —
                        so you spend less time hunting for news and more time mastering it.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Current Affairs */}
                        <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            className="p-6 rounded-2xl border card-hover"
                            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-5 shadow-lg">
                                <Newspaper className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="font-heading font-semibold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                                Current Affairs
                            </h3>
                            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                                A newspaper-style page updated daily with 15–20 curated articles. Each article comes with GS paper tagging,
                                importance levels, detailed explainers, key terms, and Prelims/Mains pointers. Searchable and filterable.
                            </p>
                            <ul className="space-y-1.5 mb-5">
                                {['Auto-curated from top sources', 'GS paper & category tagging', 'Prelims + Mains pointers', 'Expandable detailed analysis'].map(f => (
                                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <a href="/current-affairs" className="btn-primary text-sm w-full block text-center">
                                View Current Affairs →
                            </a>
                        </motion.div>

                        {/* Daily ePaper */}
                        <motion.div custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            className="p-6 rounded-2xl border card-hover"
                            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-5 shadow-lg">
                                <Rss className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="font-heading font-semibold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                                Daily ePaper (A4 PDF)
                            </h3>
                            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                                A beautifully designed 6–8 page A4 ePaper delivered to your inbox every morning. Print-ready layout with
                                editorial-style formatting, masthead, headlines, news briefs, and mock questions — like your own UPSC newspaper.
                            </p>
                            <ul className="space-y-1.5 mb-5">
                                {['Print-ready A4 layout', 'Emailed daily to your inbox', 'Includes Prelims MCQs & Mains Qs', 'Archive of all past editions'].map(f => (
                                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <a href="/daily-epaper/archive" className="btn-primary text-sm w-full block text-center">
                                Browse ePaper Archive →
                            </a>
                        </motion.div>

                        {/* Daily Mock */}
                        <motion.div custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            className="p-6 rounded-2xl border card-hover"
                            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-5 shadow-lg">
                                <Brain className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="font-heading font-semibold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                                Daily Mock Practice
                            </h3>
                            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                                Practice with 4–5 Prelims MCQs and 4 Mains descriptive questions generated daily from the day&apos;s current affairs.
                                Interactive answer checking, explanations, and suggested approach for every question.
                            </p>
                            <ul className="space-y-1.5 mb-5">
                                {['Current affairs-based questions', 'Interactive MCQ with explanations', 'Mains approach guidance', 'Builds up date-wise'].map(f => (
                                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <a href="/daily-mock" className="btn-primary text-sm w-full block text-center">
                                Start Practicing →
                            </a>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Progress Tracker */}
            <section className="section-padding" style={{ background: 'var(--bg-secondary)' }}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-8 gradient-text">
                        Gamified Progress Tracker
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Stats Dashboard */}
                        <div className="lg:col-span-2 p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                            <h3 className="font-heading font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                                <BarChart3 className="w-5 h-5 inline-block mr-2 text-accent-500" />
                                Your Dashboard
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                {[
                                    { label: 'Topics Covered', value: '127/500', pct: 25 },
                                    { label: 'Quizzes Taken', value: '34', pct: 68 },
                                    { label: 'Study Streak', value: '12 days', pct: 40 },
                                    { label: 'Walking Breaks', value: '8', pct: 80 },
                                ].map((stat) => (
                                    <div key={stat.label} className="text-center">
                                        <div className="text-xl font-bold text-primary-800 dark:text-primary-300">{stat.value}</div>
                                        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                                        <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400" style={{ width: `${stat.pct}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Walking Break Timer */}
                            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3">
                                    <Footprints className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    <div>
                                        <div className="font-semibold text-sm text-green-800 dark:text-green-300">Walking Break Timer</div>
                                        <div className="text-xs text-green-600 dark:text-green-400">Take a 3km walk after every 2 hours of study. Stay healthy, study better!</div>
                                    </div>
                                    <button className="ml-auto px-4 py-2 bg-green-600 text-white text-xs rounded-lg font-medium hover:bg-green-700 transition-colors">
                                        Start Timer
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <Trophy className="w-5 h-5 text-accent-500" /> Badges
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {badges.map((badge) => (
                                    <div key={badge.name} className="text-center p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                                        <span className="text-2xl">{badge.icon}</span>
                                        <div className="text-xs font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{badge.name}</div>
                                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{badge.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
