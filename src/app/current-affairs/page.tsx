'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import {
    Newspaper, Calendar, Tag, Search, ChevronRight,
    Globe, Scale, Leaf, Cpu, Landmark, BookOpen,
    TrendingUp, Clock, ExternalLink, Filter
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
    }),
};

const categoryFilters = [
    { id: 'all', label: 'All Topics', icon: Newspaper },
    { id: 'polity', label: 'Polity & Governance', icon: Landmark },
    { id: 'economy', label: 'Economy', icon: TrendingUp },
    { id: 'ir', label: 'International Relations', icon: Globe },
    { id: 'environment', label: 'Environment', icon: Leaf },
    { id: 'science', label: 'Science & Tech', icon: Cpu },
    { id: 'social', label: 'Social Issues', icon: Scale },
];

const monthlyCompilations = [
    { month: 'January 2025', topics: 145, downloads: '2.3k', available: true },
    { month: 'December 2024', topics: 138, downloads: '4.1k', available: true },
    { month: 'November 2024', topics: 152, downloads: '3.8k', available: true },
    { month: 'October 2024', topics: 129, downloads: '3.5k', available: true },
];

const currentAffairs = [
    {
        id: 1,
        title: 'Union Budget 2025-26: Key Highlights for UPSC',
        summary: 'Comprehensive analysis of Budget 2025-26 — fiscal deficit at 4.4%, capital expenditure increased to ₹11.2 lakh crore, new income tax slabs, and focus on green energy, infrastructure, and digital economy.',
        category: 'economy',
        date: '2025-02-01',
        source: 'PIB / Ministry of Finance',
        importance: 'high',
        tags: ['Budget', 'Fiscal Policy', 'Economy'],
        prelims: true, mains: true,
        gsRelevance: ['GS-III: Economy', 'GS-II: Governance'],
    },
    {
        id: 2,
        title: 'Supreme Court Ruling on Electoral Bonds Scheme',
        summary: 'The Supreme Court struck down the Electoral Bonds scheme as unconstitutional, citing violation of Right to Information under Article 19(1)(a). The court ordered SBI to share all bond purchase details with the Election Commission.',
        category: 'polity',
        date: '2025-01-28',
        source: 'Supreme Court of India',
        importance: 'high',
        tags: ['Judiciary', 'Elections', 'Fundamental Rights'],
        prelims: true, mains: true,
        gsRelevance: ['GS-II: Polity', 'GS-II: Governance'],
    },
    {
        id: 3,
        title: 'ISRO Successfully Launches GSLV Mk-III with Navigation Satellite',
        summary: 'ISRO placed the NVS-02 satellite into orbit using GSLV Mk-III. This is the second satellite in India\'s next-gen navigation constellation (NavIC), enhancing position accuracy to sub-meter level.',
        category: 'science',
        date: '2025-01-25',
        source: 'ISRO',
        importance: 'medium',
        tags: ['ISRO', 'NavIC', 'Space'],
        prelims: true, mains: false,
        gsRelevance: ['GS-III: Science & Tech'],
    },
    {
        id: 4,
        title: 'India-EU Free Trade Agreement: 12th Round of Negotiations',
        summary: 'India and EU concluded their 12th round of FTA negotiations covering goods, services, digital trade, and sustainable development. Key issues include data localization norms, dairy & agriculture subsidies, and carbon border adjustment mechanism.',
        category: 'ir',
        date: '2025-01-22',
        source: 'Ministry of Commerce',
        importance: 'medium',
        tags: ['FTA', 'EU', 'Trade Policy'],
        prelims: false, mains: true,
        gsRelevance: ['GS-II: IR', 'GS-III: Economy'],
    },
    {
        id: 5,
        title: 'National Green Hydrogen Mission: Progress Report 2024',
        summary: 'India\'s Green Hydrogen Mission achieved 50,000 tonnes annual production capacity. Government announced new PLI incentives for electrolyzer manufacturing and green hydrogen export corridors to Europe and Japan.',
        category: 'environment',
        date: '2025-01-20',
        source: 'Ministry of New & Renewable Energy',
        importance: 'medium',
        tags: ['Green Hydrogen', 'Renewable Energy', 'Climate'],
        prelims: true, mains: true,
        gsRelevance: ['GS-III: Environment', 'GS-III: Economy'],
    },
    {
        id: 6,
        title: 'Census 2025 Notification: Digital Census with AI Integration',
        summary: 'Government notified Census 2025 to be conducted using a digital-first approach with mobile app-based enumeration, AI-assisted data verification, and real-time demographic dashboards available to public.',
        category: 'polity',
        date: '2025-01-18',
        source: 'Ministry of Home Affairs',
        importance: 'high',
        tags: ['Census', 'Demographics', 'e-Governance'],
        prelims: true, mains: true,
        gsRelevance: ['GS-I: Society', 'GS-II: Governance'],
    },
    {
        id: 7,
        title: 'Semiconductor Fab: India\'s First Chip Unit Lays Foundation in Gujarat',
        summary: 'The first semiconductor fabrication unit under India Semiconductor Mission began construction in Dholera SIR, Gujarat. The ₹91,000 crore project in partnership with Micron Technology will produce memory chips by 2027.',
        category: 'science',
        date: '2025-01-15',
        source: 'MeitY',
        importance: 'medium',
        tags: ['Semiconductor', 'Make in India', 'Technology'],
        prelims: true, mains: true,
        gsRelevance: ['GS-III: Science & Tech', 'GS-III: Economy'],
    },
    {
        id: 8,
        title: 'Forest Rights Act: New Guidelines for Community Forest Resource Rights',
        summary: 'Ministry of Tribal Affairs issued revised guidelines for implementation of Forest Rights Act 2006, simplifying the process for Community Forest Resource rights claims. Over 75,000 pending claims to be fast-tracked.',
        category: 'social',
        date: '2025-01-12',
        source: 'Ministry of Tribal Affairs',
        importance: 'medium',
        tags: ['FRA', 'Tribal Rights', 'Environment'],
        prelims: true, mains: true,
        gsRelevance: ['GS-I: Society', 'GS-II: Governance', 'GS-III: Environment'],
    },
];

