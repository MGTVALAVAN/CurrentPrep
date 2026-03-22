'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, Calendar, BookOpen, PenTool, ChevronDown,
    ChevronUp, Eye, EyeOff, CheckCircle2, XCircle, Target,
    Clock, BarChart3, Zap, FileText, Brain, Archive,
} from 'lucide-react';
import './daily-mock.css';

// ── Types ────────────────────────────────────────────────────────────────

interface PrelimsMock {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

interface MainsMock {
    question: string;
    syllabusMatch: string;
    approach: string;
}

interface CsatCompQ {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

interface CsatComprehension {
    passage: string;
    source?: string;
    questions: CsatCompQ[];
}

interface CsatReasoning {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    category: string;
}

interface MockDay {
    date: string;
    dateFormatted: string;
    prelimsMocks: PrelimsMock[];
    mainsMocks: MainsMock[];
    csatMocks: {
        comprehension: CsatComprehension[];
        reasoning: CsatReasoning[];
    };
}

interface MockData {
    days: MockDay[];
    totalDays: number;
    totalPrelims: number;
    totalMains: number;
    totalCsat: number;
    availableDates: string[];
}

// ═════════════════════════════════════════════════════════════════════════
// PRELIMS QUESTION CARD
// ═════════════════════════════════════════════════════════════════════════

function PrelimsCard({ q, idx }: { q: PrelimsMock; idx: number }) {
    const [selected, setSelected] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);

    const correctIdx = q.options.findIndex(o => o === q.answer);

    const handleSelect = (i: number) => {
        if (revealed) return;
        setSelected(i);
    };

    const handleReveal = () => {
        setRevealed(true);
    };

