'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Download, Printer, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import './epaper-print.css';

/* ─────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────── */

interface EpaperArticle {
    id: string;
    headline: string;
    explainer: string;
    category: string;
    gsPaper: string;
    gsSubTopics: string[];
    source: string;
    sourceUrl: string;
    importance: string;
    tags: string[];
    keyTerms: string[];
    prelims: boolean;
    prelimsPoints: string[];
    mains: boolean;
    mainsPoints: string[];
    imageDescription: string;
    date?: string;
}

interface DailyEpaper {
    date: string;
    dateFormatted: string;
    articles: EpaperArticle[];
    highlights: string[];
    sources: string[];
    totalProcessed: number;
}

/* ─────────────────────────────────────────────────────────────────────────
   Category & GS helpers
   ───────────────────────────────────────────────────────────────────────── */

const GS_LABELS: Record<string, string> = {
    GS1: 'General Studies I — History, Society, Geography',
    GS2: 'General Studies II — Polity, Governance, IR',
    GS3: 'General Studies III — Economy, Environment, S&T, Security',
    GS4: 'General Studies IV — Ethics, Integrity, Aptitude',
};

const GS_COLORS: Record<string, string> = {
    GS1: '#8B5CF6',
    GS2: '#3B82F6',
    GS3: '#10B981',
    GS4: '#F59E0B',
};

const CAT_LABELS: Record<string, string> = {
    polity: 'POLITY & CONSTITUTION', governance: 'GOVERNANCE & SCHEMES',
    economy: 'ECONOMY & FINANCE', ir: 'INTERNATIONAL RELATIONS',
    environment: 'ENVIRONMENT & ECOLOGY', science: 'SCIENCE & TECHNOLOGY',
    social: 'SOCIAL JUSTICE', history: 'HISTORY & CULTURE',
    geography: 'GEOGRAPHY', security: 'INTERNAL SECURITY',
    agriculture: 'AGRICULTURE', disaster: 'DISASTER MANAGEMENT',
    ethics: 'ETHICS & INTEGRITY',
};

const CAT_GRADIENTS: Record<string, string> = {
    polity: 'linear-gradient(135deg, #0D47A1, #1976D2)',
    governance: 'linear-gradient(135deg, #1565C0, #42A5F5)',
    economy: 'linear-gradient(135deg, #1B5E20, #43A047)',
    ir: 'linear-gradient(135deg, #4A148C, #7B1FA2)',
    environment: 'linear-gradient(135deg, #00695C, #26A69A)',
    science: 'linear-gradient(135deg, #E65100, #FF9800)',
    social: 'linear-gradient(135deg, #880E4F, #E91E63)',
    security: 'linear-gradient(135deg, #B71C1C, #E53935)',
    agriculture: 'linear-gradient(135deg, #33691E, #7CB342)',
    history: 'linear-gradient(135deg, #4E342E, #795548)',
    geography: 'linear-gradient(135deg, #1A237E, #3F51B5)',
    ethics: 'linear-gradient(135deg, #37474F, #607D8B)',
    disaster: 'linear-gradient(135deg, #BF360C, #FF5722)',
};

/* ─────────────────────────────────────────────────────────────────────────
   Image Bank Matching (simplified for PDF — no dynamic imports)
   ───────────────────────────────────────────────────────────────────────── */

function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

const BANK_COUNTS: Record<string, number> = {
    polity: 20, governance: 20, economy: 23, ir: 20, environment: 20,
    science: 20, social: 20, security: 20, agriculture: 20,
    history: 20, geography: 20, ethics: 15, disaster: 15,
};

function getBankImageUrl(articleId: string, category: string): string {
    const cat = category.toLowerCase();
    const count = BANK_COUNTS[cat] || 20;
    const idx = (simpleHash(articleId + cat) % count) + 1;
    const paddedIdx = idx.toString().padStart(2, '0');
    return `/images/bank/${cat}/${cat}-${paddedIdx}.jpg`;
}

/* ─────────────────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────────────────── */

