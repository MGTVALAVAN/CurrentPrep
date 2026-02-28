'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import {
    Newspaper, Calendar, Search, ChevronRight, ChevronDown,
    Globe, Scale, Leaf, Cpu, Landmark, BookOpen, TrendingUp,
    Clock, ExternalLink, RefreshCw, Loader2, Zap, CheckCircle2,
    AlertCircle, Tag, Archive, FileText, Shield, Wheat, Compass,
    MapPin, History, CloudRain, ChevronLeft, Download
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
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
    polity: Landmark,
    governance: FileText,
    economy: TrendingUp,
    ir: Globe,
    environment: Leaf,
    science: Cpu,
    social: Scale,
    history: History,
    geography: MapPin,
    security: Shield,
    agriculture: Wheat,
    disaster: CloudRain,
    ethics: Compass,
};

const IMPORTANCE_STYLES: Record<string, string> = {
    high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    low: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
};

const GS_COLORS: Record<string, string> = {
    GS1: '#8B5CF6',
    GS2: '#3B82F6',
    GS3: '#10B981',
    GS4: '#F59E0B',
};

const GS_BG_CLASSES: Record<string, string> = {
    GS1: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30',
    GS2: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
    GS3: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    GS4: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
};

// ---------------------------------------------------------------------------
// Animations
// ---------------------------------------------------------------------------

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
    }),
};

// ---------------------------------------------------------------------------
// Fallback data for when no live ePaper is available
// ---------------------------------------------------------------------------