    return (
        <div className="dm-prelims-card">
            <div className="dm-q-text">
                <span className="dm-q-num prelims">{idx}</span>
                <span>{q.question}</span>
            </div>
            <ul className="dm-options">
                {q.options.map((opt, i) => {
                    let cls = 'dm-option';
                    if (revealed) {
                        if (i === correctIdx) cls += ' correct';
                        else if (i === selected && i !== correctIdx) cls += ' wrong';
                    } else if (i === selected) {
                        cls += ' selected';
                    }
                    return (
                        <li key={i} className={cls} onClick={() => handleSelect(i)}>
                            {opt}
                        </li>
                    );
                })}
            </ul>
            {!revealed ? (
                <button className="dm-reveal-btn" onClick={handleReveal}
                    disabled={selected === null}>
                    <Eye size={12} /> {selected !== null ? 'Check Answer' : 'Select an option first'}
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}>
                    <div className="dm-explanation">
                        <strong>
                            {selected === correctIdx
                                ? <><CheckCircle2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Correct!</>
                                : <><XCircle size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Incorrect — Answer: {q.answer}</>
                            }
                        </strong>
                        {q.explanation}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════
// CSAT COMPREHENSION CARD
// ═════════════════════════════════════════════════════════════════════════

function CsatComprehensionCard({ comp, passageIdx }: { comp: CsatComprehension; passageIdx: number }) {
    const [showPassage, setShowPassage] = useState(true);

    return (
        <div className="dm-csat-passage-card">
            <div className="dm-csat-passage-header">
                <span className="dm-csat-passage-label">
                    <FileText size={14} /> Passage {passageIdx}
                </span>
                {comp.source && (
                    <span className="dm-csat-source">{comp.source}</span>
                )}
                <button className="dm-approach-toggle" onClick={() => setShowPassage(!showPassage)}
                    style={{ marginLeft: 'auto' }}>
                    {showPassage ? <><EyeOff size={12} /> Hide Passage</> : <><Eye size={12} /> Show Passage</>}
                </button>
            </div>

            <AnimatePresence>
                {showPassage && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}>
                        <div className="dm-csat-passage-text">
                            {comp.passage}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="dm-csat-passage-questions">
                {comp.questions.map((q, i) => (
                    <CsatMCQCard key={i} q={q} idx={i + 1} label={`P${passageIdx}.Q${i + 1}`} />
                ))}
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════
// CSAT MCQ CARD (reused for both comprehension Qs and reasoning Qs)
// ═════════════════════════════════════════════════════════════════════════

function CsatMCQCard({ q, idx, label, category }: {
    q: { question: string; options: string[]; answer: string; explanation: string };
    idx: number;
    label?: string;
    category?: string;
}) {
    const [selected, setSelected] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);

    const correctIdx = q.options.findIndex(o => o === q.answer);

    const handleSelect = (i: number) => {
        if (revealed) return;
        setSelected(i);
    };

    return (
        <div className="dm-csat-mcq">
            <div className="dm-q-text">
                <span className="dm-q-num csat">{label || idx}</span>
                <span>{q.question}</span>
            </div>
            {category && (
                <span className="dm-csat-category">{category}</span>
            )}
            <ul className="dm-options">
                {q.options.map((opt, i) => {
                    let cls = 'dm-option';
                    if (revealed) {
                        if (i === correctIdx) cls += ' correct';
                        else if (i === selected && i !== correctIdx) cls += ' wrong';
                    } else if (i === selected) {
                        cls += ' selected';
                    }
                    return (
                        <li key={i} className={cls} onClick={() => handleSelect(i)}>
                            {opt}
                        </li>
                    );
                })}
            </ul>
            {!revealed ? (
                <button className="dm-reveal-btn" onClick={() => setRevealed(true)}
                    disabled={selected === null}>
                    <Eye size={12} /> {selected !== null ? 'Check Answer' : 'Select an option first'}
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}>
                    <div className="dm-explanation">
                        <strong>
                            {selected === correctIdx
                                ? <><CheckCircle2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Correct!</>
                                : <><XCircle size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Incorrect — Answer: {q.answer}</>
                            }
                        </strong>
                        {q.explanation}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════
// MAINS QUESTION CARD
// ═════════════════════════════════════════════════════════════════════════

function MainsCard({ q, idx }: { q: MainsMock; idx: number }) {
    const [showApproach, setShowApproach] = useState(false);

    // Truncate syllabus for display
    const syllabusShort = q.syllabusMatch.length > 150
        ? q.syllabusMatch.substring(0, q.syllabusMatch.lastIndexOf(' ', 150)) + '…'
        : q.syllabusMatch;

    return (
        <div className="dm-mains-card">
            <div className="dm-q-text">
                <span className="dm-q-num mains">{idx}</span>
                <span>{q.question}</span>
            </div>
            <div className="dm-syllabus">
                Syllabus: {syllabusShort}
            </div>
            <button className="dm-approach-toggle" onClick={() => setShowApproach(!showApproach)}>
                {showApproach ? <><EyeOff size={12} /> Hide Approach</> : <><Eye size={12} /> Show Approach</>}
            </button>
            <AnimatePresence>
                {showApproach && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}>
                        <div className="dm-approach">
                            <strong>Suggested Approach</strong>
                            {q.approach}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════
// PAGE
// ═════════════════════════════════════════════════════════════════════════

export default function DailyMockPage() {
    const searchParams = useSearchParams();
    const urlDate = searchParams.get('date') || '';
    const [data, setData] = useState<MockData | null>(null);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState<'all' | 'prelims' | 'csat' | 'mains'>('all');
    const [selectedDate, setSelectedDate] = useState<string>(urlDate);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(`/api/daily-mock?limit=600&_t=${Date.now()}`, { cache: 'no-store' });
            if (!r.ok) throw new Error('Failed to load');
            const d: MockData = await r.json();
            setData(d);
            // Default to URL date or latest (today's) date
            if (!selectedDate && d.availableDates.length > 0) {
                setSelectedDate(urlDate || d.availableDates[0]);
            }
        } catch (err) {
            console.error('Failed to load mock data:', err);
        } finally {
            setLoading(false);
        }
    }, [urlDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Filter days based on selected date and type
    const filteredDays = useMemo(() => {
        if (!data) return [];
        if (!selectedDate) return data.days.slice(0, 1); // Show latest if no date chosen
        return data.days.filter(d => d.date === selectedDate);
    }, [data, selectedDate]);

    // Stats
    const stats = useMemo(() => {
        if (!data) return { days: 0, prelims: 0, mains: 0, csat: 0 };
        return {
            days: data.totalDays,
            prelims: data.totalPrelims,
            mains: data.totalMains,
            csat: data.totalCsat || 0,
        };
    }, [data]);

    // ════════════════════════════════ RENDER ════════════════════════════

    return (
        <div className="dm-page">
            {/* ── MASTHEAD ─────────────────────────────────────────── */}
            <header className="dm-masthead">
                <div className="dm-mast-inner">
                    <div className="dm-topbar">
                        <div className="dm-topbar-left">
                            <span className="dm-live-dot" />
                            <span>Daily Practice</span>
                            <span suppressHydrationWarning>
                                {new Date().toLocaleDateString('en-IN', {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                })}
                            </span>
                        </div>
                        <div className="dm-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Calendar size={10} /> {stats.days} days available
                            </span>
                            <Link href="/daily-mock/archive"
                                style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--dm-prelims, #3b82f6)', fontWeight: 600, fontSize: 11 }}>
                                <Archive size={10} /> Archive
                            </Link>
                        </div>
                    </div>

                    <div className="dm-title-row">
                        <h1 className="dm-title">Daily Mock <em>Practice</em></h1>
                        <p className="dm-tagline">Prelims MCQs · CSAT Paper II · Mains Questions · UPSC CSE</p>
                    </div>

                    <div className="dm-stats">
                        <span>📝 <b>{stats.prelims}</b> Prelims Qs</span>
                        <span className="sep" />
                        <span>🧩 <b>{stats.csat}</b> CSAT Qs</span>
                        <span className="sep" />
                        <span>✍️ <b>{stats.mains}</b> Mains Qs</span>
                        <span className="sep" />
                        <span>📅 <b>{stats.days}</b> Days</span>
                    </div>
                </div>
            </header>

            {/* ── TOOLBAR ──────────────────────────────────────────── */}
            <div className="dm-toolbar">
                <div className="dm-toolbar-inner">
                    <div className="dm-type-tabs">
                        {(['all', 'prelims', 'csat', 'mains'] as const).map(t => (
                            <button
                                key={t}
                                className={`dm-type-tab ${typeFilter === t ? 'active' : ''}`}
                                onClick={() => setTypeFilter(t)}>
                                {t === 'all' ? '📋 All' : t === 'prelims' ? '📝 Prelims' : t === 'csat' ? '🧩 CSAT' : '✍️ Mains'}
                            </button>
                        ))}
                    </div>
                    <select
                        className="dm-date-select"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}>
                        {(() => {
                            const groups: Record<string, string[]> = {};
                            for (const d of (data?.availableDates || [])) {
                                const ym = d.slice(0, 7);
                                if (!groups[ym]) groups[ym] = [];
                                groups[ym].push(d);
                            }
                            return Object.entries(groups).map(([ym, dates]) => (
                                <optgroup key={ym} label={new Date(dates[0] + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}>
                                    {dates.map(d => (
                                        <option key={d} value={d}>
                                            {new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
                                                weekday: 'short', day: 'numeric', month: 'short',
                                            })}
                                        </option>
                                    ))}
                                </optgroup>
                            ));
                        })()}
                    </select>
                </div>
            </div>

            {/* ── CONTENT ──────────────────────────────────────────── */}
            <div className="dm-content">
                {loading ? (
                    <div className="dm-loading">
                        <Loader2 size={28} className="animate-spin" style={{ marginBottom: 8 }} />
                        Loading mock questions…
                    </div>
                ) : !data || filteredDays.length === 0 ? (
                    <div className="dm-loading">
                        <BookOpen size={36} style={{ marginBottom: 8, opacity: 0.4 }} />
                        No mock questions found for the selected filter.
                    </div>
                ) : (
                    <div className="dm-layout">
                        <div>
                            {filteredDays.map(day => (
                                <DateSection
                                    key={day.date}
                                    day={day}
                                    typeFilter={typeFilter}
                                />
                            ))}
                        </div>

                        {/* Sidebar */}
                        <aside className="dm-sidebar">
                            {/* Summary Stats */}
                            <div className="dm-side-box">
                                <div className="dm-side-head"><BarChart3 size={12} /> Practice Summary</div>
                                <div className="dm-side-body">
                                    <div className="dm-stat-row">
                                        <span>Prelims Qs</span>
                                        <span className="dm-stat-val">{stats.prelims}</span>
                                    </div>
                                    <div className="dm-stat-row">
                                        <span>CSAT Qs</span>
                                        <span className="dm-stat-val">{stats.csat}</span>
                                    </div>
                                    <div className="dm-stat-row">
                                        <span>Mains Qs</span>
                                        <span className="dm-stat-val">{stats.mains}</span>
                                    </div>
                                    <div className="dm-stat-row">
                                        <span>Days Available</span>
                                        <span className="dm-stat-val">{stats.days}</span>
                                    </div>
                                    <div className="dm-stat-row">
                                        <span>Total Questions</span>
                                        <span className="dm-stat-val">
                                            {stats.prelims + stats.csat + stats.mains}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Date Navigator — Grouped by Month */}
                            <DateNavigator
                                days={data?.days || []}
                                availableDates={data?.availableDates || []}
                                selectedDate={selectedDate}
                                onSelectDate={setSelectedDate}
                            />

                            {/* Quick Tips */}
                            <div className="dm-side-box">
                                <div className="dm-side-head"><Target size={12} /> Quick Tips</div>
                                <div className="dm-side-body" style={{ font: '400 12px/1.6 var(--dm-body)', color: 'var(--dm-ink-2)' }}>
                                    <p style={{ margin: '0 0 8px' }}>
                                        <strong>Prelims:</strong> Select your answer first, then click &quot;Check Answer&quot; to verify. Review explanations for all options.
                                    </p>
                                    <p style={{ margin: '0 0 8px' }}>
                                        <strong>CSAT:</strong> Read the passage carefully before answering. Focus on what the author implies, not just states. For reasoning, draw diagrams if needed.
                                    </p>
                                    <p style={{ margin: '0 0 8px' }}>
                                        <strong>Mains:</strong> Draft your answer mentally before viewing the suggested approach. Focus on structure and keywords.
                                    </p>
                                    <p style={{ margin: 0 }}>
                                        <strong>Daily habit:</strong> Practice consistently. These questions are generated from the day&apos;s current affairs.
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════
// DATE NAVIGATOR (collapsible month accordion)
// ═════════════════════════════════════════════════════════════════════════

function DateNavigator({ days, availableDates, selectedDate, onSelectDate }: {
    days: MockDay[];
    availableDates: string[];
    selectedDate: string;
    onSelectDate: (d: string) => void;
}) {
    // Group dates by YYYY-MM
    const monthGroups = useMemo(() => {
        const groups: Record<string, { label: string; dates: string[] }> = {};
        for (const d of availableDates) {
            const ym = d.slice(0, 7);
            if (!groups[ym]) {
                const dt = new Date(d + 'T00:00:00');
                groups[ym] = {
                    label: dt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
                    dates: [],
                };
            }
            groups[ym].dates.push(d);
        }
        return groups;
    }, [availableDates]);

    // Which month is currently open — default to the selected date's month
    const selectedMonth = selectedDate ? selectedDate.slice(0, 7) : '';
    const [expandedMonth, setExpandedMonth] = useState<string>(selectedMonth);

    // Auto-expand when selected date changes
    useEffect(() => {
        if (selectedDate) {
            setExpandedMonth(selectedDate.slice(0, 7));
        }
    }, [selectedDate]);

    const toggleMonth = (ym: string) => {
        setExpandedMonth(prev => prev === ym ? '' : ym);
    };

    return (
        <div className="dm-side-box">
            <div className="dm-side-head"><Calendar size={12} /> Date Navigator</div>
            <div className="dm-side-body" style={{ padding: 0 }}>
                {Object.entries(monthGroups).map(([ym, group]) => {
                    const isOpen = expandedMonth === ym;
                    const monthDays = group.dates.map(d => days.find(dy => dy.date === d)).filter(Boolean) as MockDay[];
                    const totalP = monthDays.reduce((s, d) => s + (d.prelimsMocks?.length || 0), 0);
                    const totalM = monthDays.reduce((s, d) => s + (d.mainsMocks?.length || 0), 0);
                    const totalC = monthDays.reduce((s, d) => {
                        const comp = (d.csatMocks?.comprehension || []).reduce((cs: number, c: any) => cs + (c.questions?.length || 0), 0);
                        return s + comp + (d.csatMocks?.reasoning || []).length;
                    }, 0);

                    return (
                        <div key={ym}>
                            {/* Month Header — clickable */}
                            <div
                                onClick={() => toggleMonth(ym)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '8px 12px', cursor: 'pointer',
                                    background: isOpen ? 'rgba(59,130,246,0.06)' : 'transparent',
                                    borderBottom: '1px solid var(--dm-border, rgba(0,0,0,0.06))',
                                    transition: 'background 0.15s',
                                }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {isOpen
                                        ? <ChevronDown size={11} style={{ color: 'var(--dm-prelims)' }} />
                                        : <ChevronUp size={11} style={{ color: 'var(--dm-ink-2)', transform: 'rotate(180deg)' }} />
                                    }
                                    <span style={{
                                        fontWeight: 700, fontSize: 11,
                                        color: isOpen ? 'var(--dm-prelims)' : 'var(--dm-ink)',
                                        fontFamily: 'var(--dm-head)',
                                    }}>
                                        {group.label}
                                    </span>
                                    <span style={{
                                        fontSize: 9, color: 'var(--dm-ink-2)',
                                        background: 'rgba(0,0,0,0.04)', borderRadius: 8,
                                        padding: '1px 6px',
                                    }}>
                                        {group.dates.length}d
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 3 }}>
                                    {totalP > 0 && <span className="dm-date-badge prelims" style={{ fontSize: 8 }}>{totalP}P</span>}
                                    {totalC > 0 && <span className="dm-date-badge csat" style={{ fontSize: 8 }}>{totalC}C</span>}
                                    {totalM > 0 && <span className="dm-date-badge mains" style={{ fontSize: 8 }}>{totalM}M</span>}
                                </div>
                            </div>

                            {/* Dates — only shown when expanded */}
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ overflow: 'hidden' }}>
                                        <div style={{
                                            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
                                            gap: 3, padding: '8px 10px',
                                        }}>
                                            {group.dates.map(d => {
                                                const dayNum = parseInt(d.split('-')[2]);
                                                const isSelected = d === selectedDate;
                                                const dayData = days.find(dy => dy.date === d);
                                                const hasCsat = dayData && ((dayData.csatMocks?.comprehension || []).length > 0 || (dayData.csatMocks?.reasoning || []).length > 0);

                                                return (
                                                    <div
                                                        key={d}
                                                        onClick={() => onSelectDate(d)}
                                                        title={new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
                                                            weekday: 'short', day: 'numeric', month: 'short'
                                                        })}
                                                        style={{
                                                            width: 36, height: 36,
                                                            display: 'flex', flexDirection: 'column',
                                                            alignItems: 'center', justifyContent: 'center',
                                                            borderRadius: 8, cursor: 'pointer',
                                                            fontSize: 12, fontWeight: isSelected ? 800 : 600,
                                                            fontFamily: 'var(--dm-head)',
                                                            background: isSelected
                                                                ? 'var(--dm-prelims, #3b82f6)'
                                                                : 'rgba(0,0,0,0.03)',
                                                            color: isSelected ? '#fff' : 'var(--dm-ink)',
                                                            transition: 'all 0.15s',
                                                            border: isSelected ? 'none' : '1px solid rgba(0,0,0,0.04)',
                                                            position: 'relative',
                                                        }}>
                                                        {dayNum}
                                                        {/* Tiny dots for P/C/M */}
                                                        <div style={{
                                                            display: 'flex', gap: 2, marginTop: 1,
                                                        }}>
                                                            {dayData?.prelimsMocks && dayData.prelimsMocks.length > 0 && (
                                                                <span style={{
                                                                    width: 4, height: 4, borderRadius: '50%',
                                                                    background: isSelected ? 'rgba(255,255,255,0.7)' : '#3b82f6',
                                                                }} />
                                                            )}
                                                            {hasCsat && (
                                                                <span style={{
                                                                    width: 4, height: 4, borderRadius: '50%',
                                                                    background: isSelected ? 'rgba(255,255,255,0.7)' : '#a855f7',
                                                                }} />
                                                            )}
                                                            {dayData?.mainsMocks && dayData.mainsMocks.length > 0 && (
                                                                <span style={{
                                                                    width: 4, height: 4, borderRadius: '50%',
                                                                    background: isSelected ? 'rgba(255,255,255,0.7)' : '#22c55e',
                                                                }} />
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════
// DATE SECTION
// ═════════════════════════════════════════════════════════════════════════

function DateSection({ day, typeFilter }: { day: MockDay; typeFilter: 'all' | 'prelims' | 'csat' | 'mains' }) {
    const showPrelims = typeFilter === 'all' || typeFilter === 'prelims';
    const showCsat = typeFilter === 'all' || typeFilter === 'csat';
    const showMains = typeFilter === 'all' || typeFilter === 'mains';

    const csatComp = day.csatMocks?.comprehension || [];
    const csatReason = day.csatMocks?.reasoning || [];
    const hasCsat = csatComp.length > 0 || csatReason.length > 0;
    const csatTotal = csatComp.reduce((s, c) => s + (c.questions?.length || 0), 0) + csatReason.length;

    return (
        <div className="dm-date-section">
            <div className="dm-date-header">
                <span className="dm-date-label">{day.dateFormatted}</span>
                <span className="dm-date-count">
                    {day.prelimsMocks.length > 0 && (
                        <span className="dm-date-badge prelims" style={{ marginRight: 6 }}>
                            📝 {day.prelimsMocks.length} Prelims
                        </span>
                    )}
                    {hasCsat && (
                        <span className="dm-date-badge csat" style={{ marginRight: 6 }}>
                            🧩 {csatTotal} CSAT
                        </span>
                    )}
                    {day.mainsMocks.length > 0 && (
                        <span className="dm-date-badge mains">
                            ✍️ {day.mainsMocks.length} Mains
                        </span>
                    )}
                </span>
            </div>

            {/* Prelims Section */}
            {showPrelims && day.prelimsMocks.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <div className="dm-section-title prelims">
                        <BookOpen size={14} /> Prelims — Multiple Choice Questions
                    </div>
                    {day.prelimsMocks.map((q, i) => (
                        <PrelimsCard key={`${day.date}-p-${i}`} q={q} idx={i + 1} />
                    ))}
                </div>
            )}

            {/* CSAT Section */}
            {showCsat && hasCsat && (
                <div style={{ marginBottom: 24 }}>
                    <div className="dm-section-title csat">
                        <Brain size={14} /> CSAT Paper II — Aptitude &amp; Comprehension
                    </div>

                    {/* Comprehension Passages */}
                    {csatComp.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <div className="dm-csat-subsection-title">
                                <FileText size={12} /> Comprehension
                            </div>
                            {csatComp.map((comp, i) => (
                                <CsatComprehensionCard
                                    key={`${day.date}-comp-${i}`}
                                    comp={comp}
                                    passageIdx={i + 1}
                                />
                            ))}
                        </div>
                    )}

                    {/* Reasoning Questions */}
                    {csatReason.length > 0 && (
                        <div>
                            <div className="dm-csat-subsection-title">
                                <Zap size={12} /> Logical Reasoning &amp; Quantitative Aptitude
                            </div>
                            {csatReason.map((q, i) => (
                                <CsatMCQCard
                                    key={`${day.date}-r-${i}`}
                                    q={q}
                                    idx={i + 1}
                                    label={`R${i + 1}`}
                                    category={q.category}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Mains Section */}
            {showMains && day.mainsMocks.length > 0 && (
                <div>
                    <div className="dm-section-title mains">
                        <PenTool size={14} /> Mains — Descriptive Questions
                    </div>
                    {day.mainsMocks.map((q, i) => (
                        <MainsCard key={`${day.date}-m-${i}`} q={q} idx={i + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}
