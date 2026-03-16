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

interface CsatComprehension {
    passage: string;
    questions: {
        question: string;
        options: string[];
        answer: string;
        explanation: string;
    }[];
}

interface CsatReasoning {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
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
    csatMocks?: {
        comprehension: CsatComprehension[];
        reasoning: CsatReasoning[];
    };
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

function truncateWords(text: string, maxWords: number): string {
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    // Find the last complete sentence within the word limit
    const truncated = words.slice(0, maxWords).join(' ');
    const lastPeriod = truncated.lastIndexOf('.');
    if (lastPeriod > truncated.length * 0.6) {
        return truncated.substring(0, lastPeriod + 1);
    }
    return truncated + '...';
}

/**
 * Normalizes explainer text that may use different bullet formats into
 * a standard "• bullet\n• bullet\nPassage text" format.
 * Handles:
 *   - Standard • bullets
 *   - Markdown *   bullets
 *   - PART 1 — KEY FACTS / PART 2 — ANALYSIS structure
 */
function normalizeExplainer(raw: string): string {
    // Handle PART 1 / PART 2 structure
    const part1Match = raw.match(/PART\s*1[^:]*:([\s\S]*?)(?=PART\s*2|$)/i);
    const part2Match = raw.match(/PART\s*2[^:]*:([\s\S]*)/i);
    if (part1Match && part2Match) {
        const factsRaw = part1Match[1].trim();
        const analysis = part2Match[1].trim();
        // Convert * bullets to • bullets
        const facts = factsRaw
            .split(/\n/)
            .map(l => l.trim())
            .filter(l => l.length > 0)
            .map(l => l.replace(/^\*\s+/, '• '))
            .join('\n');
        return facts + '\n' + analysis;
    }
    // Handle markdown * bullets (lines starting with *   or * )
    if (/^\*\s{1,}/m.test(raw)) {
        return raw.replace(/^\*\s{1,}/gm, '• ');
    }
    return raw;
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
                <div className="epaper-print-page" style={{ display: 'flex', flexDirection: 'column', position: 'relative', height: '277mm', maxHeight: '277mm', overflow: 'hidden', boxSizing: 'border-box' }}>
                    {/* Masthead */}
                    <header className="epaper-print-masthead" style={{ marginBottom: '18px', flexShrink: 0 }}>
                        <div style={{
                            position: 'relative',
                            overflow: 'hidden',
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
                        <div className="epaper-print-masthead-rule" style={{ marginTop: '10px' }} />
                    </header>

                    {/* Top headlines bar */}
                    <div className="epaper-print-headlines-bar" style={{ flexShrink: 0 }}>
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
                                style={{ borderTop: `4px solid ${GS_COLORS[lead.gsPaper] || '#8B4513'}`, paddingTop: '12px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '20px', flex: 1, overflow: 'hidden', backgroundImage: 'linear-gradient(to right, transparent calc(42% - 12px), var(--ep-rule) calc(42% - 12px), var(--ep-rule) calc(42% - 11px), transparent calc(42% - 11px))' }}>
                                    {/* Left Main Content: Title, Meta, Pointers */}
                                    <div style={{ flex: '0 0 calc(42% - 24px)', boxSizing: 'border-box', overflow: 'hidden' }}>
                                        <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                            <div className="epaper-print-lead-category">
                                                {CAT_LABELS[lead.category] || lead.category.toUpperCase()} · {lead.gsPaper}
                                            </div>
                                            <h2 className="epaper-print-lead-headline" style={{ fontSize: '26px', lineHeight: 1.15, marginTop: '6px' }}>{lead.headline}</h2>
                                            <div className="epaper-print-lead-meta" style={{ marginTop: '8px' }}>
                                                Source: {lead.source} · {lead.importance === 'high' ? '★ HIGH PRIORITY' : lead.importance === 'medium' ? '● MEDIUM' : '○ LOW'}
                                            </div>

                                            <div className="epaper-print-key-terms" style={{ marginTop: '10px' }}>
                                                <strong>Key Terms:</strong> {lead.keyTerms.join(' · ')}
                                            </div>
                                        </div>

                                        <div className="epaper-print-pointers-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
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
                                            {lead.trivia && (
                                                <div style={{ background: 'rgba(212,121,28,0.08)', padding: '8px 10px', borderRadius: '5px', lineHeight: 1.4, fontSize: '12px', border: '1px solid rgba(212,121,28,0.15)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', marginTop: 'auto', marginBottom: 0 }}>
                                                    <div style={{ fontWeight: 700, color: '#D4791C', marginBottom: '3px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💡 Did You Know?</div>
                                                    <div style={{ color: '#5C3D1A', fontFamily: "'Source Serif 4', Georgia, serif" }}>{lead.trivia}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Sidebar: Explainer */}
                                    <div style={{ flex: '1', boxSizing: 'border-box', overflow: 'hidden' }}>
                                        <div className="epaper-print-lead-body" style={{ fontSize: '13px', lineHeight: 1.6, textAlign: 'justify', columns: 1 }}>
                                            {(() => {
                                                const rawOriginal = typeof lead.explainer === 'string' ? lead.explainer : Object.entries(lead.explainer || {}).map(([k, v]) => `**${k}:** ${v}`).join('\n');
                                                const raw = normalizeExplainer(rawOriginal);
                                                const parts = raw.split(/\s*•\s*/);
                                                const bullets: string[] = [];
                                                let passage = '';
                                                parts.forEach((p, i) => {
                                                    const trimmed = p.trim();
                                                    if (!trimmed) return;
                                                    if (i === 0 && !raw.trim().startsWith('•')) {
                                                        passage = trimmed;
                                                    } else {
                                                        bullets.push(trimmed);
                                                    }
                                                });
                                                if (bullets.length > 0 && !passage) {
                                                    const last = bullets[bullets.length - 1];
                                                    if (last.length > 120) {
                                                        passage = bullets.pop()!;
                                                    }
                                                }
                                                if (bullets.length === 0) {
                                                    return renderText(raw);
                                                }
                                                return (
                                                    <>
                                                        <div style={{ background: '#CCCCCC', borderRadius: '5px', padding: '8px 10px', marginBottom: '10px', fontSize: '13px', lineHeight: 1.5, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                                            {bullets.map((b, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: i < bullets.length - 1 ? '5px' : '0' }}>• {b}</div>)}
                                                        </div>
                                                        {passage && renderText(passage)}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}




                </div>

                {/* === ARTICLE PAGES: 2 per page === */}
                {(() => {
                    // Flatten all articles except lead (index 0)
                    const allArticles = epaper.articles.slice(1);
                    const pages: EpaperArticle[][] = [];
                    for (let i = 0; i < allArticles.length; i += 2) {
                        pages.push(allArticles.slice(i, i + 2));
                    }
                    return pages.map((pair, pageIdx) => (
                        <div key={pageIdx} className="epaper-print-page" style={{ pageBreakBefore: 'always', breakBefore: 'page', display: 'flex', flexDirection: 'column', gap: '0', padding: '6mm 12mm', height: '277mm', maxHeight: '277mm', overflow: 'hidden', boxSizing: 'border-box' }}>
                            {pair.map((a, cardIdx) => (
                                <div key={a.id} style={{
                                    flex: '1',
                                    borderTop: `3px solid ${GS_COLORS[a.gsPaper] || '#8B4513'}`,
                                    padding: '10px 0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    ...(cardIdx === 0 ? { borderBottom: '1px solid var(--ep-rule)', paddingBottom: '6px', marginBottom: '6px' } : {}),
                                }}>
                                    {/* Header row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: GS_COLORS[a.gsPaper] || '#8B4513', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                                            {CAT_LABELS[a.category] || a.category.toUpperCase()} · {a.gsPaper}
                                        </span>
                                        <span style={{ fontSize: '9px', color: '#8B6B42', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                                            {a.source} · {a.importance === 'high' ? '★' : a.importance === 'medium' ? '●' : '○'}
                                        </span>
                                    </div>
                                    {/* Headline */}
                                    <h3 style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.15, margin: '0 0 5px 0', color: '#33200A', fontFamily: "'Source Serif 4', Georgia, serif" }}>{a.headline}</h3>
                                    {/* Two-column body */}
                                    <div style={{ display: 'flex', gap: '14px', flex: 1, overflow: 'hidden' }}>
                                        {/* Left: explainer */}
                                        <div style={{ flex: '1.3', fontSize: '11px', lineHeight: 1.6, color: '#3D2B1A', fontFamily: "'Source Serif 4', Georgia, serif", textAlign: 'justify', overflow: 'hidden' }}>
                                            {(() => {
                                                const rawText = typeof a.explainer === 'string' ? a.explainer : Object.entries(a.explainer || {}).map(([k, v]) => `**${k}:** ${v}`).join('\n');
                                                const raw = truncateWords(normalizeExplainer(rawText), 180);
                                                // Split by • marker (handles inline "• fact1. • fact2." format)
                                                const parts = raw.split(/\s*•\s*/);
                                                const bullets: string[] = [];
                                                let passage = '';
                                                parts.forEach((p, i) => {
                                                    const trimmed = p.trim();
                                                    if (!trimmed) return;
                                                    if (i === 0 && !raw.trim().startsWith('•')) {
                                                        // Text before first bullet = passage prefix
                                                        passage = trimmed;
                                                    } else if (i === parts.length - 1 && trimmed.length > 80 && !trimmed.endsWith('.')) {
                                                        // Long last segment without period = passage
                                                        passage = trimmed;
                                                    } else {
                                                        bullets.push(trimmed);
                                                    }
                                                });
                                                // If no bullets found, check if last segment is the passage
                                                if (bullets.length > 0 && !passage) {
                                                    // Last bullet might actually be the passage (longer text without bullet style)
                                                    const last = bullets[bullets.length - 1];
                                                    if (last.length > 120) {
                                                        passage = bullets.pop()!;
                                                    }
                                                }
                                                // If still no separation, treat everything as passage
                                                if (bullets.length === 0) {
                                                    return renderText(raw);
                                                }
                                                return (
                                                    <>
                                                        <div style={{ background: '#EFEFEF', borderRadius: '5px', padding: '8px 10px', marginBottom: '8px', fontSize: '10.5px', lineHeight: 1.5, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                                            {bullets.map((b, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: i < bullets.length - 1 ? '5px' : '0' }}>• {b}</div>)}
                                                        </div>
                                                        {passage && renderText(passage)}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        {/* Right: terms + pointers */}
                                        <div style={{ flex: '1', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <div style={{ background: 'rgba(139,69,19,0.06)', padding: '5px 8px', borderRadius: '4px', fontSize: '11px', lineHeight: 1.4 }}>
                                                <strong style={{ color: '#8B4513' }}>Key Terms:</strong> <span style={{ color: '#5C3D1A' }}>{a.keyTerms.slice(0, 4).join(' · ')}</span>
                                            </div>
                                            {a.prelims && a.prelimsPoints.length > 0 && (
                                                <div style={{ background: 'rgba(192,57,43,0.06)', padding: '6px 8px', borderRadius: '4px', lineHeight: 1.4, fontSize: '11px', border: '1px solid rgba(192,57,43,0.12)' }}>
                                                    <div style={{ fontWeight: 700, color: '#C0392B', marginBottom: '2px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📝 Prelims</div>
                                                    {a.prelimsPoints.slice(0, 3).map((p, i) => <div key={i} style={{ color: '#5C3D1A', paddingLeft: '10px', textIndent: '-10px' }}>• {p}</div>)}
                                                </div>
                                            )}
                                            {a.mains && a.mainsPoints.length > 0 && (
                                                <div style={{ background: 'rgba(26,60,110,0.06)', padding: '6px 8px', borderRadius: '4px', lineHeight: 1.4, fontSize: '11px', border: '1px solid rgba(26,60,110,0.12)' }}>
                                                    <div style={{ fontWeight: 700, color: '#1A3C6E', marginBottom: '2px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>✍️ Mains</div>
                                                    {a.mainsPoints.slice(0, 2).map((p, i) => <div key={i} style={{ color: '#5C3D1A', paddingLeft: '10px', textIndent: '-10px' }}>• {p}</div>)}
                                                </div>
                                            )}
                                            {a.trivia && (
                                                <div style={{ background: 'rgba(212,121,28,0.08)', padding: '6px 8px', borderRadius: '4px', lineHeight: 1.4, fontSize: '11px', border: '1px solid rgba(212,121,28,0.12)' }}>
                                                    <span style={{ fontWeight: 700, color: '#D4791C' }}>💡 </span>
                                                    <span style={{ color: '#5C3D1A' }}>{a.trivia}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ));
                })()}

                {/* === PRELIMS MOCK PAGE === */}
                {epaper.prelimsMocks && epaper.prelimsMocks.length > 0 && (
                    <div className="epaper-print-page" style={{ pageBreakBefore: 'always', breakBefore: 'page', padding: '10mm 12mm', height: '277mm', maxHeight: '277mm', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                        <header style={{ background: '#C0392B', borderRadius: '6px', padding: '8px 14px', marginBottom: '10px', textAlign: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', flexShrink: 0 }}>
                            <h2 style={{ margin: 0, color: '#FFF1E5', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                                📝 Prelims Mock — Daily Practice
                            </h2>
                        </header>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
                            {epaper.prelimsMocks.slice(0, 4).map((q, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.5)', padding: '8px 10px', borderRadius: '5px', border: '1px solid rgba(139,69,19,0.12)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                                    <div style={{ fontWeight: 700, fontSize: '10.5px', color: '#33200A', textAlign: 'justify', marginBottom: '4px', lineHeight: 1.45 }}>Q{i + 1}. {q.question}</div>
                                    {q.options && q.options.length > 0 && (
                                        <div style={{ marginLeft: '12px', fontSize: '10.5px', color: '#5C3D1A', marginBottom: '4px', lineHeight: 1.4 }}>
                                            {q.options.map((opt, j) => <div key={j}>{opt}</div>)}
                                        </div>
                                    )}
                                    <div style={{ background: 'var(--ep-bg)', padding: '4px 8px', borderRadius: '3px', border: '1px solid rgba(139,69,19,0.06)', fontSize: '10.5px', lineHeight: 1.4 }}>
                                        <span style={{ fontWeight: 700, color: '#8B4513' }}>Answer: </span>
                                        <span style={{ color: '#33200A' }}>{q.answer}</span>
                                        <div style={{ color: '#5C3D1A', marginTop: '2px' }}>{q.explanation}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* === CSAT MOCK PAGE === */}
                {epaper.csatMocks && (epaper.csatMocks.comprehension?.length > 0 || epaper.csatMocks.reasoning?.length > 0) && (
                    <div className="epaper-print-page" style={{ pageBreakBefore: 'always', breakBefore: 'page', padding: '10mm 12mm', height: '277mm', maxHeight: '277mm', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                        <header style={{ background: '#00796B', borderRadius: '6px', padding: '8px 14px', marginBottom: '10px', textAlign: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', flexShrink: 0 }}>
                            <h2 style={{ margin: 0, color: '#FFF', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                                🧩 CSAT Paper II — Daily Practice
                            </h2>
                        </header>

                        {/* Two-column layout: Comprehension left, Reasoning right */}
                        <div style={{ display: 'flex', gap: '12px', flex: 1, overflow: 'hidden' }}>
                            {/* LEFT COLUMN: Comprehension */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                                {epaper.csatMocks.comprehension?.slice(0, 1).map((comp, ci) => (
                                    <div key={`comp-${ci}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 700, fontSize: '10px', color: '#00796B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>COMPREHENSION</div>
                                        <div style={{ background: 'rgba(0,121,107,0.06)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(0,121,107,0.15)', fontSize: '9.5px', lineHeight: 1.45, color: '#33200A', textAlign: 'justify' }}>
                                            {comp.passage.length > 300 ? comp.passage.substring(0, 300) + '...' : comp.passage}
                                        </div>
                                        {comp.questions?.slice(0, 2).map((q, qi) => (
                                            <div key={qi} style={{ background: 'rgba(255,255,255,0.5)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(0,121,107,0.1)', overflow: 'hidden' }}>
                                                <div style={{ fontWeight: 700, fontSize: '9.5px', color: '#33200A', marginBottom: '2px', lineHeight: 1.35 }}>Q{qi + 1}. {q.question}</div>
                                                <div style={{ marginLeft: '8px', fontSize: '9.5px', color: '#5C3D1A', lineHeight: 1.3, marginBottom: '2px' }}>
                                                    {q.options?.map((opt, oi) => <div key={oi}>{opt}</div>)}
                                                </div>
                                                <div style={{ background: 'rgba(0,121,107,0.04)', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', lineHeight: 1.3 }}>
                                                    <span style={{ fontWeight: 700, color: '#00796B' }}>Ans: </span>
                                                    <span style={{ color: '#33200A' }}>{q.answer}</span>
                                                    <div style={{ color: '#5C3D1A', marginTop: '1px' }}>{q.explanation.length > 80 ? q.explanation.substring(0, 80) + '…' : q.explanation}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {/* Divider line */}
                            <div style={{ width: '1px', background: 'rgba(0,121,107,0.2)', flexShrink: 0 }} />

                            {/* RIGHT COLUMN: Reasoning */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                                <div style={{ fontWeight: 700, fontSize: '10px', color: '#00796B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>LOGICAL REASONING</div>
                                {epaper.csatMocks.reasoning?.slice(0, 3).map((q, ri) => (
                                    <div key={ri} style={{ background: 'rgba(255,255,255,0.5)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(0,121,107,0.1)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 700, fontSize: '9.5px', color: '#33200A', marginBottom: '2px', lineHeight: 1.35 }}>Q{ri + 1}. {q.question}</div>
                                        <div style={{ marginLeft: '8px', fontSize: '9.5px', color: '#5C3D1A', lineHeight: 1.3, marginBottom: '2px' }}>
                                            {q.options?.map((opt, oi) => <div key={oi}>{opt}</div>)}
                                        </div>
                                        <div style={{ background: 'rgba(0,121,107,0.04)', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', lineHeight: 1.3 }}>
                                            <span style={{ fontWeight: 700, color: '#00796B' }}>Ans: </span>
                                            <span style={{ color: '#33200A' }}>{q.answer}</span>
                                            <div style={{ color: '#5C3D1A', marginTop: '1px' }}>{q.explanation.length > 80 ? q.explanation.substring(0, 80) + '…' : q.explanation}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* === MAINS MOCK PAGE === */}
                {epaper.mainsMocks && epaper.mainsMocks.length > 0 && (
                    <div className="epaper-print-page" style={{ pageBreakBefore: 'always', breakBefore: 'page', padding: '10mm 12mm', height: '277mm', maxHeight: '277mm', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                        <header style={{ background: '#1A3C6E', borderRadius: '6px', padding: '8px 14px', marginBottom: '10px', textAlign: 'center', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', flexShrink: 0 }}>
                            <h2 style={{ margin: 0, color: '#FFF1E5', fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                                ✍️ Mains Mock — Daily Practice
                            </h2>
                        </header>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflow: 'hidden' }}>
                            {epaper.mainsMocks.slice(0, 4).map((q, i) => {
                                // Truncate syllabus to ~120 chars for 2-line display
                                const syllabusShort = q.syllabusMatch.length > 120
                                    ? q.syllabusMatch.substring(0, q.syllabusMatch.lastIndexOf(' ', 120)) + '…'
                                    : q.syllabusMatch;
                                return (
                                    <div key={i} style={{ background: 'rgba(255,255,255,0.5)', padding: '6px 10px', borderRadius: '5px', border: '1px solid rgba(139,69,19,0.12)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 700, fontSize: '10.5px', color: '#33200A', textAlign: 'justify', marginBottom: '3px', lineHeight: 1.4 }}>Q{i + 1}. {q.question}</div>
                                        <div style={{ background: 'var(--ep-bg)', padding: '4px 8px', borderRadius: '3px', border: '1px solid rgba(139,69,19,0.06)', fontSize: '10px', lineHeight: 1.35 }}>
                                            <div style={{ fontWeight: 700, color: '#1A3C6E', marginBottom: '1px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Syllabus: {syllabusShort}</div>
                                            <div style={{ fontWeight: 700, color: '#8B4513', marginBottom: '1px', fontSize: '10px' }}>Approach:</div>
                                            <div style={{ color: '#5C3D1A', fontStyle: 'italic', fontSize: '10px' }}>{q.approach}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Bottom masthead - in normal flow */}
                        <div style={{ marginTop: 'auto', flexShrink: 0, background: '#CCCCCC', borderRadius: '6px', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                            <img src="/images/logo_globe.png?v=2" alt="Globe" style={{ height: '32px', objectFit: 'contain' }} crossOrigin="anonymous" />
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1A3C6E', letterSpacing: '0.1em', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Current IAS Prep</div>
                                <div style={{ fontSize: '9px', color: '#3D2B1A', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: '1px' }}>Daily Current Affairs Digest for UPSC CSE Aspirants · currentiasprep.in</div>
                            </div>
                        </div>
                    </div>
                )}

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
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '24px', backgroundImage: 'linear-gradient(to right, transparent calc(58.33% - 12px), var(--ep-rule) calc(58.33% - 12px), var(--ep-rule) calc(58.33% - 11px), transparent calc(58.33% - 11px))' }}>
                <div style={{ flex: '1.4', boxSizing: 'border-box' }}>
                    <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
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

                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
                    <div className="epaper-print-key-terms" style={{ marginTop: 0 }}>
                        <strong>Key Terms:</strong> {a.keyTerms.join(' · ')}
                    </div>

                    <div className="epaper-print-pointers-row">
                        {a.prelims && a.prelimsPoints.length > 0 && (
                            <div className="epaper-print-pointer-box" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                <div className="epaper-print-pointer-title">📝 PRELIMS</div>
                                <ul>
                                    {a.prelimsPoints.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                        )}
                        {a.mains && a.mainsPoints.length > 0 && (
                            <div className="epaper-print-pointer-box" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                <div className="epaper-print-pointer-title">✍️ MAINS</div>
                                <ul>
                                    {a.mainsPoints.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                        )}
                        {a.trivia && (
                            <div className="epaper-print-trivia-box" style={{ marginTop: 'auto', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
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