const fallbackEpaper: DailyEpaper = {
    date: new Date().toISOString().split('T')[0],
    dateFormatted: new Date().toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
    lastUpdated: '',
    articles: [
        {
            id: 'sample-1',
            headline: 'Supreme Court on Federal Structure: Landmark Verdict on Centre-State Relations',
            explainer: 'The Supreme Court delivered a landmark judgment reinforcing the federal character of the Indian Constitution. The verdict examined the distribution of legislative powers under the Seventh Schedule and reaffirmed that states possess residuary powers in matters not explicitly enumerated. The court invoked the doctrine of pith and substance and the colourable legislation test while analyzing the constitutional framework.\n\nThis judgment is significant for understanding cooperative federalism, a concept that has been central to India\'s governance philosophy. The court emphasized that fiscal federalism must ensure equitable resource distribution through Finance Commission recommendations and GST Council deliberations.\n\nFor UPSC aspirants, this connects to Article 246 (subject-matter of laws), Seventh Schedule, and the evolving nature of Centre-State relations in a quasi-federal polity.',
            category: 'polity',
            gsPaper: 'GS2',
            gsSubTopics: ['Polity: Federal Structure', 'Governance: Centre-State Relations'],
            date: new Date().toISOString().split('T')[0],
            source: 'The Hindu',
            sourceUrl: '#',
            importance: 'high',
            tags: ['Federalism', 'SC Judgment', 'Centre-State', 'Constitution'],
            keyTerms: ['Cooperative Federalism', 'Seventh Schedule', 'Article 246', 'Pith and Substance'],
            prelims: true,
            prelimsPoints: ['Article 246 deals with subject-matter of laws made by Parliament and State Legislatures', 'Seventh Schedule has Union, State, and Concurrent Lists'],
            mains: true,
            mainsPoints: ['Analyze the evolving nature of Centre-State relations in the context of cooperative federalism', 'Discuss the role of Finance Commission in ensuring fiscal balance'],
            imageDescription: 'Supreme Court of India building facade with Indian national flag',
            section: 'Editorial',
        },
        {
            id: 'sample-2',
            headline: 'RBI MPC Holds Repo Rate: Inflation vs Growth Balance',
            explainer: 'The Reserve Bank of India\'s Monetary Policy Committee (MPC) decided to hold the repo rate steady, balancing inflationary pressures against the need to support economic growth. The decision reflects the RBI\'s assessment that while headline inflation remains within the tolerance band, core inflation vulnerabilities persist.\n\nThe MPC\'s stance is critical for understanding India\'s monetary policy framework, established under the amended RBI Act. The committee operates under a flexible inflation targeting (FIT) regime with a 4% target and ±2% tolerance band. The decision impacts liquidity conditions, credit growth, and the broader macroeconomic environment.\n\nFor UPSC aspirants, understanding the transmission mechanism of monetary policy, the composition and functioning of the MPC (3 internal + 3 external members), and the interplay between fiscal and monetary policy is essential for both Prelims and Mains.',
            category: 'economy',
            gsPaper: 'GS3',
            gsSubTopics: ['Economy: Monetary Policy', 'Economy: Inflation'],
            date: new Date().toISOString().split('T')[0],
            source: 'RBI',
            sourceUrl: '#',
            importance: 'high',
            tags: ['RBI', 'MPC', 'Repo Rate', 'Inflation', 'Monetary Policy'],
            keyTerms: ['Monetary Policy Committee', 'Repo Rate', 'Flexible Inflation Targeting', 'CPI'],
            prelims: true,
            prelimsPoints: ['MPC has 6 members — 3 from RBI, 3 external', 'FIT target: 4% CPI ± 2%'],
            mains: true,
            mainsPoints: ['Discuss the trade-off between inflation control and growth support', 'Critically evaluate the effectiveness of FIT in Indian context'],
            imageDescription: 'Reserve Bank of India headquarters building in Mumbai',
            section: 'Economy',
        },
        {
            id: 'sample-3',
            headline: 'India-EU FTA: 13th Round Advances Digital Trade, Green Economy Chapter',
            explainer: 'India and the European Union concluded their 13th round of Free Trade Agreement negotiations, making progress on contentious chapters including digital trade, intellectual property, and a new green economy chapter. The negotiations covered data localization norms, carbon border adjustment mechanism (CBAM), and market access for services.\n\nThe India-EU trade relationship is evolving against the backdrop of global supply chain realignments and the need for diversified trade partnerships. The CBAM discussion is particularly significant as it could impact India\'s exports of steel, aluminium, and cement to the EU.\n\nFor UPSC, this links to GS-II (IR: bilateral/multilateral agreements) and GS-III (Economy: trade policy). Key concepts include Rules of Origin, Most Favoured Nation status, trade facilitation, and the future of multilateral trading under WTO challenges.',
            category: 'ir',
            gsPaper: 'GS2',
            gsSubTopics: ['IR: Bilateral Relations', 'Economy: Trade Policy'],
            date: new Date().toISOString().split('T')[0],
            source: 'Indian Express',
            sourceUrl: '#',
            importance: 'high',
            tags: ['India-EU', 'FTA', 'Digital Trade', 'CBAM', 'Trade'],
            keyTerms: ['Free Trade Agreement', 'CBAM', 'Rules of Origin', 'Data Localization'],
            prelims: true,
            prelimsPoints: ['CBAM = Carbon Border Adjustment Mechanism by EU', 'India is EU\'s 10th largest trading partner'],
            mains: true,
            mainsPoints: ['Analyze the opportunities and challenges of India-EU FTA for Indian economy', 'Discuss the implications of digital trade provisions for India\'s data sovereignty'],
            imageDescription: 'Indian flag alongside European Union flag at diplomatic summit',
            section: 'International',
        },
    ],
    articlesByGS: {},
    sources: ['The Hindu', 'Indian Express', 'RBI'],
    totalScraped: 0,
    totalProcessed: 3,
    highlights: [
        'Supreme Court on Federal Structure: Landmark Verdict',
        'RBI MPC Holds Repo Rate: Inflation vs Growth Balance',
        'India-EU FTA: 13th Round Advances Digital Trade',
    ],
};

// ---------------------------------------------------------------------------
// Component: Article Card
// ---------------------------------------------------------------------------

