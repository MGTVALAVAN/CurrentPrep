'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import {
    Search, ChevronDown, ChevronUp, Globe, Landmark, TrendingUp,
    Clock, ExternalLink, RefreshCw, Loader2, Zap,
    CheckCircle2, AlertCircle, BookOpen, Download, Newspaper, Lightbulb,
} from 'lucide-react';
import './newspaper.css';

// ── Types ────────────────────────────────────────────────────────────────

interface QuickByte {
    text: string;
    category: string;
    gsPaper: string;
    tags: string[];
}

interface EpaperArticle {
    id: string;
    headline: string;
    explainer: string | Record<string, string>;
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
    sources: string[];
    totalProcessed: number;
    highlights: string[];
    quickBytes?: QuickByte[];
    quoteOfTheDay?: { text: string; author: string };
    onThisDay?: { year: number; event: string };
    dataSnapshot?: { label: string; value: string; context: string };
}

// ── Section config ───────────────────────────────────────────────────────

const SEC_COLOR: Record<string, string> = {
    polity: '#0D47A1', governance: '#1565C0', economy: '#1B5E20',
    ir: '#4A148C', environment: '#00695C', science: '#E65100',
    social: '#880E4F', history: '#5D4037', geography: '#33691E',
    security: '#B71C1C', agriculture: '#558B2F', disaster: '#E65100',
    ethics: '#37474F',
};

const SEC_LABEL: Record<string, string> = {
    polity: 'POLITY', governance: 'GOVERNANCE', economy: 'ECONOMY',
    ir: 'INTERNATIONAL', environment: 'ENVIRONMENT', science: 'S & T',
    social: 'SOCIAL', history: 'HISTORY', geography: 'GEOGRAPHY',
    security: 'SECURITY', agriculture: 'AGRICULTURE', disaster: 'DISASTER',
    ethics: 'ETHICS',
};

const GS_TABS = [
    { id: 'all', label: 'All' },
    { id: 'GS1', label: 'GS-I' }, { id: 'GS2', label: 'GS-II' },
    { id: 'GS3', label: 'GS-III' }, { id: 'GS4', label: 'GS-IV' },
];



// ── Markdown-lite renderer (strips **bold** → <strong>) ──────────────

function renderText(textStr: string | Record<string, string>): React.ReactNode[] {
    const text = typeof textStr === 'string' ? textStr : Object.entries(textStr || {}).map(([k, v]) => `**${k}:** ${v}`).join('\n');
    return text.split('\n').map((para, i) => {
        const parts = para.split(/\*\*(.*?)\*\*/g);
        return (
            <p key={i}>
                {parts.map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                )}
            </p>
        );
    });
}

// ── Brief bullet preview (first 3 bullet points for collapsed view) ──

function renderBriefBullets(textStr: string | Record<string, string>): React.ReactNode {
    const text = typeof textStr === 'string' ? textStr : Object.entries(textStr || {}).map(([k, v]) => `${k}: ${v}`).join('\n');
    // Extract bullet-like lines
    const lines = text.split('\n')
        .map(l => l.replace(/^\*\*.*?\*\*\s*/, '').replace(/^[•\-*]\s*/, '').trim())
        .filter(l => l.length > 10);
    const preview = lines.slice(0, 3);
    return (
        <div className="np-card-summary">
            {preview.map((line, i) => (
                <p key={i} style={{ margin: '0 0 4px', fontSize: '12.5px', lineHeight: 1.55 }}>
                    • {line.length > 120 ? line.substring(0, 120) + '…' : line}
                </p>
            ))}
        </div>
    );
}



// ── Fallback articles ────────────────────────────────────────────────────

