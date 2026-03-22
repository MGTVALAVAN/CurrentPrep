'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Brain, ChevronRight, ChevronLeft, CheckCircle2, XCircle,
    RotateCcw, Trophy, Target, Sparkles, Clock, BookOpen,
    ArrowRight, Lightbulb, Loader2, AlertTriangle, Home,
    Sliders, Zap, BarChart3, FileText, Star, Flag,
    Play, AlertCircle, Send, ChevronDown, ChevronUp
} from 'lucide-react';

/* ─────────── Types ─────────── */
type Question = {
    id: number; uid: string; question: string;
    options: { a: string; b: string; c: string; d: string };
    correct: string; explanation: string; difficulty: string;
    topic: string; topicLabel: string; subtopic: string;
};
type StatsData = {
    totalQuestions: number;
    subjects: Record<string, string>;
    stats: { bySubject: Record<string, number>; byDifficulty: Record<string, number> };
};
type Phase = 'setup' | 'loading' | 'instructions' | 'exam' | 'confirm_submit' | 'results' | 'review';

/* ─────────── Constants ─────────── */
const SUBJ_META: Record<string, { icon: string; gradient: string }> = {
    polity: { icon: '🏛️', gradient: 'from-blue-500 to-indigo-600' },
    history: { icon: '📜', gradient: 'from-amber-500 to-orange-600' },
    geography: { icon: '🌍', gradient: 'from-emerald-500 to-teal-600' },
    economics: { icon: '💰', gradient: 'from-yellow-500 to-amber-600' },
    environment: { icon: '🌿', gradient: 'from-green-500 to-lime-600' },
    science: { icon: '🔬', gradient: 'from-cyan-500 to-blue-600' },
    art_culture: { icon: '🎭', gradient: 'from-pink-500 to-rose-600' },
    society: { icon: '👥', gradient: 'from-purple-500 to-violet-600' },
    current_affairs: { icon: '📰', gradient: 'from-red-500 to-rose-600' },
};

