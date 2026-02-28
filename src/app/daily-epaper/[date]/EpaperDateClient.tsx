'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import {
    Newspaper, Calendar, Search, ChevronDown,
    Globe, Scale, Leaf, Cpu, Landmark, BookOpen, TrendingUp,
    Clock, ExternalLink, Loader2, Zap, FileText, Shield,
    Wheat, Compass, MapPin, History, CloudRain, Archive,
    ChevronLeft
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types (same as main page)
// ---------------------------------------------------------------------------

interface EpaperArticle {
    id: string;
    headline: string;
    explainer: string;
    category: string;
    gsPaper: string;
    gsSubTopics: string[];
    date: string;
    source: string;
    sourceUrl: string;
    importance: 'high' | 'medium' | 'low';
    tags: string[];
    keyTerms: string[];
    prelims: boolean;
    prelimsPoints: string[];
    mains: boolean;
    mainsPoints: string[];
    imageDescription: string;
    section: string;
}

interface DailyEpaper {
    date: string;
    dateFormatted: string;
    lastUpdated: string;
    articles: EpaperArticle[];
    articlesByGS: Record<string, EpaperArticle[]>;
    sources: string[];
    totalScraped: number;
    totalProcessed: number;
    highlights: string[];
    availableDates?: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GS_PAPERS = [
    { id: 'all', label: 'All Papers', icon: Newspaper, color: '#6366F1' },
    { id: 'GS1', label: 'GS-I', sublabel: 'History · Society · Geography', icon: History, color: '#8B5CF6' },
    { id: 'GS2', label: 'GS-II', sublabel: 'Polity · Governance · IR', icon: Landmark, color: '#3B82F6' },
    { id: 'GS3', label: 'GS-III', sublabel: 'Economy · Env · Security · S&T', icon: TrendingUp, color: '#10B981' },
    { id: 'GS4', label: 'GS-IV', sublabel: 'Ethics · Integrity', icon: Compass, color: '#F59E0B' },
];

const CATEGORY_ICONS: Record<string, any> = {
    polity: Landmark, governance: FileText, economy: TrendingUp,
    ir: Globe, environment: Leaf, science: Cpu, social: Scale,
    history: History, geography: MapPin, security: Shield,
    agriculture: Wheat, disaster: CloudRain, ethics: Compass,
};

const IMPORTANCE_STYLES: Record<string, string> = {
    high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    low: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
};

const GS_BG_CLASSES: Record<string, string> = {
    GS1: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30',
    GS2: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
    GS3: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    GS4: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
};

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
    }),
};

// ---------------------------------------------------------------------------
// Article Card (matches main page)
// ---------------------------------------------------------------------------