const fallback: EpaperArticle[] = [
    {
        id: 's1', headline: 'Supreme Court on Federal Structure: Landmark Verdict on Centre-State Relations',
        explainer: 'The Supreme Court delivered a landmark judgment reinforcing the federal character of the Indian Constitution. The verdict examined the distribution of legislative powers under the Seventh Schedule.\nThe court invoked the doctrine of pith and substance while analysing the framework. This is significant for understanding cooperative federalism — central to India\'s governance.\nFor UPSC, this connects to Article 246, Seventh Schedule, and evolving Centre-State relations in a quasi-federal polity.',
        category: 'polity', gsPaper: 'GS2', gsSubTopics: ['Polity: Federal Structure'], date: new Date().toISOString().split('T')[0],
        source: 'SC Observer', sourceUrl: '#', importance: 'high',
        tags: ['Federalism', 'SC Judgment', 'Centre-State'], keyTerms: ['Cooperative Federalism', 'Seventh Schedule', 'Article 246'],
        prelims: true, prelimsPoints: ['Article 246 defines subject-matter of laws', 'Seventh Schedule has Union, State, Concurrent Lists'],
        mains: true, mainsPoints: ['Analyse Centre-State relations in cooperative federalism context'],
        imageDescription: 'Supreme Court of India building New Delhi', section: 'Judgments',
    },
    {
        id: 's2', headline: 'RBI MPC Holds Repo Rate: Inflation vs Growth Balance',
        explainer: 'The RBI MPC decided to hold the repo rate steady. The decision reflects the flexible inflation targeting regime with 4% target ±2% tolerance.\nThe MPC has 3 internal and 3 external members. Understanding transmission and fiscal-monetary interplay is essential for UPSC.',
        category: 'economy', gsPaper: 'GS3', gsSubTopics: ['Economy: Monetary Policy'], date: new Date().toISOString().split('T')[0],
        source: 'The Hindu', sourceUrl: '#', importance: 'high',
        tags: ['RBI', 'MPC', 'Repo Rate'], keyTerms: ['Monetary Policy Committee', 'Repo Rate', 'FIT'],
        prelims: true, prelimsPoints: ['MPC has 6 members', 'FIT target: 4% CPI ± 2%'],
        mains: true, mainsPoints: ['Discuss inflation vs growth trade-off'],
        imageDescription: 'Reserve Bank of India RBI headquarters Mumbai', section: 'Economy',
    },
];

// ═════════════════════════════════════════════════════════════════════════
// PAGE
// ═════════════════════════════════════════════════════════════════════════