const LS_KEY = 'currentprep_attempted_uids';
function getAttemptedUIDs(): string[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveAttemptedUIDs(uids: string[]) {
    if (typeof window === 'undefined') return;
    // Keep last 5000 UIDs to avoid localStorage bloat
    const trimmed = uids.slice(-5000);
    localStorage.setItem(LS_KEY, JSON.stringify(trimmed));
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function QuizPage() {
    const [phase, setPhase] = useState<Phase>('setup');
    const [stats, setStats] = useState<StatsData | null>(null);

    // Config
    const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
    const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set(['easy', 'medium', 'hard']));
    const [questionCount, setQuestionCount] = useState(25);
    const [useWeightage, setUseWeightage] = useState(false);
    const [weightages, setWeightages] = useState<Record<string, number>>({});
    const [timerEnabled, setTimerEnabled] = useState(true);
    const [timerMinutes, setTimerMinutes] = useState(0);
    const [negativeMarking, setNegativeMarking] = useState(true);
    const [fullLength, setFullLength] = useState(false);

    // Exam state
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
    const [timeLeft, setTimeLeft] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [error, setError] = useState('');
    const [repeatInfo, setRepeatInfo] = useState({ count: 0, percent: 0 });
    const [showPalette, setShowPalette] = useState(true);

    // Load stats
    useEffect(() => {
        fetch('/api/quiz/custom?stats=true').then(r => r.json()).then(setStats).catch(() => {});
    }, []);

    // Timer
    useEffect(() => {
        if (!timerRunning || timeLeft <= 0) return;
        const iv = setInterval(() => {
            setTimeLeft(p => {
                if (p <= 1) { setTimerRunning(false); submitExam(); return 0; }
                return p - 1;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, [timerRunning, timeLeft]);

    /* ── Helpers ── */
    const toggleSubject = (s: string) => {
        if (fullLength) return; // Can't change subjects in full-length mode
        const ns = new Set(selectedSubjects);
        ns.has(s) ? ns.delete(s) : ns.add(s);
        setSelectedSubjects(ns);
        if (useWeightage && ns.size > 0) {
            const eq = Math.floor(100 / ns.size);
            const w: Record<string, number> = {};
            ns.forEach(k => w[k] = eq);
            setWeightages(w);
        }
    };
    const toggleDiff = (d: string) => {
        const ns = new Set(selectedDifficulties);
        ns.has(d) ? ns.delete(d) : ns.add(d);
        if (ns.size > 0) setSelectedDifficulties(ns);
    };
    const selectFullLength = () => {
        setFullLength(true);
        setQuestionCount(100);
        setTimerEnabled(true);
        setTimerMinutes(120);
        setNegativeMarking(true);
        setSelectedSubjects(new Set(Object.keys(SUBJ_META)));
        setSelectedDifficulties(new Set(['easy', 'medium', 'hard']));
        setUseWeightage(false);
    };
    const selectSubjectMode = (subj: string) => {
        setFullLength(false);
        setSelectedSubjects(new Set([subj]));
        setQuestionCount(25);
        setTimerMinutes(0);
    };
    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` : `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const attempted = Object.keys(answers).length;

    /* ── Generate ── */
    const generateQuiz = useCallback(async () => {
        if (selectedSubjects.size === 0 && !fullLength) { setError('Select at least one subject'); return; }
        setError('');
        setPhase('loading');
        try {
            const res = await fetch('/api/quiz/custom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subjects: fullLength ? [] : Array.from(selectedSubjects),
                    difficulty: Array.from(selectedDifficulties),
                    count: questionCount,
                    weightage: useWeightage ? weightages : null,
                    fullLength,
                    attemptedUIDs: getAttemptedUIDs(),
                }),
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            if (!data.questions?.length) throw new Error('No questions available. Try different settings.');
            setQuestions(data.questions);
            setRepeatInfo({ count: data.metadata?.repeatCount || 0, percent: data.metadata?.repeatPercent || 0 });
            setCurrentQ(0);
            setAnswers({});
            setMarkedForReview(new Set());
            setShowPalette(true);
            setPhase('instructions');
        } catch (err: any) {
            setError(err.message);
            setPhase('setup');
        }
    }, [selectedSubjects, selectedDifficulties, questionCount, useWeightage, weightages, fullLength]);

    /* ── Start exam ── */
    const startExam = () => {
        setStartTime(Date.now());
        if (timerEnabled) {
            const mins = timerMinutes > 0 ? timerMinutes : Math.ceil(questions.length * 1.2);
            setTimeLeft(mins * 60);
            setTimerRunning(true);
        }
        setPhase('exam');
    };

    /* ── Submit ── */
    const submitExam = useCallback(() => {
        setTimerRunning(false);
        setEndTime(Date.now());
        // Save attempted UIDs
        const existing = getAttemptedUIDs();
        const newUIDs = questions.map(q => q.uid);
        saveAttemptedUIDs([...existing, ...newUIDs]);
        setPhase('results');
    }, [questions]);

    /* ── Reset ── */
    const resetQuiz = () => {
        setPhase('setup');
        setQuestions([]);
        setAnswers({});
        setMarkedForReview(new Set());
        setCurrentQ(0);
        setTimerRunning(false);
        setFullLength(false);
        setError('');
    };

    /* ── Scoring ── */
    const correctCount = questions.reduce((a, q) => answers[q.id] === q.correct ? a + 1 : a, 0);
    const wrongCount = questions.reduce((a, q) => answers[q.id] && answers[q.id] !== q.correct ? a + 1 : a, 0);
    const unattempted = questions.length - attempted;
    const marks = correctCount * 2 - (negativeMarking ? wrongCount * 0.67 : 0);
    const maxMarks = questions.length * 2;
    const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const timeTaken = endTime && startTime ? Math.round((endTime - startTime) / 1000) : 0;

    // ═════════════════════════════════════════════════════
    // SETUP
    // ═════════════════════════════════════════════════════
    if (phase === 'setup') {
        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
                <section className="hero-bg py-10 lg:py-12">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm text-blue-100 mb-3">
                            <Sparkles className="w-4 h-4 text-accent-400" />
                            <span>{stats?.totalQuestions?.toLocaleString() || '7,229'} Questions • Zero Repeats</span>
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">
                            Custom Mock Builder
                        </motion.h1>
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                            className="text-base text-blue-100/80 max-w-2xl mx-auto">
                            Pick a subject for focused practice, or attempt a Full Length UPSC-style paper
                        </motion.p>
                    </div>
                </section>

                <section className="px-4 sm:px-6 lg:px-8 -mt-3 pb-16">
                    <div className="max-w-5xl mx-auto">

                        {/* ── Subject Cards + Full Length ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="glass-card p-6 mb-5">
                            <h2 className="font-heading font-semibold text-lg flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white text-xs flex items-center justify-center font-bold">1</span>
                                Choose Your Test
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-3">
                                {stats && Object.entries(stats.subjects).map(([key, label]) => {
                                    const meta = SUBJ_META[key] || { icon: '📚', gradient: '' };
                                    const count = stats.stats.bySubject[key] || 0;
                                    const selected = selectedSubjects.has(key) && !fullLength;
                                    return (
                                        <button key={key} onClick={() => selectSubjectMode(key)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${selected
                                                ? 'border-accent-500 shadow-lg shadow-accent-500/15 scale-[1.02]'
                                                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                                            style={{ background: selected ? 'var(--bg-card)' : 'var(--bg-secondary)' }}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg">{meta.icon}</span>
                                                {selected && <CheckCircle2 className="w-3.5 h-3.5 text-accent-500 ml-auto" />}
                                            </div>
                                            <span className="text-xs font-medium block leading-tight" style={{ color: 'var(--text-primary)' }}>{label}</span>
                                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{count} Qs</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {/* Full Length Paper */}
                            <button onClick={selectFullLength}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${fullLength
                                    ? 'border-accent-500 shadow-lg shadow-accent-500/15'
                                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                                style={{ background: fullLength ? 'var(--bg-card)' : 'var(--bg-secondary)' }}>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            Full Length Paper — UPSC Prelims Style
                                        </span>
                                        {fullLength && <CheckCircle2 className="w-4 h-4 text-accent-500" />}
                                    </div>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        100 Questions • 120 Minutes • All Subjects • Negative Marking • Realistic Weightage
                                    </span>
                                </div>
                            </button>
                        </motion.div>

                        {/* ── Settings (only for non-full-length) ── */}
                        {!fullLength && selectedSubjects.size > 0 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-6 mb-5">
                                <h2 className="font-heading font-semibold text-lg flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white text-xs flex items-center justify-center font-bold">2</span>
                                    Test Settings
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {/* Question Count */}
                                    <div>
                                        <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>Questions</label>
                                        <div className="flex gap-2">
                                            {[10, 25, 50, 100].map(n => (
                                                <button key={n} onClick={() => setQuestionCount(n)}
                                                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${questionCount === n ? 'bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-lg' : 'border'}`}
                                                    style={questionCount !== n ? { background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' } : undefined}>
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Difficulty */}
                                    <div>
                                        <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>Difficulty</label>
                                        <div className="flex gap-2">
                                            {Object.entries({ easy: '🟢', medium: '🟡', hard: '🔴' }).map(([k, icon]) => {
                                                const sel = selectedDifficulties.has(k);
                                                return (
                                                    <button key={k} onClick={() => toggleDiff(k)}
                                                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${sel ? 'border-2 border-accent-500' : 'border opacity-50'}`}
                                                        style={{ background: 'var(--bg-secondary)', borderColor: sel ? undefined : 'var(--border-color)', color: 'var(--text-primary)' }}>
                                                        {icon} {k.charAt(0).toUpperCase() + k.slice(1)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {/* Toggle row */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                            <Clock className="w-3.5 h-3.5" /> Timer
                                        </span>
                                        <button onClick={() => setTimerEnabled(!timerEnabled)}
                                            className={`w-10 h-5 rounded-full transition-all ${timerEnabled ? 'bg-accent-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${timerEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                            <Target className="w-3.5 h-3.5" /> Negative Marking (−0.67)
                                        </span>
                                        <button onClick={() => setNegativeMarking(!negativeMarking)}
                                            className={`w-10 h-5 rounded-full transition-all ${negativeMarking ? 'bg-accent-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${negativeMarking ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {error && (
                            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        {/* Generate */}
                        {(selectedSubjects.size > 0 || fullLength) && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                    {fullLength ? '🎯 Full Length: 100 Qs • 120 min • All Subjects' :
                                        `${selectedSubjects.size} subject${selectedSubjects.size > 1 ? 's' : ''} • ${questionCount} Qs`}
                                </span>
                                <button onClick={generateQuiz} className="btn-primary text-base flex items-center gap-3 !px-8 !py-3.5">
                                    <Zap className="w-5 h-5" /> Generate Test <ArrowRight className="w-5 h-5" />
                                </button>
                            </motion.div>
                        )}
                    </div>
                </section>
            </div>
        );
    }

    // ═════════════════════════════════════════════════════
    // LOADING
    // ═════════════════════════════════════════════════════
    if (phase === 'loading') {
        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen flex items-center justify-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center px-4">
                    <div className="relative w-20 h-20 mx-auto mb-5">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-500 to-primary-600 animate-pulse" />
                        <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                            <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
                        </div>
                    </div>
                    <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Building your test...</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                        Selecting {fullLength ? '100' : questionCount} questions with minimal repeats
                    </p>
                </motion.div>
            </div>
        );
    }

    // ═════════════════════════════════════════════════════
    // INSTRUCTIONS
    // ═════════════════════════════════════════════════════
    if (phase === 'instructions') {
        const duration = timerEnabled ? (timerMinutes > 0 ? timerMinutes : Math.ceil(questions.length * 1.2)) : 0;
        const subjectDistribution: Record<string, number> = {};
        questions.forEach(q => { subjectDistribution[q.topicLabel] = (subjectDistribution[q.topicLabel] || 0) + 1; });

        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
                <section className="section-padding">
                    <div className="max-w-2xl mx-auto">
                        <button onClick={resetQuiz} className="flex items-center gap-1 text-sm mb-5 hover:text-accent-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-xl">
                                    {fullLength ? <FileText className="w-8 h-8 text-white" /> : <Brain className="w-8 h-8 text-white" />}
                                </div>
                                <h1 className="font-heading text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                    {fullLength ? 'UPSC Prelims — Full Length Paper' : `${Array.from(selectedSubjects).map(s => stats?.subjects[s] || s).join(', ')}`}
                                </h1>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Custom Mock Test</p>
                            </div>

                            {/* Key Info */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                                {[
                                    { label: 'Questions', value: questions.length },
                                    { label: 'Duration', value: duration > 0 ? `${duration} min` : 'Untimed' },
                                    { label: '+Correct', value: '+2' },
                                    { label: '−Wrong', value: negativeMarking ? '−0.67' : '0' },
                                ].map(i => (
                                    <div key={i.label} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-secondary)' }}>
                                        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{i.value}</div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{i.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Subject distribution */}
                            <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--bg-secondary)' }}>
                                <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Subject Distribution</h3>
                                {Object.entries(subjectDistribution).sort((a, b) => b[1] - a[1]).map(([subj, cnt]) => (
                                    <div key={subj} className="flex items-center justify-between mb-1">
                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{subj}</span>
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{cnt} Qs</span>
                                    </div>
                                ))}
                            </div>

                            {repeatInfo.percent > 0 && (
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-400 mb-5 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {repeatInfo.count} questions ({repeatInfo.percent}%) you&apos;ve seen before. Max allowed: 20%.
                                </div>
                            )}

                            {/* Instructions */}
                            <div className="p-4 rounded-xl mb-6" style={{ background: 'var(--bg-secondary)' }}>
                                <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Instructions</h3>
                                <ul className="text-xs space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                                    <li>• Each question has 4 options. Select the best answer.</li>
                                    <li>• Navigate freely between questions using the sidebar palette.</li>
                                    <li>• Mark questions for review (⭐) and revisit them later.</li>
                                    <li>• {negativeMarking ? 'Wrong answers attract −0.67 negative marks.' : 'No negative marking for this test.'}</li>
                                    <li>• {timerEnabled ? `Timer starts when you click "Start Test". Auto-submits at ${duration} min.` : 'This test is untimed.'}</li>
                                    <li>• Answers are NOT shown until you submit the entire test.</li>
                                </ul>
                            </div>

                            <button onClick={startExam} className="btn-primary w-full flex items-center justify-center gap-2 text-lg !py-4">
                                <Play className="w-5 h-5" /> Start Test
                            </button>
                        </motion.div>
                    </div>
                </section>
            </div>
        );
    }

    // ═════════════════════════════════════════════════════
    // CONFIRM SUBMIT
    // ═════════════════════════════════════════════════════
    if (phase === 'confirm_submit') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-8 max-w-md mx-4 text-center">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="font-heading text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Submit Test?</h2>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                        You&apos;ve answered <strong>{attempted}</strong> of <strong>{questions.length}</strong> questions.
                        {unattempted > 0 && <span className="text-amber-500"> {unattempted} questions are unanswered.</span>}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => setPhase('exam')} className="btn-outline text-sm">
                            <ChevronLeft className="w-4 h-4 inline mr-1" /> Go Back
                        </button>
                        <button onClick={submitExam} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition-all">
                            <Send className="w-4 h-4 inline mr-1" /> Submit
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ═════════════════════════════════════════════════════
    // EXAM
    // ═════════════════════════════════════════════════════
    if (phase === 'exam' && questions.length > 0) {
        const q = questions[currentQ];

        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
                {/* Top Bar */}
                <div className="sticky top-16 z-40 border-b backdrop-blur-xl" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
                        <h2 className="font-heading font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {fullLength ? 'UPSC Prelims — Full Length' : Array.from(selectedSubjects).map(s => stats?.subjects[s] || s).join(', ')}
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                                {attempted}/{questions.length} answered
                            </span>
                            {timerEnabled && (
                                <span className={`font-mono font-bold text-sm px-2.5 py-1 rounded-lg ${timeLeft < 300 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-primary-500/10 text-primary-600 dark:text-primary-400'}`}>
                                    <Clock className="w-3.5 h-3.5 inline mr-1" />{formatTime(timeLeft)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 py-6 flex gap-5">
                    {/* Question Panel */}
                    <div className="flex-1 min-w-0">
                        <div className="glass-card p-6">
                            {/* Badges */}
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 text-white font-bold text-sm flex items-center justify-center">{currentQ + 1}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-600' : q.difficulty === 'hard' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>{q.difficulty}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">{q.topicLabel}</span>
                            </div>

                            {/* Question */}
                            <p className="text-sm sm:text-base leading-relaxed mb-6 whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>{q.question}</p>

                            {/* Options — no feedback */}
                            <div className="space-y-2.5">
                                {(['a', 'b', 'c', 'd'] as const).map(key => {
                                    const isSelected = answers[q.id] === key;
                                    return (
                                        <button key={key} onClick={() => setAnswers(p => ({ ...p, [q.id]: key }))}
                                            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${isSelected ? 'border-accent-500 bg-accent-500/5 shadow-md' : 'hover:border-gray-300 dark:hover:border-gray-600'}`}
                                            style={!isSelected ? { background: 'var(--bg-card)', borderColor: 'var(--border-color)' } : undefined}>
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSelected ? 'bg-accent-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>{key.toUpperCase()}</span>
                                            <span className="text-sm pt-1.5" style={{ color: 'var(--text-primary)' }}>{q.options[key]}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <button onClick={() => { if (currentQ > 0) setCurrentQ(p => p - 1); }} disabled={currentQ === 0}
                                    className="flex items-center gap-1 text-sm px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-all" style={{ color: 'var(--text-secondary)' }}>
                                    <ChevronLeft className="w-4 h-4" /> Previous
                                </button>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => {
                                        const ns = new Set(markedForReview);
                                        ns.has(currentQ) ? ns.delete(currentQ) : ns.add(currentQ);
                                        setMarkedForReview(ns);
                                    }}
                                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${markedForReview.has(currentQ)
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                                            : 'border-gray-300 dark:border-gray-600 text-gray-500'}`}>
                                        {markedForReview.has(currentQ) ? '⭐ Marked' : 'Mark ⭐'}
                                    </button>
                                    {answers[q.id] && (
                                        <button onClick={() => { const na = { ...answers }; delete na[q.id]; setAnswers(na); }}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 hover:text-red-500 transition-all">
                                            Clear
                                        </button>
                                    )}
                                </div>
                                {currentQ < questions.length - 1 ? (
                                    <button onClick={() => setCurrentQ(p => p + 1)}
                                        className="flex items-center gap-1 text-sm btn-primary !px-4 !py-2">
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button onClick={() => setPhase('confirm_submit')}
                                        className="flex items-center gap-1 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all">
                                        <Send className="w-4 h-4" /> Submit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar — Question Palette */}
                    <div className="hidden lg:block w-56 flex-shrink-0">
                        <div className="glass-card p-4 sticky top-36">
                            <h3 className="font-semibold text-xs mb-3" style={{ color: 'var(--text-primary)' }}>Questions</h3>
                            <div className="grid grid-cols-5 gap-1.5 mb-4">
                                {questions.map((_, i) => {
                                    const isCurrent = currentQ === i;
                                    const isAnswered = !!answers[questions[i].id];
                                    const isMarked = markedForReview.has(i);
                                    return (
                                        <button key={i} onClick={() => setCurrentQ(i)}
                                            className={`w-full aspect-square rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${isCurrent ? 'ring-2 ring-accent-500' : ''
                                                } ${isAnswered
                                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                    : isMarked
                                                        ? 'bg-amber-500/20 text-amber-600'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                            {i + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="space-y-1.5 text-[9px] mb-4" style={{ color: 'var(--text-muted)' }}>
                                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/20" /> Answered ({attempted})</div>
                                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/20" /> Marked ({markedForReview.size})</div>
                                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800" /> Unanswered ({unattempted})</div>
                            </div>
                            <button onClick={() => setPhase('confirm_submit')}
                                className="w-full text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all">
                                Submit Test
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═════════════════════════════════════════════════════
    // RESULTS ANALYSIS
    // ═════════════════════════════════════════════════════
    if (phase === 'results') {
        const grade = percentage >= 75 ? 'Excellent' : percentage >= 55 ? 'Good' : percentage >= 35 ? 'Average' : 'Needs Work';
        const emoji = percentage >= 75 ? '🏆' : percentage >= 55 ? '👍' : percentage >= 35 ? '📝' : '💪';

        // Subject-wise
        const subjBreak: Record<string, { correct: number; wrong: number; skip: number; total: number }> = {};
        questions.forEach(q => {
            if (!subjBreak[q.topicLabel]) subjBreak[q.topicLabel] = { correct: 0, wrong: 0, skip: 0, total: 0 };
            subjBreak[q.topicLabel].total++;
            if (!answers[q.id]) subjBreak[q.topicLabel].skip++;
            else if (answers[q.id] === q.correct) subjBreak[q.topicLabel].correct++;
            else subjBreak[q.topicLabel].wrong++;
        });

        // Difficulty-wise
        const diffBreak: Record<string, { correct: number; total: number }> = {};
        questions.forEach(q => {
            const d = q.difficulty;
            if (!diffBreak[d]) diffBreak[d] = { correct: 0, total: 0 };
            diffBreak[d].total++;
            if (answers[q.id] === q.correct) diffBreak[d].correct++;
        });

        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
                <section className="section-padding">
                    <div className="max-w-3xl mx-auto">

                        {/* Score Card */}
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center mb-6">
                            <div className="text-5xl mb-2">{emoji}</div>
                            <h1 className="font-heading text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{grade}!</h1>
                            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                                {fullLength ? 'UPSC Prelims — Full Length Paper' : Array.from(selectedSubjects).map(s => stats?.subjects[s] || s).join(', ')}
                            </p>

                            {/* Score ring */}
                            <div className="relative w-28 h-28 mx-auto mb-5">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-color)" strokeWidth="8" />
                                    <motion.circle cx="60" cy="60" r="52" fill="none"
                                        stroke={percentage >= 60 ? '#10B981' : percentage >= 40 ? '#F59E0B' : '#EF4444'}
                                        strokeWidth="8" strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 52}`}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - percentage / 100) }}
                                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold gradient-text">{percentage}%</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                                {[
                                    { label: 'Score', value: `${marks.toFixed(1)}/${maxMarks}` },
                                    { label: 'Correct', value: correctCount, color: 'text-emerald-500' },
                                    { label: 'Wrong', value: wrongCount, color: 'text-red-500' },
                                    { label: 'Skipped', value: unattempted, color: 'text-gray-400' },
                                    { label: 'Time', value: formatTime(timeTaken) },
                                ].map(s => (
                                    <div key={s.label} className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                                        <div className={`text-lg font-bold font-heading ${(s as any).color || ''}`} style={!(s as any).color ? { color: 'var(--text-primary)' } : undefined}>{s.value}</div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Subject Performance */}
                            <div className="text-left mb-6">
                                <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                    <BarChart3 className="w-3.5 h-3.5" /> Subject-wise Performance
                                </h3>
                                {Object.entries(subjBreak).sort((a, b) => b[1].total - a[1].total).map(([subj, d]) => {
                                    const pct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
                                    return (
                                        <div key={subj} className="mb-2.5">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{subj}</span>
                                                <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                                    {d.correct}✓ {d.wrong}✗ {d.skip > 0 ? `${d.skip}○` : ''} ({pct}%)
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'var(--border-color)' }}>
                                                <div className="h-full bg-emerald-500" style={{ width: `${(d.correct / d.total) * 100}%` }} />
                                                <div className="h-full bg-red-500" style={{ width: `${(d.wrong / d.total) * 100}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Difficulty Performance */}
                            <div className="text-left mb-6">
                                <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Difficulty-wise Accuracy</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(diffBreak).map(([diff, d]) => {
                                        const pct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
                                        return (
                                            <div key={diff} className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
                                                <div className="text-xs font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{diff}</div>
                                                <div className={`text-lg font-bold ${pct >= 60 ? 'text-emerald-500' : pct >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{pct}%</div>
                                                <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{d.correct}/{d.total}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Question Grid */}
                            <div className="text-left mb-6">
                                <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Question Summary</h3>
                                <div className="grid grid-cols-10 gap-1.5">
                                    {questions.map((q, i) => {
                                        const ans = answers[q.id];
                                        const correct = ans === q.correct;
                                        return (
                                            <button key={i} onClick={() => { setPhase('review'); setCurrentQ(i); }}
                                                className={`aspect-square rounded-lg text-[10px] font-bold flex items-center justify-center ${!ans ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' :
                                                    correct ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' :
                                                        'bg-red-500/20 text-red-600 border border-red-500/30'}`}>
                                                {i + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-3">
                                <button onClick={resetQuiz} className="btn-outline flex items-center gap-2 text-sm">
                                    <RotateCcw className="w-4 h-4" /> New Test
                                </button>
                                <button onClick={() => { setPhase('review'); setCurrentQ(0); }} className="btn-primary flex items-center gap-2 text-sm">
                                    <BookOpen className="w-4 h-4" /> Review Answers
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </div>
        );
    }

    // ═════════════════════════════════════════════════════
    // REVIEW
    // ═════════════════════════════════════════════════════
    if (phase === 'review') {
        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
                <div className="sticky top-16 z-40 border-b backdrop-blur-xl" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                        <button onClick={() => setPhase('results')} className="text-sm flex items-center gap-1 hover:text-accent-500" style={{ color: 'var(--text-secondary)' }}>
                            <ChevronLeft className="w-4 h-4" /> Results
                        </button>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Review All Answers</span>
                        <button onClick={resetQuiz} className="btn-outline text-xs !px-3 !py-1.5"><RotateCcw className="w-3 h-3 inline mr-1" /> New</button>
                    </div>
                </div>
                <div className="max-w-3xl mx-auto px-4 py-6">
                    {questions.map((q, i) => {
                        const userAns = answers[q.id];
                        const isCorrect = userAns === q.correct;
                        return (
                            <motion.div key={q.uid} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="glass-card p-5 mb-4">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center text-white ${!userAns ? 'bg-gray-400' : isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>{i + 1}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">{q.topicLabel}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-600' : q.difficulty === 'hard' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>{q.difficulty}</span>
                                    {!userAns ? <span className="text-[10px] text-gray-400 ml-auto">Skipped</span> :
                                        isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" /> :
                                            <XCircle className="w-3.5 h-3.5 text-red-500 ml-auto" />}
                                </div>
                                <p className="text-xs mb-3 whitespace-pre-line leading-relaxed" style={{ color: 'var(--text-primary)' }}>{q.question}</p>
                                <div className="space-y-1 mb-3">
                                    {(['a', 'b', 'c', 'd'] as const).map(key => (
                                        <div key={key} className={`px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-2 ${q.correct === key ? 'bg-emerald-500/10 border border-emerald-500/30' : userAns === key ? 'bg-red-500/10 border border-red-500/30' : ''}`}
                                            style={q.correct !== key && userAns !== key ? { background: 'var(--bg-secondary)' } : undefined}>
                                            <span className="font-bold">{key.toUpperCase()}.</span>
                                            <span style={{ color: 'var(--text-primary)' }}>{q.options[key]}</span>
                                            {q.correct === key && <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-auto flex-shrink-0" />}
                                        </div>
                                    ))}
                                </div>
                                {q.explanation && (
                                    <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                            <Lightbulb className="w-3 h-3 text-blue-500 inline mr-1" />{q.explanation}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                    <div className="text-center mt-6">
                        <button onClick={resetQuiz} className="btn-primary flex items-center gap-2 mx-auto">
                            <RotateCcw className="w-4 h-4" /> Take Another Test
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