export default function EpaperPrintView({ date }: { date: string }) {
    const [epaper, setEpaper] = useState<DailyEpaper | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function load() {
            try {
                const t = Date.now();
                let res = await fetch(`/api/epaper?date=${date}&_t=${t}`, {
                    cache: 'no-store',
                });
                if (!res.ok) res = await fetch(`/api/epaper?_t=${t}`, { cache: 'no-store' });
                if (!res.ok) throw new Error('Failed');
                const data = await res.json();
                if (data.articles && data.articles.length > 0) {
                    setEpaper(data);
                } else {
                    setEpaper(null);
                }
            } catch {
                setEpaper(null);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [date]);

    /* ── PDF Download using jsPDF + html2canvas ─────────────────────── */
    const handleDownloadPDF = async () => {
        if (!printRef.current || !epaper) return;
        setDownloading(true);

        try {
            // Dynamic imports (client-side only)
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const pages = printRef.current.querySelectorAll('.epaper-print-page');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const A4_WIDTH = 210;
            const A4_HEIGHT = 297;

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i] as HTMLElement;

                // Capture the page as a high-res canvas
                const canvas = await html2canvas(page, {
                    scale: 2,               // 2x resolution for sharp text
                    useCORS: true,
                    backgroundColor: '#FFF1E5',  // Salmon background
                    logging: false,
                    width: page.scrollWidth,
                    height: page.scrollHeight,
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.92);

                if (i > 0) pdf.addPage();

                pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH, A4_HEIGHT);
            }

            // Save the PDF file → goes directly to Downloads folder
            pdf.save(`CurrentPrep-ePaper-${epaper.date}.pdf`);
            setDownloaded(true);
            setTimeout(() => setDownloaded(false), 4000);
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('PDF generation failed. Try using Print → Save as PDF instead.');
        } finally {
            setDownloading(false);
        }
    };

    const handlePrint = () => window.print();

    /* group articles by GS paper */
    const grouped: Record<string, EpaperArticle[]> = {};
    if (epaper) {
        for (const a of epaper.articles) {
            if (!grouped[a.gsPaper]) grouped[a.gsPaper] = [];
            grouped[a.gsPaper].push(a);
        }
    }

    if (loading) {
        return (
            <div className="epaper-print-loading">
                <Loader2 className="animate-spin" size={32} />
                <p>Loading ePaper…</p>
            </div>
        );
    }

    if (!epaper || epaper.articles.length === 0) {
        return (
            <div className="epaper-print-loading">
                <p>No ePaper available for {date}</p>
                <a href="/daily-epaper" style={{ color: '#b45309', marginTop: 12 }}>
                    ← Back to Daily ePaper
                </a>
            </div>
        );
    }

    return (
        <>
            {/* ── Toolbar (hidden when printing) ────────────────────── */}
            <div className="epaper-print-toolbar no-print">
                <a href="/daily-epaper" className="epaper-print-btn-back">
                    <ArrowLeft size={16} />
                    Back to Daily ePaper
                </a>
                <div className="epaper-print-toolbar-right">
                    {/* Primary: Download PDF file */}
                    <button
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="epaper-print-btn"
                        style={{
                            background: downloaded ? '#16a34a' : 'linear-gradient(135deg, #C0392B, #8B1A1A)',
                            minWidth: 200,
                            justifyContent: 'center',
                        }}
                    >
                        {downloading ? (
                            <><Loader2 size={16} className="animate-spin" /> Generating PDF…</>
                        ) : downloaded ? (
                            <><CheckCircle size={16} /> Downloaded!</>
                        ) : (
                            <><Download size={16} /> Download PDF</>
                        )}
                    </button>

                    {/* Secondary: Browser print */}
                    <button
                        onClick={handlePrint}
                        className="epaper-print-btn"
                        style={{ background: '#33200A', opacity: 0.7 }}
                    >
                        <Printer size={16} />
                        Print
                    </button>
                </div>
            </div>

            {/* ── Printable A4 Content ──────────────────────────────── */}
            <div className="epaper-print-wrapper" ref={printRef}>

                {/* === PAGE 1: FRONT PAGE === */}
                <div className="epaper-print-page">
                    {/* Masthead */}
                    <header className="epaper-print-masthead">
                        <div className="epaper-print-masthead-rule" />
                        <div className="epaper-print-masthead-inner">
                            <div className="epaper-print-masthead-left">
                                <span className="epaper-print-vol">Vol. I</span>
                                <span className="epaper-print-est">Est. 2026</span>
                            </div>
                            <div className="epaper-print-masthead-center">
                                <h1 className="epaper-print-title">CurrentPrep</h1>
                                <p className="epaper-print-tagline">UPSC CIVIL SERVICES ePAPER</p>
                            </div>
                            <div className="epaper-print-masthead-right">
                                <span className="epaper-print-date">{epaper.dateFormatted}</span>
                                <span className="epaper-print-pages">{epaper.articles.length} Articles · {epaper.sources.length} Sources</span>
                            </div>
                        </div>
                        <div className="epaper-print-masthead-rule" />
                    </header>

                    {/* Top headlines bar */}
                    <div className="epaper-print-headlines-bar">
                        <span className="epaper-print-headlines-label">TODAY&apos;S HIGHLIGHTS</span>
                        <span className="epaper-print-headlines-text">
                            {epaper.highlights.slice(0, 3).join('  ●  ')}
                        </span>
                    </div>

                    {/* Lead article with image */}
                    {epaper.articles.length > 0 && (() => {
                        const lead = epaper.articles[0];
                        return (
                            <div className="epaper-print-lead">
                                <div className="epaper-print-lead-top">
                                    <div className="epaper-print-lead-text">
                                        <div className="epaper-print-lead-category">
                                            {CAT_LABELS[lead.category] || lead.category.toUpperCase()} · {lead.gsPaper}
                                        </div>
                                        <h2 className="epaper-print-lead-headline">{lead.headline}</h2>
                                        <div className="epaper-print-lead-meta">
                                            Source: {lead.source} · {lead.importance === 'high' ? '★ HIGH PRIORITY' : lead.importance === 'medium' ? '● MEDIUM' : '○ LOW'}
                                        </div>
                                    </div>
                                    <PrintArticleImage articleId={lead.id} category={lead.category} description={lead.imageDescription} size="lead" date={epaper.date} />
                                </div>
                                <div className="epaper-print-lead-body">
                                    {lead.explainer.split('\n').map((p, i) => (
                                        <p key={i}>{p}</p>
                                    ))}
                                </div>
                                <div className="epaper-print-key-terms">
                                    <strong>Key Terms:</strong> {lead.keyTerms.join(' · ')}
                                </div>
                                <div className="epaper-print-pointers-row">
                                    {lead.prelims && lead.prelimsPoints.length > 0 && (
                                        <div className="epaper-print-pointer-box">
                                            <div className="epaper-print-pointer-title">📝 PRELIMS POINTERS</div>
                                            <ul>
                                                {lead.prelimsPoints.map((p, i) => <li key={i}>{p}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {lead.mains && lead.mainsPoints.length > 0 && (
                                        <div className="epaper-print-pointer-box">
                                            <div className="epaper-print-pointer-title">✍️ MAINS DIMENSIONS</div>
                                            <ul>
                                                {lead.mainsPoints.map((p, i) => <li key={i}>{p}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Remaining front-page articles */}
                    <div className="epaper-print-grid">
                        {epaper.articles.slice(1, 5).map((a) => (
                            <ArticleCard key={a.id} article={a} compact />
                        ))}
                    </div>

                    <div className="epaper-print-footer">
                        <span>CurrentPrep · currentprep.in</span>
                        <span>Page 1</span>
                    </div>
                </div>

                {/* === REMAINING PAGES: GS-wise === */}
                {(['GS2', 'GS3', 'GS1', 'GS4'] as const)
                    .filter((gs) => grouped[gs] && grouped[gs].length > 0)
                    .map((gs, pageIdx) => {
                        const articles = grouped[gs];
                        const remaining = articles.filter(
                            (a) => !epaper.articles.slice(0, 5).some((fa) => fa.id === a.id)
                        );
                        if (remaining.length === 0) return null;

                        return (
                            <div className="epaper-print-page" key={gs}>
                                <div className="epaper-print-section-header">
                                    <div className="epaper-print-section-rule" style={{ background: GS_COLORS[gs] }} />
                                    <h2 className="epaper-print-section-title" style={{ color: GS_COLORS[gs] }}>
                                        {GS_LABELS[gs]}
                                    </h2>
                                    <div className="epaper-print-section-rule" style={{ background: GS_COLORS[gs] }} />
                                </div>

                                <div className="epaper-print-grid">
                                    {remaining.map((a) => (
                                        <ArticleCard key={a.id} article={a} />
                                    ))}
                                </div>

                                <div className="epaper-print-footer">
                                    <span>CurrentPrep Daily ePaper · {epaper.dateFormatted}</span>
                                    <span>Page {pageIdx + 2}</span>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   Print Image Component (with fallback chain: generated → bank → gradient)
   ───────────────────────────────────────────────────────────────────────── */

function getGeneratedPath(articleId: string, date?: string): string {
    const d = date || new Date().toISOString().split('T')[0];
    const filename = (articleId || 'unnamed')
        .toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    return `/images/generated/${d}/${filename}.jpg`;
}

function PrintArticleImage({
    articleId,
    category,
    description,
    size = 'card',
    date,
}: {
    articleId: string;
    category: string;
    description: string;
    size?: 'lead' | 'card';
    date?: string;
}) {
    const generatedUrl = getGeneratedPath(articleId, date);
    const bankUrl = getBankImageUrl(articleId, category);
    const gradient = CAT_GRADIENTS[category.toLowerCase()] || CAT_GRADIENTS.polity;
    const isLead = size === 'lead';

    const [currentSrc, setCurrentSrc] = useState(generatedUrl);
    const [stage, setStage] = useState(0); // 0=generated, 1=bank, 2=gradient

    const handleError = () => {
        if (stage === 0) {
            setCurrentSrc(bankUrl);
            setStage(1);
        } else {
            setStage(2);
        }
    };

    if (stage >= 2) {
        return (
            <div
                className={`epaper-print-image ${isLead ? 'epaper-print-image-lead' : 'epaper-print-image-card'}`}
                style={{ background: gradient }}
            >
                <span className="epaper-print-image-desc">{description}</span>
            </div>
        );
    }

    return (
        <div className={`epaper-print-image ${isLead ? 'epaper-print-image-lead' : 'epaper-print-image-card'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={currentSrc}
                alt={description}
                onError={handleError}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                crossOrigin="anonymous"
            />
            <div className="epaper-print-image-overlay" />
            <span className="epaper-print-image-desc">{description}</span>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   Article Card Sub-Component (with Image)
   ───────────────────────────────────────────────────────────────────────── */

function ArticleCard({
    article: a,
    compact = false,
}: {
    article: EpaperArticle;
    compact?: boolean;
}) {
    return (
        <div className={`epaper-print-article ${compact ? 'compact' : ''}`}>
            {/* Article Image */}
            <PrintArticleImage articleId={a.id} category={a.category} description={a.imageDescription} size="card" date={a.date} />

            <div className="epaper-print-article-cat">
                {CAT_LABELS[a.category] || a.category.toUpperCase()} · {a.gsPaper}
            </div>
            <h3 className="epaper-print-article-headline">{a.headline}</h3>
            <div className="epaper-print-article-source">
                {a.source} · {a.importance === 'high' ? '★' : a.importance === 'medium' ? '●' : '○'}
            </div>

            {!compact && (
                <>
                    <div className="epaper-print-article-body">
                        {a.explainer.split('\n').map((p, i) => (
                            <p key={i}>{p}</p>
                        ))}
                    </div>

                    <div className="epaper-print-key-terms">
                        <strong>Key Terms:</strong> {a.keyTerms.join(' · ')}
                    </div>

                    <div className="epaper-print-pointers-row">
                        {a.prelims && a.prelimsPoints.length > 0 && (
                            <div className="epaper-print-pointer-box">
                                <div className="epaper-print-pointer-title">📝 PRELIMS</div>
                                <ul>
                                    {a.prelimsPoints.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                        )}
                        {a.mains && a.mainsPoints.length > 0 && (
                            <div className="epaper-print-pointer-box">
                                <div className="epaper-print-pointer-title">✍️ MAINS</div>
                                <ul>
                                    {a.mainsPoints.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </>
            )}

            {compact && (
                <p className="epaper-print-article-summary">
                    {a.explainer.split('\n')[0]?.slice(0, 200)}…
                </p>
            )}
        </div>
    );
}
