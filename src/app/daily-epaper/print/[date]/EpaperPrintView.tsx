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
    explainer: string | Record<string, string>;
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

/* ─────────────────────────────────────────────────────────────────────────
   Markdown-lite renderer (strips **bold** → <strong>)
   ───────────────────────────────────────────────────────────────────────── */

function renderText(textStr: string | Record<string, string>): React.ReactNode[] {
    const text = typeof textStr === 'string'
        ? textStr
        : Object.entries(textStr || {}).map(([k, v]) => `**${k}:** ${v}`).join('\n');

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

            const page = pages[0] as HTMLElement;

            // Capture the entire continuous page as a high-res canvas
            const canvas = await html2canvas(page, {
                scale: 2,               // 2x resolution for sharp text
                useCORS: true,
                backgroundColor: '#FFF1E5',  // Salmon background
                logging: false,
                width: page.scrollWidth,
                height: page.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.92);

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = position - pageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Save the PDF file → goes directly to Downloads folder
            pdf.save(`CurrentIAS-Prep-ePaper-${epaper.date}.pdf`);
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
                        <div style={{ backgroundColor: '#E3120B', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px', padding: '36px 0', margin: '16px 0', borderRadius: '16px' }}>
                            <img src="/images/logo_globe.png?v=2" alt="Globe Icon" style={{ height: '140px', objectFit: 'contain' }} crossOrigin="anonymous" />
                            <div style={{ backgroundColor: 'white', padding: '16px 36px', borderRadius: '16px', display: 'flex', alignItems: 'center' }}>
                                <img src="/images/logo_text.png?v=2" alt="Current IAS Prep" style={{ height: '80px', objectFit: 'contain' }} crossOrigin="anonymous" />
                            </div>
                        </div>

                        <div className="epaper-print-masthead-inner" style={{ padding: '0 4px 12px 4px', alignItems: 'flex-end' }}>
                            <div className="epaper-print-masthead-left" style={{ flex: 1 }}>
                                <span className="epaper-print-vol">Vol. I</span>
                                <span className="epaper-print-est">Est. 2026</span>
                            </div>
                            <div className="epaper-print-masthead-center" style={{ flex: 3, display: 'flex', justifyContent: 'center' }}>
                                <p className="epaper-print-tagline" style={{ margin: 0, fontSize: '13px' }}>Daily Current Affairs Digest for UPSC CSE Aspirants</p>
                            </div>
                            <div className="epaper-print-masthead-right" style={{ flex: 1, alignItems: 'flex-end', textAlign: 'right' }}>
                                <span className="epaper-print-date">{epaper.dateFormatted}</span>
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
                            <div
                                className="epaper-print-lead"
                                style={{ borderTop: `4px solid ${GS_COLORS[lead.gsPaper] || '#8B4513'}`, paddingTop: '14px' }}
                            >
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    {/* Left Column: Title, Meta, Pointers */}
                                    <div>
                                        <div className="epaper-print-lead-category">
                                            {CAT_LABELS[lead.category] || lead.category.toUpperCase()} · {lead.gsPaper}
                                        </div>
                                        <h2 className="epaper-print-lead-headline">{lead.headline}</h2>
                                        <div className="epaper-print-lead-meta">
                                            Source: {lead.source} · {lead.importance === 'high' ? '★ HIGH PRIORITY' : lead.importance === 'medium' ? '● MEDIUM' : '○ LOW'}
                                        </div>

                                        <div className="epaper-print-key-terms" style={{ marginTop: '16px' }}>
                                            <strong>Key Terms:</strong> {lead.keyTerms.join(' · ')}
                                        </div>
                                        <div className="epaper-print-pointers-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
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

                                    {/* Right Column: Explainer */}
                                    <div>
                                        <div className="epaper-print-lead-body" style={{ columns: 1, fontSize: '11px', lineHeight: 1.6 }}>
                                            {renderText(lead.explainer)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}


                    {/* === REMAINING ARTICLES CONTINUED === */}
                    {
                        (['GS2', 'GS3', 'GS1', 'GS4'] as const)
                            .filter((gs) => grouped[gs] && grouped[gs].length > 0)
                            .map((gs) => {
                                const articles = grouped[gs];
                                const remaining = articles.filter(
                                    (a) => a.id !== epaper.articles[0].id
                                );
                                if (remaining.length === 0) return null;

                                return (
                                    <div key={gs} style={{ marginTop: '24px' }}>
                                        <div className="epaper-print-section-header">
                                            <div className="epaper-print-section-rule" style={{ background: GS_COLORS[gs] }} />
                                            <h2 className="epaper-print-section-title" style={{
                                                background: GS_COLORS[gs],
                                                color: 'white',
                                                padding: '8px 16px',
                                                borderRadius: '6px'
                                            }}>
                                                {GS_LABELS[gs]}
                                            </h2>
                                            <div className="epaper-print-section-rule" style={{ background: GS_COLORS[gs] }} />
                                        </div>

                                        <div className="epaper-print-grid">
                                            {remaining.map((a) => (
                                                <ArticleCard key={a.id} article={a} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                    }

                    <div className="epaper-print-footer">
                        <span>CurrentIAS Prep Daily ePaper · currentiasprep.in</span>
                        <span>{epaper.dateFormatted}</span>
                    </div>
                </div>
            </div >
        </>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   Article Card Sub-Component
   ───────────────────────────────────────────────────────────────────────── */

function ArticleCard({
    article: a,
    compact = false,
}: {
    article: EpaperArticle;
    compact?: boolean;
}) {
    return (
        <div
            className={`epaper-print-article ${compact ? 'compact' : ''}`}
            style={{ borderTop: `4px solid ${GS_COLORS[a.gsPaper] || '#8B4513'}` }}
        >

            <div className="epaper-print-article-cat">
                {CAT_LABELS[a.category] || a.category.toUpperCase()} · {a.gsPaper}
            </div>
            <h3 className="epaper-print-article-headline">{a.headline}</h3>
            <div className="epaper-print-article-source">
                {a.source} · {a.importance === 'high' ? '★' : a.importance === 'medium' ? '●' : '○'}
            </div>

            <div className="epaper-print-article-body">
                {renderText(a.explainer)}
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
        </div>
    );
}
