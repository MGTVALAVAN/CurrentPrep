'use client';
import React from 'react';
import './v2-styles.css';

/* ─────────────────────────────────────────────────────────────────────────
   Types 
   ───────────────────────────────────────────────────────────────────────── */
export interface EpaperArticle {
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

export interface MockQuestion {
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
}

export interface MainsMockQuestion {
    question: string;
    syllabusMatch: string;
    approach: string;
}

export interface DailyEpaper {
    date: string;
    dateFormatted: string;
    articles: EpaperArticle[];
    highlights: string[];
    sources: string[];
    totalProcessed: number;
    prelimsMocks?: MockQuestion[];
    mainsMocks?: MainsMockQuestion[];
}

// Reusable function to render React elements from string with \n
const renderText = (text: string | Record<string, string>) => {
    if (!text) return null;
    const txt = typeof text === 'string' ? text : Object.values(text).join('\n');
    return txt.split('\n').map((line, i) => <p key={i} style={{ marginBottom: '6px' }}>{line}</p>);
};

export function V2Epaper({ epaper }: { epaper: DailyEpaper }) {
    return (
        <div className="e2-container">
            {/* FRONT PAGE */}
            <div className="e2-page">
                {/* 1. Masthead */}
                <div className="e2-header">
                    <div className="e2-header-title">CURRENTIAS PREP</div>
                    <div className="e2-header-subtitle">Daily Current Affairs ePaper</div>
                    <div className="e2-header-meta">
                        <span>{epaper.dateFormatted}</span> | <span>Vol. I</span> | <span>currentiasprep.in</span> | <span>Page 1</span>
                    </div>
                </div>

                {/* 2. Highlights */}
                <div className="e2-highlights">
                    <div className="e2-highlights-title">TODAY'S HIGHLIGHTS</div>
                    <ul>
                        {epaper.highlights.slice(0, 4).map((h: string, i: number) => (
                            <li key={i}>{h}</li>
                        ))}
                    </ul>
                </div>

                {/* Lead Story Image + Trivia (Optional image placeholder) */}
                <div className="e2-split-box">
                    <div className="e2-split-main style-bg" style={{ backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>[LEAD STORY IMAGE PLACEHOLDER]</span>
                    </div>
                    <div className="e2-split-side e2-list-box flex flex-col justify-center">
                        <div className="e2-list-title">💡 UPSC FACT OF THE DAY</div>
                        <p style={{ fontStyle: 'italic', fontSize: '10px' }}>
                            {/* Assuming Trivia logic is stored somewhere, or we can use the first key term/fallback trivia */}
                            {epaper.articles[0]?.trivia || "The Supreme Court of India adopted its present architectural logo designed to represent scales of justice inside the Ashoka Chakra."}
                        </p>
                    </div>
                </div>

                {/* Lead Headline */}
                <div className="e2-article-headline-box">
                    <h1 className="e2-article-headline">{epaper.articles[0]?.headline || "No Lead Story"}</h1>
                    <div className="e2-article-meta">
                        Source: {epaper.articles[0]?.source || "N/A"} · GS Paper: {epaper.articles[0]?.gsPaper || "N/A"}
                    </div>
                </div>

                {/* Lead Context & Key Terms */}
                <div className="e2-split-box">
                    <div className="e2-split-main">
                        <div className="e2-list-title">STORY EXPLANATION</div>
                        {renderText(epaper.articles[0]?.explainer || "")}
                    </div>
                    <div className="e2-split-side e2-list-box">
                        <div className="e2-list-title">KEY TERMS</div>
                        <ul>
                            {epaper.articles[0]?.keyTerms?.map((kt, j) => <li key={j}>{kt}</li>)}
                        </ul>
                    </div>
                </div>

                {/* Lead Pointers */}
                <div className="e2-split-box">
                    <div className="e2-split-main e2-list-box">
                        <div className="e2-list-title">PRELIMS POINTERS</div>
                        <ul>
                            {epaper.articles[0]?.prelimsPoints?.map((p, j) => <li key={j}>{p}</li>)}
                        </ul>
                    </div>
                    <div className="e2-split-side e2-list-box" style={{ borderLeft: '1px solid var(--e2-rule)' }}>
                        <div className="e2-list-title">MAINS DIMENSIONS</div>
                        <ul>
                            {epaper.articles[0]?.mainsPoints?.map((m, j) => <li key={j}>{m}</li>)}
                        </ul>
                    </div>
                </div>
            </div>

            {/* TOPIC PAGES */}
            {['GS1', 'GS2', 'GS3', 'GS4'].map((gsPaper, pageIndex) => {
                const articles = epaper.articles.filter(a => a.gsPaper === gsPaper && a.id !== epaper.articles[0]?.id);
                if (articles.length === 0) return null;

                return (
                    <div className="e2-page" key={gsPaper}>
                        {/* Masthead Standard */}
                        <div className="e2-header" style={{ padding: '10px', marginBottom: '15px' }}>
                            <div className="e2-header-title" style={{ fontSize: '16px' }}>CURRENTIAS PREP</div>
                            <div className="e2-header-subtitle" style={{ fontSize: '8px' }}>Daily ePaper | Page {pageIndex + 2}</div>
                        </div>

                        {/* Section Header */}
                        <div className="e2-section-hw">
                            <div className="e2-section-title">{gsPaper} — {getGSLabels(gsPaper)}</div>
                        </div>

                        {articles.map((article, idx) => (
                            <div key={idx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', marginBottom: '30px' }}>
                                {/* Article Headline Box split with Key Terms */}
                                <div className="e2-split-box" style={{ marginBottom: 0, borderBottom: 'none' }}>
                                    <div className="e2-split-main flex flex-col justify-center">
                                        <h2 className="e2-article-headline" style={{ fontSize: '18px', textAlign: 'left', marginBottom: '6px' }}>{article.headline}</h2>
                                        <div className="e2-article-meta text-left">Source: {article.source}</div>
                                    </div>
                                    <div className="e2-split-side e2-list-box">
                                        <div className="e2-list-title">KEY TERMS</div>
                                        <ul>
                                            {article.keyTerms?.map((kt, j) => <li key={j}>{kt}</li>)}
                                        </ul>
                                    </div>
                                </div>

                                {/* Article Body split with Trivia */}
                                <div className="e2-split-box" style={{ marginBottom: 0, borderBottom: 'none' }}>
                                    <div className="e2-split-main">
                                        <div className="e2-list-title">CONTEXT & EXPLANATION</div>
                                        {renderText(article.explainer)}
                                    </div>
                                    <div className="e2-split-side flex flex-col justify-center">
                                        <div className="e2-list-title">UPSC FACT</div>
                                        <p style={{ fontStyle: 'italic', fontSize: '10px' }}>
                                            {article.trivia || "UPSC preparation demands consistency over intensity."}
                                        </p>
                                    </div>
                                </div>

                                {/* Pointers */}
                                <div className="e2-split-box">
                                    <div className="e2-split-main e2-list-box">
                                        <div className="e2-list-title">PRELIMS POINTERS</div>
                                        <ul>
                                            {article.prelimsPoints?.map((p, j) => <li key={j}>{p}</li>)}
                                        </ul>
                                    </div>
                                    <div className="e2-split-side e2-list-box" style={{ borderLeft: '1px solid var(--e2-rule)' }}>
                                        <div className="e2-list-title">MAINS DIMENSIONS</div>
                                        <ul>
                                            {article.mainsPoints?.map((m, j) => <li key={j}>{m}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })}

            {/* MOCK PAGES */}
            {epaper.prelimsMocks && epaper.prelimsMocks.length > 0 && (
                <div className="e2-page">
                    <div className="e2-header" style={{ padding: '10px', marginBottom: '15px' }}>
                        <div className="e2-header-title" style={{ fontSize: '16px' }}>UPSC DAILY MOCK</div>
                        <div className="e2-header-subtitle" style={{ fontSize: '8px' }}>Practice Section</div>
                    </div>
                    <div className="e2-section-hw" style={{ background: '#C0392B', borderColor: '#C0392B' }}>
                        <div className="e2-section-title" style={{ color: 'white' }}>PRELIMS MOCK</div>
                    </div>

                    {epaper.prelimsMocks.map((q, i) => (
                        <div key={i} style={{ breakInside: 'avoid', marginBottom: '20px' }}>
                            <div className="e2-split-box flex-col" style={{ display: 'block' }}>
                                <div style={{ padding: '15px', borderBottom: '1px solid var(--e2-rule)' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '10px' }}>Q{i + 1}. {q.question}</div>
                                    {q.options?.map((opt, j) => (
                                        <div key={j} style={{ fontSize: '11px', marginBottom: '4px', paddingLeft: '20px' }}>{opt}</div>
                                    ))}
                                </div>
                                <div style={{ padding: '15px', background: '#F9FAFB' }}>
                                    <div className="e2-list-title">ANSWER & EXPLANATION</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#B91C1C', marginBottom: '4px' }}>Answer: {q.answer}</div>
                                    <div style={{ fontSize: '11px', color: '#4B5563' }}>{q.explanation}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {epaper.mainsMocks && epaper.mainsMocks.length > 0 && (
                <div className="e2-page">
                    <div className="e2-header" style={{ padding: '10px', marginBottom: '15px' }}>
                        <div className="e2-header-title" style={{ fontSize: '16px' }}>UPSC DAILY MOCK</div>
                        <div className="e2-header-subtitle" style={{ fontSize: '8px' }}>Practice Section</div>
                    </div>
                    <div className="e2-section-hw" style={{ background: '#1A3C6E', borderColor: '#1A3C6E' }}>
                        <div className="e2-section-title" style={{ color: 'white' }}>MAINS PRACTICE</div>
                    </div>

                    {epaper.mainsMocks.map((q, i) => (
                        <div key={i} style={{ breakInside: 'avoid', marginBottom: '20px' }}>
                            <div className="e2-split-box flex-col" style={{ display: 'block' }}>
                                <div style={{ padding: '15px', borderBottom: '1px solid var(--e2-rule)' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>Question (10 / 15 Marks)</div>
                                    <div style={{ fontSize: '13px', fontFamily: '"Georgia", serif', fontStyle: 'italic' }}>{q.question}</div>
                                </div>
                                <div style={{ padding: '15px', background: '#F9FAFB' }}>
                                    <div className="e2-list-title">APPROACH</div>
                                    <div style={{ fontSize: '11px', color: '#4B5563' }}>{q.approach}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function getGSLabels(gs: string) {
    if (gs === 'GS1') return 'History, Society, Geography';
    if (gs === 'GS2') return 'Polity, Governance, IR';
    if (gs === 'GS3') return 'Economy, Environment, Science';
    if (gs === 'GS4') return 'Ethics, Integrity & Aptitude';
    return '';
}
