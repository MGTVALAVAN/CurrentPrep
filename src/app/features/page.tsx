'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import {
    Brain, Upload, Route, MessageSquare, Users, UserCheck,
    Newspaper, Rss, Clock, BarChart3, Trophy, Footprints,
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

const communityFeatures = [
    { icon: MessageSquare, title: 'Discussion Threads', desc: 'Prelims strategy, Mains answer writing, Optional selection — active threads for every topic.' },
    { icon: Users, title: 'Study Groups', desc: 'Form groups with fellow aspirants in your city. Accountability partners, mock test discussions.' },
    { icon: UserCheck, title: 'Mentor Matching', desc: 'Connect with aspirants who cleared CSE. Get guidance on strategy, optionals, and interview prep.' },
];

const currentAffairsItems = [
    { date: '2025-01-20', title: 'Union Budget 2025-26: Key Highlights for UPSC', category: 'Economy', source: 'PIB' },
    { date: '2025-01-19', title: 'India-ASEAN Summit: Strategic Implications', category: 'International Relations', source: 'The Hindu' },
    { date: '2025-01-18', title: 'New Education Policy: Implementation Status', category: 'Governance', source: 'Yojana' },
    { date: '2025-01-17', title: 'Climate Change & India: COP29 Commitments', category: 'Environment', source: 'PIB' },
    { date: '2025-01-16', title: 'Supreme Court on Judicial Appointments', category: 'Polity', source: 'The Hindu' },
    { date: '2025-01-15', title: 'ISRO Gaganyaan Mission Update', category: 'Science & Tech', source: 'ISRO' },
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

            {/* Community */}
            <section className="section-padding" style={{ background: 'var(--bg-secondary)' }}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-8 gradient-text">
                        Community & Mentorship
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {communityFeatures.map((feat, i) => {
                            const Icon = feat.icon;
                            return (
                                <motion.div key={feat.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                    className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                    <Icon className="w-10 h-10 text-primary-700 dark:text-primary-400 mb-4" />
                                    <h3 className="font-heading font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{feat.title}</h3>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{feat.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Forum Preview */}
                    <div className="mt-8 rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
                            <MessageSquare className="w-4 h-4 text-accent-500" />
                            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Latest Forum Threads</span>
                        </div>
                        {[
                            { title: 'How to complete NCERT reading in 3 months?', replies: 34, category: 'Strategy' },
                            { title: 'GS4 Ethics case study practice – share your answers', replies: 56, category: 'Mains' },
                            { title: 'Best optional for working professionals?', replies: 89, category: 'Optional' },
                            { title: 'Daily current affairs quiz – January Week 3', replies: 22, category: 'Prelims' },
                        ].map((thread) => (
                            <div key={thread.title} className="px-5 py-3 border-b last:border-b-0 flex items-center justify-between hover:bg-primary-800/5 dark:hover:bg-primary-400/5 transition-colors cursor-pointer"
                                style={{ borderColor: 'var(--border-color)' }}>
                                <div>
                                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{thread.title}</div>
                                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{thread.category} • {thread.replies} replies</div>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-800/10 dark:bg-primary-400/10 text-primary-800 dark:text-primary-300">
                                    Active
                                </span>
                            </div>
                        ))}
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
                    <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-8 gradient-text">
                        Current Affairs Feed
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentAffairsItems.map((item, i) => (
                            <motion.div key={item.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                className="p-5 rounded-2xl border card-hover cursor-pointer"
                                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400 font-medium">
                                        {item.category}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.source}</span>
                                </div>
                                <h3 className="font-medium text-sm leading-snug mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    <Clock className="w-3 h-3" /> {item.date}
                                </div>
                            </motion.div>
                        ))}
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