const importanceColors: Record<string, string> = {
    high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    low: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
};

export default function CurrentAffairsPage() {
    const { t } = useLanguage();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = currentAffairs.filter(item => {
        const matchCat = activeCategory === 'all' || item.category === activeCategory;
        const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.summary.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });

    return (
        <div style={{ background: 'var(--bg-primary)' }}>
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="hero-bg py-16 lg:py-20">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-900/30" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm mb-6">
                                <Newspaper className="w-4 h-4" />
                                <span>Daily UPSC Current Affairs</span>
                            </div>
                        </motion.div>
                        <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
                            className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                            Current Affairs Hub
                        </motion.h1>
                        <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
                            className="text-primary-200 text-lg max-w-2xl mx-auto">
                            UPSC-focused daily news analysis with Prelims/Mains relevance tags, GS paper mapping, and monthly compilations.
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* Search Bar */}
            <section className="px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="glass-card p-4 shadow-xl">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5"
                                style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="text" value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search current affairs by topic, keyword, or GS paper..."
                                className="input-field !pl-11"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Category Tabs */}
            <section className="px-4 sm:px-6 lg:px-8 mt-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {categoryFilters.map((cat) => (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeCategory === cat.id
                                    ? 'bg-primary-800 text-white shadow-lg'
                                    : 'glass-card hover:shadow-md'
                                    }`}
                                style={activeCategory !== cat.id ? { color: 'var(--text-secondary)' } : {}}>
                                <cat.icon className="w-4 h-4" />
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="section-padding">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* News List */}
                    <div className="lg:col-span-2 space-y-4">
                        {filtered.length === 0 ? (
                            <div className="glass-card p-12 text-center">
                                <Newspaper className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                                <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    No articles found
                                </p>
                            </div>
                        ) : (
                            filtered.map((item, i) => (
                                <motion.article key={item.id} custom={i} variants={fadeUp} initial="hidden"
                                    whileInView="visible" viewport={{ once: true }}
                                    className="glass-card p-6 card-hover cursor-pointer group">

                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <h3 className="font-heading font-semibold text-lg group-hover:text-accent-500 transition-colors"
                                            style={{ color: 'var(--text-primary)' }}>
                                            {item.title}
                                        </h3>
                                        <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-md border whitespace-nowrap ${importanceColors[item.importance]}`}>
                                            {item.importance}
                                        </span>
                                    </div>

                                    {/* Summary */}
                                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                                        {item.summary}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {item.tags.map((tag) => (
                                            <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
                                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Relevance Badges */}
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        {item.prelims && (
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                📝 Prelims Relevant
                                            </span>
                                        )}
                                        {item.mains && (
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                                ✍️ Mains Relevant
                                            </span>
                                        )}
                                        {item.gsRelevance.map((gs) => (
                                            <span key={gs} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                {gs}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t"
                                        style={{ borderColor: 'var(--border-color)' }}>
                                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {item.date}</span>
                                            <span className="flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> {item.source}</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-accent-500" />
                                    </div>
                                </motion.article>
                            ))
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Monthly Compilations */}
                        <div className="glass-card p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <BookOpen className="w-5 h-5 text-primary-500" />
                                <h3 className="font-heading font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                                    Monthly Compilations
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {monthlyCompilations.map((comp, i) => (
                                    <div key={i}
                                        className="flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:bg-primary-800/5 dark:hover:bg-primary-400/5 cursor-pointer">
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {comp.month}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {comp.topics} topics · {comp.downloads} downloads
                                            </p>
                                        </div>
                                        <span className="text-xs px-3 py-1.5 rounded-lg bg-primary-800/10 text-primary-800 dark:bg-primary-400/10 dark:text-primary-300 font-medium">
                                            PDF ↓
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Exam Tips */}
                        <div className="glass-card p-5 border-2 border-accent-500/20">
                            <h3 className="font-heading font-semibold text-base mb-3" style={{ color: 'var(--text-primary)' }}>
                                💡 Current Affairs Tips
                            </h3>
                            <ul className="space-y-2.5">
                                {[
                                    'Read 2 newspapers daily — The Hindu + Indian Express',
                                    'Make subject-wise notes linking CA to static syllabus',
                                    'Revise monthly compilations every weekend',
                                    'Focus on government schemes, judiciary, & S&T',
                                    'Practice MCQs from current affairs weekly',
                                ].map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        <span className="text-accent-500 mt-0.5">•</span>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Trending Topics */}
                        <div className="glass-card p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-accent-500" />
                                <h3 className="font-heading font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                                    Trending This Week
                                </h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    'Union Budget', 'Electoral Bonds', 'NavIC', 'Green Hydrogen',
                                    'Census 2025', 'India-EU FTA', 'Semiconductor', 'Forest Rights',
                                    'AI Governance', 'Digital India'
                                ].map((topic, i) => (
                                    <span key={i} className="text-xs px-3 py-1.5 rounded-full cursor-pointer transition-all hover:bg-accent-500/10 hover:text-accent-500"
                                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                        #{topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