export default function CurrentAffairsPage() {
    const { t } = useLanguage();
    const [epaper, setEpaper] = useState<DailyEpaper | null>(null);
    const [articles, setArticles] = useState<EpaperArticle[]>(fallback);
    const [loading, setLoading] = useState(true);
    const [genLoading, setGenLoading] = useState(false);
    const [gs, setGs] = useState('all');
    const [q, setQ] = useState('');
    const [openId, setOpenId] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');
    const [statusMsg, setStatusMsg] = useState('');
    const [src, setSrc] = useState<'live' | 'sample'>('sample');

    const today = new Date().toISOString().split('T')[0];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(`/api/epaper?_t=${Date.now()}`, { cache: 'no-store' });
            if (!r.ok) throw 0;
            const d: DailyEpaper = await r.json();
            if (d.articles?.length) { setEpaper(d); setArticles(d.articles); setSrc('live'); }
            else { setArticles(fallback); setSrc('sample'); }
        } catch { setArticles(fallback); setSrc('sample'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const generate = async () => {
        setGenLoading(true); setStatus('idle');
        try {
            const r = await fetch('/api/epaper/generate?force=true', { method: 'POST' });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || 'Failed');
            setStatus('ok');
            setStatusMsg(`${d.totalProcessed || 0} articles from ${d.totalScraped || 0} sources.`);
            await fetchData();
        } catch (e: any) { setStatus('err'); setStatusMsg(e.message); }
        finally { setGenLoading(false); setTimeout(() => setStatus('idle'), 8000); }
    };



    const filtered = useMemo(() => {
        let r = articles;
        if (gs !== 'all') r = r.filter(a => a.gsPaper === gs);
        if (q) {
            const lq = q.toLowerCase(); r = r.filter(a => {
                const ext = typeof a.explainer === 'string' ? a.explainer : JSON.stringify(a.explainer);
                return a.headline.toLowerCase().includes(lq) || ext.toLowerCase().includes(lq) ||
                    a.tags.some(t => t.toLowerCase().includes(lq)) || a.keyTerms.some(k => k.toLowerCase().includes(lq));
            });
        }
        return r;
    }, [articles, gs, q]);

    const lead = filtered[0];
    const rest = filtered.slice(1);
    const stats = useMemo(() => ({
        tot: articles.length,
        hi: articles.filter(a => a.importance === 'high').length,
        pre: articles.filter(a => a.prelims).length,
        mai: articles.filter(a => a.mains).length,
        src: epaper?.sources?.length || 0,
    }), [articles, epaper]);
    const terms = useMemo(() => {
        const m: Record<string, number> = {};
        articles.forEach(a => a.keyTerms?.forEach(k => { m[k] = (m[k] || 0) + 1; }));
        return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 18).map(([t]) => t);
    }, [articles]);
    const tags = useMemo(() => {
        const m: Record<string, number> = {};
        articles.forEach(a => a.tags.forEach(t => { m[t] = (m[t] || 0) + 1; }));
        return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([t]) => t);
    }, [articles]);

    // ════════════════════════════════ RENDER ════════════════════════════

    return (
        <div className="np-page">

            {/* ── MASTHEAD ─────────────────────────────────────────── */}
            <header className="np-masthead">
                <div className="np-mast-inner">
                    <div className="np-topbar">
                        <div className="np-topbar-left">
                            {src === 'live'
                                ? <><span className="np-live-dot" /> <span>Live Edition</span></>
                                : <span style={{ color: '#E65100' }}>Sample Data</span>
                            }
                            <span suppressHydrationWarning>{epaper?.dateFormatted || new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="np-topbar-right">
                            {epaper?.lastUpdated && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={10} /> {new Date(epaper.lastUpdated).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="np-title-row">
                        <h1 className="np-title">Current IAS <em>Prep</em></h1>
                        <p className="np-tagline">Daily Current Affairs · UPSC Civil Services</p>
                    </div>

                    <div className="np-stats">
                        <span><b>{stats.tot}</b> articles</span><span className="sep" />
                        <span><Zap size={11} style={{ color: '#C62828' }} /> <b>{stats.hi}</b> high priority</span><span className="sep" />
                        <span>📝 <b>{stats.pre}</b> Prelims</span><span className="sep" />
                        <span>✍️ <b>{stats.mai}</b> Mains</span>
                        {stats.src > 0 && <><span className="sep" /><span><b>{stats.src}</b> sources</span></>}
                    </div>
                </div>
            </header>

            {/* ── TICKER ───────────────────────────────────────────── */}
            {epaper?.highlights?.length ? (
                <div className="np-ticker">
                    <div className="np-ticker-wrap">
                        <span className="np-ticker-tag">Headlines</span>
                        <div className="np-ticker-items">
                            {epaper.highlights.map((h, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && <span className="dot" />}
                                    <span>{h}</span>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}

            {/* ── FRONT PAGE EXTRAS ──────────────────────────────── */}
            {epaper && (epaper.quoteOfTheDay || epaper.onThisDay || epaper.dataSnapshot) && (
                <div className="np-extras">
                    <div className="np-extras-inner">
                        {epaper.quoteOfTheDay && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15, duration: 0.45 }}
                                className="np-extra-card np-extra-quote"
                            >
                                <div className="np-extra-watermark">{"\u201C"}</div>
                                <div className="np-extra-label">{'\ud83d\udcac'} Quote of the Day</div>
                                <p className="np-extra-quote-text">
                                    &ldquo;{epaper.quoteOfTheDay.text}&rdquo;
                                </p>
                                <p className="np-extra-quote-author">
                                    &mdash; {epaper.quoteOfTheDay.author}
                                </p>
                            </motion.div>
                        )}
                        {epaper.onThisDay && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25, duration: 0.45 }}
                                className="np-extra-card np-extra-otd"
                            >
                                <div className="np-extra-label">{'\ud83d\udcc5'} On This Day</div>
                                <div className="np-extra-year">{epaper.onThisDay.year}</div>
                                <p className="np-extra-event">{epaper.onThisDay.event}</p>
                            </motion.div>
                        )}
                        {epaper.dataSnapshot && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, duration: 0.45 }}
                                className="np-extra-card np-extra-data"
                            >
                                <div className="np-extra-label">{'\ud83d\udcca'} Data Snapshot</div>
                                <div className="np-extra-data-row">
                                    <div className="np-extra-data-stat">
                                        <div className="np-extra-data-value">{epaper.dataSnapshot.value}</div>
                                        <div className="np-extra-data-label">{epaper.dataSnapshot.label}</div>
                                    </div>
                                    <div className="np-extra-data-context">{epaper.dataSnapshot.context}</div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TOOLBAR ──────────────────────────────────────────── */}
            <div className="np-bar">
                <div className="np-bar-inner">
                    <div className="np-bar-search">
                        <Search size={15} />
                        <input value={q} onChange={e => setQ(e.target.value)}
                            placeholder="Search topics, keywords, GS paper…" />
                    </div>
                    <a href={`/daily-epaper/print/${epaper?.date || today}`}
                        target="_blank" rel="noopener noreferrer"
                        className="np-btn np-btn-red">
                        <Download size={13} /> Download PDF
                    </a>
                    <a href="/daily-epaper/archive"
                        className="np-btn np-btn-outline">
                        <Newspaper size={13} /> ePaper Archive
                    </a>

                </div>
                <AnimatePresence>
                    {status !== 'idle' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}>
                            <div className={`np-status ${status === 'ok' ? 'ok' : 'err'}`}>
                                {status === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                {statusMsg}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── GS TABS ──────────────────────────────────────────── */}
            <div className="np-tabs">
                {GS_TABS.map(g => {
                    const c = g.id === 'all' ? filtered.length : filtered.filter(a => a.gsPaper === g.id).length;
                    return (
                        <button key={g.id} onClick={() => setGs(g.id)}
                            className={`np-tab ${gs === g.id ? 'on' : ''}`}>
                            {g.label}<span className="cnt">{c}</span>
                        </button>
                    );
                })}
            </div>

            {/* ── CONTENT ──────────────────────────────────────────── */}
            <div className="np-content">
                {loading ? (
                    <div className="np-loading">
                        <Loader2 size={28} className="animate-spin" style={{ marginBottom: 8 }} /> Loading…
                    </div>
                ) : !filtered.length ? (
                    <div className="np-loading">
                        <Newspaper size={36} style={{ marginBottom: 8, opacity: .4 }} /> No articles found.
                    </div>
                ) : (
                    <>
                        {/* ═══ LEAD STORY ═══ */}
                        {lead && (
                            <article className="np-lead">
                                <div className="np-lead-main">
                                    <div className="np-lead-flag"><Zap size={11} /> TOP STORY · {lead.gsPaper}</div>
                                    <h2>{lead.headline}</h2>
                                    <div className="np-lead-meta">
                                        <span className="np-gs-pill" style={{
                                            background: (SEC_COLOR[lead.category] || '#0D47A1') + '18',
                                            color: SEC_COLOR[lead.category] || '#0D47A1',
                                        }}>
                                            {SEC_LABEL[lead.category] || lead.category.toUpperCase()}
                                        </span>
                                        <span>{lead.source}</span>
                                        <span>·</span>
                                        <span>{lead.date}</span>
                                    </div>

                                    {/* Thumbnail Image Removed as requested */}

                                    <div className="np-lead-text">
                                        {renderText(lead.explainer)}
                                    </div>
                                </div>{/* End of np-lead-main */}

                                {/* Lead aside: terms + pointers (Right Column) */}
                                <div className="np-lead-aside" style={{ marginTop: 0 }}>
                                    {lead.keyTerms?.length > 0 && (
                                        <div className="np-terms-box">
                                            <div className="np-terms-label">Key Terms</div>
                                            <div className="np-terms-list">
                                                {lead.keyTerms.map(k => <span key={k} className="np-term">{k}</span>)}
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        {lead.prelims && lead.prelimsPoints?.length > 0 && (
                                            <div className="np-ptr pre">
                                                <div className="np-ptr-title">📝 Prelims Pointers</div>
                                                <ul>{lead.prelimsPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
                                            </div>
                                        )}
                                        {lead.mains && lead.mainsPoints?.length > 0 && (
                                            <div className="np-ptr mai">
                                                <div className="np-ptr-title">✍️ Mains Dimensions</div>
                                                <ul>{lead.mainsPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                        )}

                        {/* ═══ QUICK BYTES ═══ */}
                        {epaper?.quickBytes && epaper.quickBytes.length > 0 && (
                            <div className="np-quick-bytes">
                                <div className="np-qb-header">
                                    <Lightbulb size={16} />
                                    <span>Quick Bytes</span>
                                    <span className="np-qb-sub">Static GK · This Day in History</span>
                                </div>
                                <div className="np-qb-grid">
                                    {epaper.quickBytes.map((qb, i) => {
                                        const catIcons: Record<string, string> = {
                                            art_culture: '🎨', history: '📜', anniversary: '📅',
                                            geography: '🌍', science: '🔬', environment: '🌿',
                                            polity: '⚖️', economy: '💰', international: '🌐', general: '📌',
                                        };
                                        const catLabels: Record<string, string> = {
                                            art_culture: 'ART & CULTURE', history: 'HISTORY', anniversary: 'THIS DAY',
                                            geography: 'GEOGRAPHY', science: 'SCIENCE', environment: 'ENVIRONMENT',
                                            polity: 'POLITY', economy: 'ECONOMY', international: 'INTERNATIONAL', general: 'GENERAL',
                                        };
                                        return (
                                            <div key={i} className="np-qb-item">
                                                <span className="np-qb-icon">{catIcons[qb.category] || '📌'}</span>
                                                <div className="np-qb-content">
                                                    <div className="np-qb-meta">
                                                        <span className="np-qb-cat">{catLabels[qb.category] || qb.category.toUpperCase()}</span>
                                                        <span className="np-badge gs">{qb.gsPaper}</span>
                                                    </div>
                                                    <p className="np-qb-text">{qb.text}</p>
                                                    <div className="np-qb-tags">
                                                        {qb.tags.map(t => <span key={t}>#{t}</span>)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ═══ GRID + SIDEBAR ═══ */}
                        <div className="np-layout">
                            <div className="np-main-col">
                                <div className="np-grid">
                                    {rest.map(a => (
                                        <Card key={a.id} a={a}
                                            open={openId === a.id}
                                            toggle={() => setOpenId(openId === a.id ? null : a.id)} />
                                    ))}
                                </div>
                            </div>

                            <aside className="np-side-col">
                                {/* Most Important */}
                                <div className="np-side-box">
                                    <div className="np-side-head"><Zap size={12} style={{ color: '#C62828' }} /> Most Important</div>
                                    <div className="np-side-body">
                                        {articles.filter(a => a.importance === 'high').slice(0, 5).map((a, i) => (
                                            <div key={a.id} className="np-side-item">
                                                <span className="np-side-num">{i + 1}</span>
                                                <span className="np-side-link" onClick={() => {
                                                    setOpenId(a.id);
                                                    document.getElementById(`a-${a.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }}>{a.headline}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Key Terms */}
                                <div className="np-side-box">
                                    <div className="np-side-head"><BookOpen size={12} /> Key Terms</div>
                                    <div className="np-side-body">
                                        <div className="np-tag-cloud">
                                            {terms.map(t => <button key={t} className="np-tag" onClick={() => setQ(t)}>{t}</button>)}
                                        </div>
                                    </div>
                                </div>

                                {/* Trending */}
                                <div className="np-side-box">
                                    <div className="np-side-head"><TrendingUp size={12} /> Trending</div>
                                    <div className="np-side-body">
                                        <div className="np-tag-cloud">
                                            {tags.map(t => <button key={t} className="np-tag" onClick={() => setQ(t)}>#{t}</button>)}
                                        </div>
                                    </div>
                                </div>

                                {/* Sources */}
                                {epaper?.sources?.length ? (
                                    <div className="np-side-box">
                                        <div className="np-side-head"><Globe size={12} /> Sources</div>
                                        <div className="np-side-body">
                                            {epaper.sources.map(s => (
                                                <div key={s} className="np-src-row"><span className="np-src-dot" />{s}</div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {/* PDF */}
                                <a href={`/daily-epaper/print/${epaper?.date || today}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="np-btn np-btn-red"
                                    style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontSize: 12 }}>
                                    <Download size={14} /> Download ePaper PDF
                                </a>
                            </aside>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════
// CARD (Collapsible)
// ═════════════════════════════════════════════════════════════════════════

function Card({ a, open, toggle }: { a: EpaperArticle; open: boolean; toggle: () => void }) {
    const col = SEC_COLOR[a.category] || '#0D47A1';

    return (
        <div className="np-card" id={`a-${a.id}`}>
            <div className="np-cat-bar" style={{ background: col }} />
            <div className="np-cat-text" style={{ color: col }}>
                {SEC_LABEL[a.category] || a.category.toUpperCase()}
                <span className="np-badge gs" style={{ marginLeft: 'auto' }}>{a.gsPaper}</span>
            </div>

            <h3 onClick={toggle} style={{ marginTop: '16px', cursor: 'pointer' }}>{a.headline}</h3>

            <div className="np-card-foot" style={{ marginTop: '16px', marginBottom: '12px' }}>
                <span>{a.source} · {a.date}</span>
                {a.sourceUrl && a.sourceUrl !== '#' && (
                    <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--np-blue)' }} onClick={e => e.stopPropagation()}>
                        <ExternalLink size={10} />
                    </a>
                )}
            </div>

            <div className="np-badges" style={{ marginBottom: '12px' }}>
                {a.importance === 'high' && <span className="np-badge hi">★ HIGH</span>}
                {a.prelims && <span className="np-badge pr">PRELIMS</span>}
                {a.mains && <span className="np-badge ma">MAINS</span>}
            </div>

            {/* ── Collapsed: Brief bullet summary ── */}
            {!open && (
                <>
                    {renderBriefBullets(a.explainer)}
                    <button className="np-read-btn" onClick={toggle}>
                        Read more <ChevronDown size={11} />
                    </button>
                </>
            )}

            {/* ── Expanded: Full detail panel ── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}>
                        <div className="np-detail" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent' }}>
                            <div className="np-detail-body" style={{ columnCount: 1, fontSize: '13px' }}>
                                {renderText(a.explainer)}
                            </div>

                            {a.keyTerms?.length > 0 && (
                                <div className="np-terms-box" style={{ marginTop: 16, marginBottom: 12 }}>
                                    <div className="np-terms-label">Key Terms</div>
                                    <div className="np-terms-list">
                                        {a.keyTerms.map(k => <span key={k} className="np-term" style={{ fontSize: '9px' }}>{k}</span>)}
                                    </div>
                                </div>
                            )}

                            <div className="np-detail-2col" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                                {a.prelims && a.prelimsPoints?.length > 0 && (
                                    <div className="np-ptr pre">
                                        <div className="np-ptr-title">📝 Prelims</div>
                                        <ul>{a.prelimsPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
                                    </div>
                                )}
                                {a.mains && a.mainsPoints?.length > 0 && (
                                    <div className="np-ptr mai">
                                        <div className="np-ptr-title">✍️ Mains</div>
                                        <ul>{a.mainsPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
                                    </div>
                                )}
                            </div>

                            {a.tags?.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 10 }}>
                                    {a.tags.map(t => (
                                        <span key={t} style={{
                                            fontSize: 9, padding: '2px 5px', background: 'var(--np-rule)', borderRadius: 2, color: 'var(--np-ink-2)'
                                        }}>#{t}</span>
                                    ))}
                                </div>
                            )}

                            <button className="np-read-btn" onClick={toggle} style={{ marginTop: 10 }}>
                                Read less <ChevronUp size={11} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