function ArticleCard({ article, index }: { article: EpaperArticle; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const CatIcon = CATEGORY_ICONS[article.category] || Newspaper;

    return (
        <motion.article custom={index} variants={fadeUp} initial="hidden" whileInView="visible"
            viewport={{ once: true }} className="epaper-article-card group" id={`article-${article.id}`}>
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border ${GS_BG_CLASSES[article.gsPaper] || GS_BG_CLASSES.GS2}`}>
                        {article.gsPaper}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                        <CatIcon className="w-3 h-3 inline mr-1" />{article.category}
                    </span>
                </div>
                <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-md border ${IMPORTANCE_STYLES[article.importance]}`}>
                    {article.importance}
                </span>
            </div>

            <h3 className="epaper-headline group-hover:text-accent-500 transition-colors">
                {article.headline}
            </h3>

            <div className="epaper-image-placeholder">
                <Newspaper className="w-6 h-6 opacity-40" />
                <span className="text-xs opacity-60 mt-1">{article.imageDescription}</span>
            </div>

            <div className={`epaper-explainer ${!expanded ? 'line-clamp-6' : ''}`}>
                {article.explainer.split('\n\n').map((para, i) => (
                    <p key={i} className="mb-3 last:mb-0">{para}</p>
                ))}
            </div>

            {article.explainer.length > 400 && (
                <button onClick={() => setExpanded(!expanded)}
                    className="text-xs font-medium text-accent-500 hover:text-accent-400 mt-1 flex items-center gap-1">
                    {expanded ? 'Show Less' : 'Read Full Explainer'}
                    <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
            )}

            {article.keyTerms && article.keyTerms.length > 0 && (
                <div className="mt-4 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>📌 Key Terms</p>
                    <div className="flex flex-wrap gap-1.5">
                        {article.keyTerms.map((term) => (
                            <span key={term} className="text-xs px-2.5 py-1 rounded-full font-medium"
                                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                                {term}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {article.prelims && article.prelimsPoints && article.prelimsPoints.length > 0 && (
                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">📝 Prelims Pointers</p>
                        <ul className="space-y-1.5">
                            {article.prelimsPoints.map((pt, i) => (
                                <li key={i} className="text-xs leading-relaxed flex items-start gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                    <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>{pt}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {article.mains && article.mainsPoints && article.mainsPoints.length > 0 && (
                    <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2">✍️ Mains Dimensions</p>
                        <ul className="space-y-1.5">
                            {article.mainsPoints.map((pt, i) => (
                                <li key={i} className="text-xs leading-relaxed flex items-start gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                    <span className="text-purple-500 mt-0.5 flex-shrink-0">•</span>{pt}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-1.5 mt-4">
                {article.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>#{tag}</span>
                ))}
            </div>

            <div className="flex items-center justify-between pt-3 mt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{article.date}</span>
                    {article.sourceUrl && article.sourceUrl !== '#' ? (
                        <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-accent-500 transition-colors"
                            onClick={(e) => e.stopPropagation()}>
                            <ExternalLink className="w-3 h-3" />{article.source}
                        </a>
                    ) : (
                        <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" />{article.source}</span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    {article.prelims && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">P</span>}
                    {article.mains && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">M</span>}
                </div>
            </div>
        </motion.article>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function EpaperDateClient({ date }: { date: string }) {
    const { t } = useLanguage();
    const [epaper, setEpaper] = useState<DailyEpaper | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeGS, setActiveGS] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/epaper?date=${date}`);
                if (!res.ok) throw new Error('ePaper not found for this date');
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setEpaper(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [date]);

    const filteredArticles = useMemo(() => {
        if (!epaper) return [];
        let articles = epaper.articles;
        if (activeGS !== 'all') articles = articles.filter((a) => a.gsPaper === activeGS);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            articles = articles.filter((a) =>
                a.headline.toLowerCase().includes(q) ||
                a.explainer.toLowerCase().includes(q) ||
                a.tags.some((t) => t.toLowerCase().includes(q))
            );
        }
        return articles;
    }, [epaper, activeGS, searchQuery]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary-500" />
                    <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>Loading ePaper for {date}…</p>
                </div>
            </div>
        );
    }

    if (error || !epaper) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="glass-card p-12 text-center max-w-md">
                    <Newspaper className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                    <h2 className="text-xl font-heading font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        ePaper Not Available
                    </h2>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                        {error || `No ePaper found for ${date}`}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Link href="/daily-epaper" className="btn-primary text-sm !px-4 !py-2.5 flex items-center gap-2">
                            <ChevronLeft className="w-4 h-4" />Latest ePaper
                        </Link>
                        <Link href="/daily-epaper/archive" className="btn-outline text-sm !px-4 !py-2.5 flex items-center gap-2">
                            <Archive className="w-4 h-4" />Archive
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--bg-primary)' }}>
            {/* Masthead */}
            <header className="epaper-masthead">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="epaper-rule-double mb-4" />

                    <div className="flex items-center justify-between mb-2">
                        <Link href="/daily-epaper"
                            className="text-xs flex items-center gap-1 hover:text-accent-500 transition-colors"
                            style={{ color: 'var(--text-muted)' }}>
                            <ChevronLeft className="w-3 h-3" /> Latest Edition
                        </Link>
                        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                            Archive Edition
                        </span>
                    </div>

                    <div className="text-center py-4">
                        <h1 className="epaper-title">
                            <span className="text-primary-800 dark:text-primary-300">Current</span>
                            <span className="text-accent-500">Prep</span>
                            <span className="epaper-title-divider">|</span>
                            <span style={{ color: 'var(--text-primary)' }}>Daily ePaper</span>
                        </h1>
                        <p className="text-lg font-heading font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {epaper.dateFormatted}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {epaper.articles.length} articles ·{' '}
                            {epaper.articles.filter((a) => a.importance === 'high').length} high priority ·{' '}
                            {epaper.sources.join(', ')}
                        </p>
                    </div>

                    <div className="epaper-rule-double mt-4" />
                </div>
            </header>

            {/* Search + GS tabs */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="relative mb-4">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search this edition…" className="input-field !pl-10 !py-2.5 text-sm" />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {GS_PAPERS.map((gs) => {
                        const count = gs.id === 'all'
                            ? filteredArticles.length
                            : filteredArticles.filter((a) => a.gsPaper === gs.id).length;
                        return (
                            <button key={gs.id} onClick={() => setActiveGS(gs.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeGS === gs.id ? 'text-white shadow-lg' : 'glass-card hover:shadow-md'}`}
                                style={activeGS === gs.id ? { background: gs.color } : { color: 'var(--text-secondary)' }}>
                                <gs.icon className="w-4 h-4" />{gs.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeGS === gs.id ? 'bg-white/20' : 'bg-primary-800/5 dark:bg-primary-400/5'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Articles */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {filteredArticles.length === 0 ? (
                    <div className="glass-card p-16 text-center">
                        <Newspaper className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>No articles match your filters</p>
                    </div>
                ) : (
                    <div className="epaper-articles-grid">
                        {filteredArticles.map((article, i) => (
                            <ArticleCard key={article.id} article={article} index={i} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