function ArticleCard({ article, index }: { article: EpaperArticle; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const CatIcon = CATEGORY_ICONS[article.category] || Newspaper;

    return (
        <motion.article
            custom={index}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="epaper-article-card group"
            id={`article-${article.id}`}
        >
            {/* GS Paper Badge + Importance */}
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                    <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border ${GS_BG_CLASSES[article.gsPaper] || GS_BG_CLASSES.GS2}`}
                    >
                        {article.gsPaper}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                        <CatIcon className="w-3 h-3 inline mr-1" />
                        {article.category}
                    </span>
                </div>
                <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-md border ${IMPORTANCE_STYLES[article.importance]}`}>
                    {article.importance}
                </span>
            </div>

            {/* Headline */}
            <h3 className="epaper-headline group-hover:text-accent-500 transition-colors">
                {article.headline}
            </h3>

            {/* Image Placeholder */}
            <div className="epaper-image-placeholder">
                <Newspaper className="w-6 h-6 opacity-40" />
                <span className="text-xs opacity-60 mt-1">{article.imageDescription}</span>
            </div>

            {/* Explainer (truncated or full) */}
            <div className={`epaper-explainer ${!expanded ? 'line-clamp-6' : ''}`}>
                {article.explainer.split('\n\n').map((para, i) => (
                    <p key={i} className="mb-3 last:mb-0">{para}</p>
                ))}
            </div>

            {article.explainer.length > 400 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs font-medium text-accent-500 hover:text-accent-400 mt-1 flex items-center gap-1"
                >
                    {expanded ? 'Show Less' : 'Read Full Explainer'}
                    <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
            )}

            {/* Key Terms */}
            {article.keyTerms && article.keyTerms.length > 0 && (
                <div className="mt-4 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                        📌 Key Terms
                    </p>
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

            {/* Prelims / Mains Points */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {article.prelims && article.prelimsPoints && article.prelimsPoints.length > 0 && (
                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                            📝 Prelims Pointers
                        </p>
                        <ul className="space-y-1.5">
                            {article.prelimsPoints.map((pt, i) => (
                                <li key={i} className="text-xs leading-relaxed flex items-start gap-1.5"
                                    style={{ color: 'var(--text-secondary)' }}>
                                    <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
                                    {pt}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {article.mains && article.mainsPoints && article.mainsPoints.length > 0 && (
                    <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2">
                            ✍️ Mains Dimensions
                        </p>
                        <ul className="space-y-1.5">
                            {article.mainsPoints.map((pt, i) => (
                                <li key={i} className="text-xs leading-relaxed flex items-start gap-1.5"
                                    style={{ color: 'var(--text-secondary)' }}>
                                    <span className="text-purple-500 mt-0.5 flex-shrink-0">•</span>
                                    {pt}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-4">
                {article.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                        #{tag}
                    </span>
                ))}
            </div>

            {/* GS Sub-Topics */}
            {article.gsSubTopics && article.gsSubTopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {article.gsSubTopics.map((sub) => (
                        <span key={sub} className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-primary-800/5 dark:bg-primary-400/5"
                            style={{ color: 'var(--text-muted)' }}>
                            {sub}
                        </span>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 mt-4 border-t"
                style={{ borderColor: 'var(--border-color)' }}>
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
                    {article.prelims && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">P</span>
                    )}
                    {article.mains && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">M</span>
                    )}
                </div>
            </div>
        </motion.article>
    );
}

// ---------------------------------------------------------------------------
// Component: GS Section
// ---------------------------------------------------------------------------

function GSSection({ gsPaper, articles, gsInfo }: {
    gsPaper: string;
    articles: EpaperArticle[];
    gsInfo: typeof GS_PAPERS[0];
}) {
    if (articles.length === 0) return null;

    return (
        <section className="epaper-gs-section" id={`section-${gsPaper}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${gsInfo.color}15`, border: `2px solid ${gsInfo.color}30` }}>
                    <gsInfo.icon className="w-5 h-5" style={{ color: gsInfo.color }} />
                </div>
                <div>
                    <h2 className="font-heading font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                        {gsInfo.label}
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {gsInfo.sublabel} · {articles.length} {articles.length === 1 ? 'article' : 'articles'}
                    </p>
                </div>
            </div>

            <div className="epaper-articles-grid">
                {articles.map((article, i) => (
                    <ArticleCard key={article.id} article={article} index={i} />
                ))}
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function DailyEpaperPage() {
    const { t } = useLanguage();
    const [epaper, setEpaper] = useState<DailyEpaper>(fallbackEpaper);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeGS, setActiveGS] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [updateMessage, setUpdateMessage] = useState('');
    const [dataSource, setDataSource] = useState<'live' | 'sample'>('sample');
    const [selectedDate, setSelectedDate] = useState('');

    // Fetch ePaper data
    const fetchEpaper = useCallback(async (date?: string) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (date) params.set('date', date);

            const res = await fetch(`/api/epaper?${params}`);
            if (!res.ok) throw new Error('No ePaper data');

            const data = await res.json();
            if (data.articles && data.articles.length > 0) {
                setEpaper(data);
                setDataSource('live');
            } else {
                setEpaper(fallbackEpaper);
                setDataSource('sample');
            }
        } catch {
            setEpaper(fallbackEpaper);
            setDataSource('sample');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEpaper();
    }, [fetchEpaper]);

    // Trigger generation
    const triggerGeneration = async () => {
        setIsGenerating(true);
        setUpdateStatus('idle');
        setUpdateMessage('');

        try {
            const res = await fetch('/api/epaper/generate?force=true', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || data.details || 'Generation failed');

            setUpdateStatus('success');
            setUpdateMessage(`✅ ePaper generated! ${data.totalProcessed || 0} articles from ${data.totalScraped || 0} scraped.`);
            await fetchEpaper();
        } catch (err: any) {
            setUpdateStatus('error');
            setUpdateMessage(err.message || 'Failed to generate');
        } finally {
            setIsGenerating(false);
            setTimeout(() => setUpdateStatus('idle'), 10000);
        }
    };

    // Filter articles
    const filteredArticles = useMemo(() => {
        let articles = epaper.articles;

        if (activeGS !== 'all') {
            articles = articles.filter((a) => a.gsPaper === activeGS);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            articles = articles.filter(
                (a) =>
                    a.headline.toLowerCase().includes(q) ||
                    a.explainer.toLowerCase().includes(q) ||
                    a.tags.some((t) => t.toLowerCase().includes(q)) ||
                    a.keyTerms.some((k) => k.toLowerCase().includes(q))
            );
        }

        return articles;
    }, [epaper.articles, activeGS, searchQuery]);

    // Group filtered articles by GS
    const articlesByGS = useMemo(() => {
        const groups: Record<string, EpaperArticle[]> = { GS1: [], GS2: [], GS3: [], GS4: [] };
        for (const article of filteredArticles) {
            const paper = article.gsPaper || 'GS2';
            if (!groups[paper]) groups[paper] = [];
            groups[paper].push(article);
        }
        return groups;
    }, [filteredArticles]);

    // Stats
    const stats = useMemo(() => ({
        total: epaper.articles.length,
        high: epaper.articles.filter((a) => a.importance === 'high').length,
        prelims: epaper.articles.filter((a) => a.prelims).length,
        mains: epaper.articles.filter((a) => a.mains).length,
    }), [epaper.articles]);

    return (
        <div style={{ background: 'var(--bg-primary)' }}>
            {/* ═══════════════════════════════════════════════════════════════
                MASTHEAD — Newspaper-style header
            ═══════════════════════════════════════════════════════════════ */}
            <header className="epaper-masthead">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Top rule */}
                    <div className="epaper-rule-double mb-4" />

                    {/* Date line */}
                    <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                        <span className="uppercase tracking-widest font-medium">
                            {dataSource === 'live' ? 'Live Edition' : 'Sample Edition'}
                        </span>
                        <span className="font-medium">
                            {epaper.dateFormatted || new Date().toLocaleDateString('en-IN', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                            })}
                        </span>
                    </div>

                    {/* Title */}
                    <div className="text-center py-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
                            <h1 className="epaper-title">
                                <span className="text-primary-800 dark:text-primary-300">Current</span>
                                <span className="text-accent-500">Prep</span>
                                <span className="epaper-title-divider">|</span>
                                <span style={{ color: 'var(--text-primary)' }}>Daily ePaper</span>
                            </h1>
                            <p className="epaper-subtitle">
                                Syllabus-aligned current affairs for Prelims & Mains
                            </p>
                        </motion.div>
                    </div>

                    {/* Stats bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-center gap-6 py-2 text-xs"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            {stats.total} articles
                        </span>
                        <span className="w-px h-4" style={{ background: 'var(--border-color)' }} />
                        <span className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-red-500" />
                            {stats.high} high priority
                        </span>
                        <span className="w-px h-4" style={{ background: 'var(--border-color)' }} />
                        <span className="flex items-center gap-1.5">
                            📝 {stats.prelims} Prelims
                        </span>
                        <span className="w-px h-4" style={{ background: 'var(--border-color)' }} />
                        <span className="flex items-center gap-1.5">
                            ✍️ {stats.mains} Mains
                        </span>
                        {epaper.sources && epaper.sources.length > 0 && (
                            <>
                                <span className="w-px h-4" style={{ background: 'var(--border-color)' }} />
                                <span>{epaper.sources.length} sources</span>
                            </>
                        )}
                    </motion.div>

                    <div className="epaper-rule-double mt-4" />
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════
                HIGHLIGHTS TICKER
            ═══════════════════════════════════════════════════════════════ */}
            {epaper.highlights && epaper.highlights.length > 0 && (
                <section className="epaper-ticker">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3 py-2.5 overflow-x-auto hide-scrollbar">
                            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-red-500 text-white">
                                Headlines
                            </span>
                            {epaper.highlights.map((h, i) => (
                                <React.Fragment key={i}>
                                    <span className="flex-shrink-0 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        {h}
                                    </span>
                                    {i < epaper.highlights.length - 1 && (
                                        <span className="flex-shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>•</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                TOOLBAR — Search, Date, Generate
            ═══════════════════════════════════════════════════════════════ */}
            <section className="sticky top-16 z-30 py-3 backdrop-blur-xl"
                style={{ background: 'var(--glass-bg)', borderBottom: '1px solid var(--border-color)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                                style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by topic, keyword, GS paper, or key term…"
                                className="input-field !pl-10 !py-2.5 text-sm"
                            />
                        </div>

                        {/* Date Picker */}
                        {epaper.availableDates && epaper.availableDates.length > 0 && (
                            <select
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    fetchEpaper(e.target.value || undefined);
                                }}
                                className="input-field !w-auto min-w-[160px] !py-2.5 text-sm"
                            >
                                <option value="">Latest Edition</option>
                                {epaper.availableDates.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        )}

                        {/* Download PDF */}
                        <a
                            href={`/daily-epaper/print/${epaper.date || new Date().toISOString().split('T')[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                            style={{ background: 'linear-gradient(135deg, #8B4513, #D4791C)', color: '#FFF1E5', border: 'none' }}
                        >
                            <Download className="w-4 h-4" />
                            Download PDF
                        </a>

                        {/* Archive Link */}
                        <Link href="/daily-epaper/archive"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                            <Archive className="w-4 h-4" />
                            Archive
                        </Link>

                        {/* Generate Button */}
                        <button
                            onClick={triggerGeneration}
                            disabled={isGenerating}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-800 to-primary-600 text-white font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {isGenerating ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
                            ) : (
                                <><RefreshCw className="w-4 h-4" />Generate Today&apos;s ePaper</>
                            )}
                        </button>
                    </div>

                    {/* Update Status */}
                    <AnimatePresence>
                        {updateStatus !== 'idle' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${updateStatus === 'success'
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                    }`}
                            >
                                {updateStatus === 'success' ? (
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                )}
                                {updateMessage}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                GS PAPER TABS
            ═══════════════════════════════════════════════════════════════ */}
            <section className="px-4 sm:px-6 lg:px-8 mt-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {GS_PAPERS.map((gs) => {
                            const count = gs.id === 'all'
                                ? filteredArticles.length
                                : filteredArticles.filter((a) => a.gsPaper === gs.id).length;

                            return (
                                <button
                                    key={gs.id}
                                    onClick={() => setActiveGS(gs.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeGS === gs.id
                                        ? 'text-white shadow-lg'
                                        : 'glass-card hover:shadow-md'
                                        }`}
                                    style={activeGS === gs.id
                                        ? { background: gs.color }
                                        : { color: 'var(--text-secondary)' }
                                    }
                                >
                                    <gs.icon className="w-4 h-4" />
                                    {gs.label}
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeGS === gs.id ? 'bg-white/20' : 'bg-primary-800/5 dark:bg-primary-400/5'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════
                MAIN CONTENT — Newspaper Layout
            ═══════════════════════════════════════════════════════════════ */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="glass-card p-16 text-center">
                        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary-500" />
                        <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                            Loading ePaper…
                        </p>
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="glass-card p-16 text-center">
                        <Newspaper className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                            No articles found
                        </p>
                        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                            Try a different GS paper filter or search term
                        </p>
                    </div>
                ) : activeGS === 'all' ? (
                    /* Show grouped by GS paper */
                    <div className="space-y-12">
                        {GS_PAPERS.filter((gs) => gs.id !== 'all').map((gs) => (
                            <GSSection
                                key={gs.id}
                                gsPaper={gs.id}
                                articles={articlesByGS[gs.id] || []}
                                gsInfo={gs}
                            />
                        ))}
                    </div>
                ) : (
                    /* Show filtered articles */
                    <div className="epaper-articles-grid">
                        {filteredArticles.map((article, i) => (
                            <ArticleCard key={article.id} article={article} index={i} />
                        ))}
                    </div>
                )}
            </main>

            {/* ═══════════════════════════════════════════════════════════════
                FOOTER SIDEBAR — Quick Navigation & Info
            ═══════════════════════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sources */}
                    <div className="glass-card p-5">
                        <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Globe className="w-4 h-4 text-primary-500" />
                            Sources
                        </h3>
                        <div className="space-y-1.5">
                            {(epaper.sources || []).map((s) => (
                                <p key={s} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                    <span className="text-green-500">●</span> {s}
                                </p>
                            ))}
                        </div>
                    </div>

                    {/* Auto-Update Info */}
                    <div className="glass-card p-5 border-2 border-primary-500/20">
                        <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Zap className="w-4 h-4 text-yellow-500" />
                            🤖 AI ePaper Agent
                        </h3>
                        <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <p className="flex items-start gap-1.5">
                                <span className="text-green-500 mt-0.5">●</span>
                                Auto-publishes daily at <strong>8:00 AM IST</strong>
                            </p>
                            <p className="flex items-start gap-1.5">
                                <span className="text-blue-500 mt-0.5">●</span>
                                200-300 word explainers with syllabus keywords
                            </p>
                            <p className="flex items-start gap-1.5">
                                <span className="text-purple-500 mt-0.5">●</span>
                                GS-mapped with Prelims & Mains pointers
                            </p>
                        </div>
                        {epaper.lastUpdated && (
                            <div className="mt-3 pt-2 border-t text-[10px] flex items-center gap-1.5"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                                <Clock className="w-3 h-3" />
                                Last: {new Date(epaper.lastUpdated).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="glass-card p-5">
                        <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <BookOpen className="w-4 h-4 text-accent-500" />
                            Quick Links
                        </h3>
                        <div className="space-y-2">
                            <Link href="/daily-epaper/archive"
                                className="text-xs flex items-center gap-2 p-2 rounded-lg hover:bg-primary-800/5 dark:hover:bg-primary-400/5 transition-colors"
                                style={{ color: 'var(--text-secondary)' }}>
                                <Archive className="w-3.5 h-3.5" /> ePaper Archive (Last 60 Days)
                            </Link>
                            <Link href="/current-affairs"
                                className="text-xs flex items-center gap-2 p-2 rounded-lg hover:bg-primary-800/5 dark:hover:bg-primary-400/5 transition-colors"
                                style={{ color: 'var(--text-secondary)' }}>
                                <Newspaper className="w-3.5 h-3.5" /> Current Affairs Hub
                            </Link>
                            <Link href="/syllabus"
                                className="text-xs flex items-center gap-2 p-2 rounded-lg hover:bg-primary-800/5 dark:hover:bg-primary-400/5 transition-colors"
                                style={{ color: 'var(--text-secondary)' }}>
                                <FileText className="w-3.5 h-3.5" /> UPSC Syllabus
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
