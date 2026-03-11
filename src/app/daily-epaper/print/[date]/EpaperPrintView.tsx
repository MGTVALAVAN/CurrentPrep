'use client';

import React, { useState, useEffect } from 'react';
import { Download, Printer, ArrowLeft, Loader2 } from 'lucide-react';
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
    trivia?: string;
    date?: string;
}

interface MockQuestion {
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
}

interface MainsMockQuestion {
    question: string;
    syllabusMatch: string;
    approach: string;
}

interface DailyEpaper {
    date: string;
    dateFormatted: string;
    articles: EpaperArticle[];
    highlights: string[];
    sources: string[];
    totalProcessed: number;
    prelimsMocks?: MockQuestion[];
    mainsMocks?: MainsMockQuestion[];
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

const UPSC_TRIVIA = [
    "✅ The Constitution was handwritten by Prem Behari Narain Raizada in a flowing italic style.",
    "✅ Project Tiger was launched in April 1973; Jim Corbett National Park was the very first.",
    "✅ Majuli island in Assam is recorded as the largest river island in the world.",
    "✅ The Indian Railways is the fourth largest railway network in the world by size.",
    "✅ Sikkim became the first fully organic state of India in 2016.",
    "✅ The Right to Information Act came into force on October 12, 2005.",
    "✅ The Panchayati Raj system was first adopted by Rajasthan in Nagaur district on Oct 2, 1959.",
    "✅ Article 32 is considered the 'Heart and Soul' of the Constitution.",
    "✅ The Reserve Bank of India was established on April 1, 1935.",
    "✅ The term 'Secular' was added to the Preamble by the 42nd Amendment.",
    "✅ The Goods and Services Tax (GST) was introduced in India on July 1, 2017.",
    "✅ VVPAT was first used in the 2013 Noksen assembly by-election in Nagaland."
];

const UPSC_PYQ_FALLBACKS: Record<string, { headline: string; explainer: string; keyTerms: string[]; source: string; prelimsPoints: string[]; mainsPoints: string[]; }> = {
    GS1: {
        headline: "Revisiting the 1857 Revolt: UPSC PYQ Perspective",
        explainer: "The 1857 Revolt remains a perennial favorite in UPSC exams. It marked a watershed moment in colonial Indian history, transitioning power from the East India Company to the British Crown.\n\nIn recent examinations, the focus has shifted from mere factual recall to analyzing the sociopolitical consequences and the diverse regional participation. Understanding the socio-economic causes—such as the ruination of indigenous industries, heavy taxation under the Ryotwari and Zamindari systems, and the annexation policies—is crucial.\n\nFurthermore, the revolt highlighted the lack of political unity and modern nationalism among the sepoys, which eventually paved the way for organized political movements culminating in the Indian National Congress.",
        keyTerms: ["1857 Revolt", "Doctrine of Lapse", "Government of India Act 1858"],
        source: "PYQ Archives",
        prelimsPoints: [
            "Mangal Pandey belonged to the 34th Bengal Native Infantry.",
            "Lord Canning was the Governor-General during the revolt.",
            "The revolt started at Meerut on May 10, 1857."
        ],
        mainsPoints: [
            "Analyze the socio-economic impact of British policies that culminated in the 1857 uprising.",
            "Evaluate the consequences of the Government of India Act 1858 on administrative centralization."
        ]
    },
    GS2: {
        headline: "The Dynamic Nature of the Basic Structure Doctrine",
        explainer: "The concept of the 'Basic Structure' of the Constitution, established in the landmark Kesavananda Bharati case (1973), frequently appears in both Prelims and Mains. It severely curtails the Parliament's amending power under Article 368, ensuring that fundamental tenets like secularism, federalism, and judicial review remain intact.\n\nRecent UPSC questions have probed into the evolution of this doctrine through subsequent cases like Minerva Mills and S.R. Bommai. \n\nAnswering Mains questions on this topic requires harmonizing the doctrine with parliamentary sovereignty. Highlight how it acts as a bulwark against majoritarian excess while maintaining constitutional fluidity.",
        keyTerms: ["Basic Structure", "Kesavananda Bharati Case", "Article 368"],
        source: "Constitutional PYQ",
        prelimsPoints: [
            "The doctrine was laid down by the Supreme Court in 1973.",
            "It restricts the amending power of the Parliament under Article 368.",
            "Secularism and Federal character are part of the basic structure."
        ],
        mainsPoints: [
            "Discuss how the Basic Structure doctrine limits parliamentary sovereignty without compromising constitutional flexibility.",
            "Analyze the evolution of the basic structure doctrine from Golaknath to Minerva Mills."
        ]
    },
    GS3: {
        headline: "Navigating India's Fiscal Deficit and FRBM Act",
        explainer: "Macroeconomic stability, specifically centered around the Fiscal Responsibility and Budget Management (FRBM) Act, is a core theme in GS Paper 3. The FRBM Act aims to ensure inter-generational equity in fiscal management and long-term macro-economic stability.\n\nRepeated UPSC queries ask aspirants to unpack the reasons for relaxing FRBM targets during crises via the 'Escape Clause'. A nuanced answer should discuss the dilemma between stimulating economic growth via capital expenditure and adhering to strict deficit targets to prevent inflation and sovereign rating downgrades.\n\nStudents must integrate recent N.K. Singh Committee recommendations and current budget estimates to score well.",
        keyTerms: ["FRBM Act", "Fiscal Deficit", "Escape Clause"],
        source: "Economic Survey PYQ",
        prelimsPoints: [
            "The FRBM Act was enacted in 2003 to institutionalize financial discipline.",
            "The N.K. Singh Committee reviewed the FRBM framework in 2016.",
            "The escape clause allows deviation from fiscal deficit targets under specific circumstances."
        ],
        mainsPoints: [
            "Evaluate the effectiveness of the FRBM Act in managing India's public debt and fiscal deficit.",
            "Discuss the implications of invoking the escape clause during macroeconomic shocks."
        ]
    },
    GS4: {
        headline: "Emotional Intelligence in Civil Services Administration",
        explainer: "Emotional Intelligence has transitioned from a theoretical concept to a highly applied testing metric in GS Paper 4 Case Studies. UPSC frequently tests the application of EI in resolving conflicts of interest, dealing with political pressure, and managing crisis situations like mob violence or disaster relief.\n\nDaniel Goleman's framework—comprising self-awareness, self-regulation, social awareness, and relationship management—is crucial for structuring answers. \n\nAspirants should use practical administrative examples, such as remaining objective despite empathetic triggers or using persuasive communication to implement unpopular but necessary reforms.",
        keyTerms: ["Emotional Intelligence", "Empathy", "Objectivity"],
        source: "Ethics Case Studies",
        prelimsPoints: ["EI includes self-awareness, self-regulation, motivation, empathy, and social skills."],
        mainsPoints: [
            "How can emotional intelligence be applied by civil servants to resolve ethically ambiguous situations?",
            "Illustrate the application of empathy and self-regulation in disaster management."
        ]
    }
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
    const [showPdfModal, setShowPdfModal] = useState(false);

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

    const handleDownloadPDF = () => setShowPdfModal(true);

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
            {/* Modal for PDF Generation */}
            {showPdfModal && (
                <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
                    <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-[#8B4513]/20">
                        <div className="p-6 bg-[#FFF1E5] flex flex-col items-center border-b border-[#8B4513]/10">
                            <div className="w-16 h-16 rounded-full bg-[#8B4513]/10 flex items-center justify-center mb-4">
                                <Download size={32} color="#8B4513" />
                            </div>
                            <h2 className="text-xl font-bold text-[#33200A]">High-Quality PDF Engine</h2>
                            <p className="text-center text-[#5C3D1A] text-sm mt-2">
                                For an A4 formatted, perfect resolution, and text-searchable native PDF (unlike generic browser snapshots), we securely utilise your computer's built-in print PDF generator.
                            </p>
                        </div>
                        <div className="p-6 bg-white flex flex-col gap-4">
                            <div className="flex gap-4 items-center p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="font-bold text-blue-600 bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">1</div>
                                <div className="text-sm font-medium text-slate-700">Click <strong>Generate Native PDF</strong> below to open the dialog.</div>
                            </div>
                            <div className="flex gap-4 items-center p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="font-bold text-blue-600 bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">2</div>
                                <div className="text-sm font-medium text-slate-700">Simply ensure the Destination is set to <strong>Save as PDF</strong> and click Save!</div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                            <button
                                onClick={() => setShowPdfModal(false)}
                                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowPdfModal(false);
                                    // Give React a split second to remove the modal from the DOM before calling print
                                    setTimeout(() => window.print(), 100);
                                }}
                                className="px-6 py-2 bg-[#8B4513] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#6A330B] transition-colors"
                            >
                                Generate Native PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        className="epaper-print-btn"
                        style={{
                            background: 'linear-gradient(135deg, #C0392B, #8B1A1A)',
                            minWidth: 200,
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <Download size={16} /> Download PDF
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
            <div id="epaper-pdf-content" className="epaper-print-wrapper">

                {/* === PAGE 1: FRONT PAGE === */}
                <div className="epaper-print-page" style={{ display: 'block', position: 'relative' }}>
                    {/* Masthead */}
                    <header className="epaper-print-masthead" style={{ marginBottom: '24px', flexShrink: 0 }}>
                        <div style={{
                            position: 'relative',
                            overflow: 'hidden',
                            /* Clean red banner background */
                            backgroundColor: '#C0392B',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '40px',
                            padding: '28px 0',
                            borderRadius: '16px',
                        }}>

                            <img src="/images/logo_globe.png?v=2" alt="Globe Icon" style={{ height: '140px', objectFit: 'contain', position: 'relative', zIndex: 1 }} crossOrigin="anonymous" />
                            <div style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                padding: '16px 45px',
                                borderRadius: '35px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                border: '2px solid rgba(255, 255, 255, 1)',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                <img src="/images/logo_text.png?v=2" alt="Current IAS Prep" style={{ height: '70px', objectFit: 'contain' }} crossOrigin="anonymous" />
                            </div>
                        </div>

                        <div className="epaper-print-masthead-inner" style={{ padding: '8px 4px 0 4px', alignItems: 'flex-end' }}>
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
                        <div className="epaper-print-masthead-rule" style={{ marginTop: '12px' }} />
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
                                style={{ borderTop: `4px solid ${GS_COLORS[lead.gsPaper] || '#8B4513'}`, paddingTop: '14px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                            >
                                <div style={{ display: 'block' }}>
                                    {/* Floated Left Column: Title, Meta, Pointers */}
                                    <div style={{ float: 'left', width: '42%', paddingRight: '24px', marginRight: '24px', borderRight: '1px solid var(--ep-rule)', boxSizing: 'border-box' }}>
                                        <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                            <div className="epaper-print-lead-category">
                                                {CAT_LABELS[lead.category] || lead.category.toUpperCase()} · {lead.gsPaper}
                                            </div>
                                            <h2 className="epaper-print-lead-headline" style={{ fontSize: '28px', lineHeight: 1.2, marginTop: '8px' }}>{lead.headline}</h2>
                                            <div className="epaper-print-lead-meta" style={{ marginTop: '12px' }}>
                                                Source: {lead.source} · {lead.importance === 'high' ? '★ HIGH PRIORITY' : lead.importance === 'medium' ? '● MEDIUM' : '○ LOW'}
                                            </div>

                                            <div className="epaper-print-key-terms" style={{ marginTop: '16px' }}>
                                                <strong>Key Terms:</strong> {lead.keyTerms.join(' · ')}
                                            </div>
                                        </div>

                                        <div className="epaper-print-pointers-row" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                                            {lead.prelims && lead.prelimsPoints.length > 0 && (
                                                <div className="epaper-print-pointer-box" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                                    <div className="epaper-print-pointer-title">📝 PRELIMS POINTERS</div>
                                                    <ul>
                                                        {lead.prelimsPoints.map((p, i) => <li key={i}>{p}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {lead.mains && lead.mainsPoints.length > 0 && (
                                                <div className="epaper-print-pointer-box" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                                    <div className="epaper-print-pointer-title">✍️ MAINS DIMENSIONS</div>
                                                    <ul>
                                                        {lead.mainsPoints.map((p, i) => <li key={i}>{p}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column: Explainer */}
                                    <div className="epaper-print-lead-body" style={{ fontSize: '13px', lineHeight: 1.8, textAlign: 'justify' }}>
                                        {renderText(lead.explainer)}
                                        {lead.trivia && (
                                            <div className="epaper-print-trivia-box" style={{ marginTop: '16px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                                <div className="epaper-print-trivia-title">💡 DID YOU KNOW?</div>
                                                {renderText(lead.trivia)}
                                            </div>
                                        )}
                                    </div>
                                    {/* Clear float spacer */}
                                    <div style={{ clear: 'both' }}></div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Fun Trivia or Filler Box at Bottom of Page 1 if needed */}
                    <div style={{ display: 'flex', background: '#33200A', color: '#FFF1E5', padding: '16px', borderRadius: '8px', marginTop: '16px', alignItems: 'center', gap: '16px' }}>
                        <div style={{ fontSize: '24px' }}>💡</div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '4px' }}>UPSC Prep Trivia of the Day</h4>
                            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.4 }}>{UPSC_TRIVIA[0]}</p>
                        </div>
                    </div>
                </div>

                <div className="epaper-print-page" style={{ position: 'relative' }}>
                    {/* === REMAINING ARTICLES CONTINUED === */}
                    {
                        (['GS1', 'GS2', 'GS3', 'GS4'] as const)
                            .map((gs, idx) => {
                                const articles = grouped[gs] || [];
                                const remaining = articles.filter(
                                    (a) => !epaper?.articles?.[0] || a.id !== epaper.articles[0].id
                                );

                                if (remaining.length === 0) {
                                    const fallback = UPSC_PYQ_FALLBACKS[gs] || UPSC_PYQ_FALLBACKS['GS2'];
                                    const trivia = UPSC_TRIVIA[(idx + (epaper.articles.length || 0)) % UPSC_TRIVIA.length];

                                    return (
                                        <div key={gs} style={{ marginTop: '24px' }}>
                                            <div className="epaper-print-section-header" style={{ pageBreakAfter: 'avoid', breakAfter: 'avoid', breakInside: 'avoid' }}>
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

                                            <div
                                                className="epaper-print-article"
                                                style={{ borderTop: `4px solid ${GS_COLORS[gs] || '#8B4513'}`, marginTop: '16px' }}
                                            >
                                                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
                                                            <div className="epaper-print-article-cat">
                                                                PREVIOUS YEAR QUESTION SPOTLIGHT · {gs}
                                                            </div>
                                                            <h3 className="epaper-print-article-headline">{fallback.headline}</h3>
                                                            <div className="epaper-print-article-source">
                                                                {fallback.source} · ★ PYQ
                                                            </div>
                                                        </div>

                                                        <div className="epaper-print-article-body" style={{ marginTop: '10px' }}>
                                                            {renderText(fallback.explainer)}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingLeft: '16px', borderLeft: '1px solid var(--ep-rule)' }}>
                                                        <div className="epaper-print-key-terms" style={{ marginTop: 0 }}>
                                                            <strong>Key Terms:</strong> {fallback.keyTerms.join(' · ')}
                                                        </div>

                                                        <div className="epaper-print-pointers-row">
                                                            {fallback.prelimsPoints && fallback.prelimsPoints.length > 0 && (
                                                                <div className="epaper-print-pointer-box">
                                                                    <div className="epaper-print-pointer-title">📝 PRELIMS REVISION</div>
                                                                    <ul>
                                                                        {fallback.prelimsPoints.map((p, i) => <li key={i}>{p}</li>)}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            {fallback.mainsPoints && fallback.mainsPoints.length > 0 && (
                                                                <div className="epaper-print-pointer-box">
                                                                    <div className="epaper-print-pointer-title">✍️ MAINS PRACTICE</div>
                                                                    <ul>
                                                                        {fallback.mainsPoints.map((p, i) => <li key={i}>{p}</li>)}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="bg-[#FFF1E5] p-3 mt-auto text-[#5C3D1A] italic text-xs rounded border border-[#8B4513]/20 shadow-sm" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                                            💡 <strong>UPSC Prep Trivia:</strong> {trivia}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={gs} style={{ marginTop: '24px' }}>
                                        <div className="epaper-print-section-header" style={{ pageBreakAfter: 'avoid', breakAfter: 'avoid', breakInside: 'avoid' }}>
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
                </div>

                {/* --- UPSC PRELIMS & MAINS MOCKS --- */}
                {(epaper.prelimsMocks?.length || epaper.mainsMocks?.length) ? (
                    <div className="epaper-print-page" style={{ paddingTop: '50px' }}>
                        <header className="flex items-center justify-center p-3 mb-8" style={{ background: '#33200A', borderRadius: '8px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                            <h1 className="text-2xl font-bold uppercase tracking-widest text-[#FFF1E5]">UPSC Daily Mocks</h1>
                        </header>

                        {epaper.prelimsMocks && epaper.prelimsMocks.length > 0 && (
                            <div className="mb-10">
                                <h2 className="text-lg font-bold uppercase mb-4 px-4 py-2" style={{ backgroundColor: '#C0392B', color: '#FFF1E5', borderRadius: '4px' }}>
                                    Prelims Mock
                                </h2>
                                <div className="flex flex-col gap-6">
                                    {epaper.prelimsMocks.map((q, i) => (
                                        <div key={i} className="bg-white p-5 rounded-lg border border-[#8B4513]/20 shadow-sm" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                            <div className="font-bold text-[#33200A] text-justify mb-3">Q{i + 1}. {q.question}</div>
                                            {q.options && q.options.length > 0 && (
                                                <div className="ml-4 flex flex-col gap-1 mb-4 text-[#5C3D1A]">
                                                    {q.options.map((opt, j) => (
                                                        <div key={j}>{opt}</div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="bg-[#FFF1E5] p-3 rounded border border-[#8B4513]/10 text-sm">
                                                <div className="font-bold text-[#8B4513] mb-1">Answer: {q.answer}</div>
                                                <div className="text-[#5C3D1A]">{q.explanation}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {epaper.mainsMocks && epaper.mainsMocks.length > 0 && (
                            <div className="mb-10">
                                <h2 className="text-lg font-bold uppercase mb-4 px-4 py-2" style={{ backgroundColor: '#1A3C6E', color: '#FFF1E5', borderRadius: '4px' }}>
                                    Mains Mock
                                </h2>
                                <div className="flex flex-col gap-6">
                                    {epaper.mainsMocks.map((q, i) => (
                                        <div key={i} className="bg-white p-5 rounded-lg border border-[#8B4513]/20 shadow-sm" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                            <div className="font-bold text-[#33200A] text-justify mb-2 text-[15px]">Q{i + 1}. {q.question}</div>
                                            <div className="bg-[#FFF1E5] p-3 rounded border border-[#8B4513]/10 text-sm">
                                                <div className="font-bold text-[#8B4513] mb-1">Approach Hint:</div>
                                                <div className="text-[#5C3D1A] italic">{q.approach}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

                <div className="epaper-print-footer">
                    <span>CurrentIAS Prep Daily ePaper · currentiasprep.in</span>
                    <span>{epaper.dateFormatted}</span>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid', pageBreakAfter: 'avoid', breakAfter: 'avoid' }}>
                        <div className="epaper-print-article-cat">
                            {CAT_LABELS[a.category] || a.category.toUpperCase()} · {a.gsPaper}
                        </div>
                        <h3 className="epaper-print-article-headline">{a.headline}</h3>
                        <div className="epaper-print-article-source">
                            {a.source} · {a.importance === 'high' ? '★' : a.importance === 'medium' ? '●' : '○'}
                        </div>
                    </div>

                    <div className="epaper-print-article-body" style={{ marginTop: '8px' }}>
                        {renderText(a.explainer)}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingLeft: '16px', borderLeft: '1px solid var(--ep-rule)' }}>
                    <div className="epaper-print-key-terms" style={{ marginTop: 0 }}>
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
                        {/* TypeScript explicitly complains if trivia doesn't exist, use optional chaining and truthiness */}
                        {a.trivia && (
                            <div className="epaper-print-trivia-box" style={{ marginTop: 'auto' }}>
                                <div className="epaper-print-trivia-title">💡 DID YOU KNOW?</div>
                                {renderText(a.trivia)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
