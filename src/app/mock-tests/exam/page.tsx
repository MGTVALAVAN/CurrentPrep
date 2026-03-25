'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, ChevronRight, CheckCircle2, XCircle,
    Trophy, Clock, Brain, Lightbulb, Loader2, Home,
    BookOpen, ArrowLeft, Play, AlertTriangle, BarChart3,
    Target, Award, Flag, PieChart, TrendingUp
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────

type Question = {
    id: string;
    uid: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    explanation: string;
    difficulty: string;
    subject: string;
    sub_topic: string;
};

type TestData = {
    success: boolean;
    testType: 'custom' | 'full_length';
    questions: Question[];
    metadata: {
        totalQuestions: number;
        durationMinutes: number;
        durationSeconds: number;
        marksPerCorrect: number;
        negativeMarks: number;
        subjectDistribution: Record<string, number>;
        difficultyDistribution: Record<string, number>;
        repeatCount: number;
        repeatPercentage: number;
        generatedAt: string;
    };
};

type ExamState = 'loading' | 'exam' | 'confirm_submit' | 'results' | 'review';

const SUBJECT_LABELS: Record<string, string> = {
    art_culture: 'Art & Culture',
    current_affairs: 'Current Affairs',
    economics: 'Economy',
    environment: 'Environment',
    geography: 'Geography',
    history: 'History',
    polity: 'Polity',
    science: 'Science & Tech',
    society: 'Society',
};

const SUBJECT_COLORS: Record<string, string> = {
    art_culture: '#ec4899',
    current_affairs: '#ef4444',
    economics: '#f59e0b',
    environment: '#10b981',
    geography: '#14b8a6',
    history: '#f97316',
    polity: '#3b82f6',
    science: '#06b6d4',
    society: '#8b5cf6',
};

// ─── Component ─────────────────────────────────────────────────────────

export default function MockExamPage() {
    const router = useRouter();
    const [testData, setTestData] = useState<TestData | null>(null);
    const [examState, setExamState] = useState<ExamState>('loading');
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
    const [timeLeft, setTimeLeft] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [startTime, setStartTime] = useState<number>(0);
    const [showPalette, setShowPalette] = useState(false); // mobile palette toggle

    // ── Load Test Data ─────────────────────────────────────────────────

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('currentMockTest');
            if (!raw) {
                router.push('/mock-tests');
                return;
            }
            const data: TestData = JSON.parse(raw);
            if (!data.success || !data.questions?.length) {
                router.push('/mock-tests');
                return;
            }
            setTestData(data);
            setTimeLeft(data.metadata.durationSeconds);
            setExamState('exam');
            setTimerRunning(true);
            setStartTime(Date.now());
        } catch {
            router.push('/mock-tests');
        }
    }, [router]);

    // ── Timer ──────────────────────────────────────────────────────────

    useEffect(() => {
        if (!timerRunning || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setTimerRunning(false);
                    setExamState('results');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timerRunning, timeLeft]);

    // ── Actions ────────────────────────────────────────────────────────

    const selectAnswer = (qIndex: number, option: string) => {
        setAnswers(prev => ({ ...prev, [qIndex]: option }));
    };

    const clearAnswer = (qIndex: number) => {
        setAnswers(prev => {
            const updated = { ...prev };
            delete updated[qIndex];
            return updated;
        });
    };

    const toggleMark = (qIndex: number) => {
        setMarkedForReview(prev => {
            const updated = new Set(prev);
            if (updated.has(qIndex)) updated.delete(qIndex);
            else updated.add(qIndex);
            return updated;
        });
    };

    const submitExam = () => {
        setTimerRunning(false);
        saveHistory();
        setExamState('results');
    };

    // ── Save History ───────────────────────────────────────────────────

    const saveHistory = useCallback(() => {
        if (!testData) return;
        try {
            const raw = localStorage.getItem('mockHistory');
            const history = raw ? JSON.parse(raw) : { seenQuestionIds: [], attempts: [] };

            // Add all question UIDs to seen
            const newIds = testData.questions.map(q => q.uid);
            const allSeen = new Set([...history.seenQuestionIds, ...newIds]);
            history.seenQuestionIds = Array.from(allSeen);

            // Add attempt record
            const questions = testData.questions;
            const correctCount = questions.reduce((acc, q, i) =>
                answers[i]?.toUpperCase() === q.correct_answer?.toUpperCase() ? acc + 1 : acc, 0);

            history.attempts.push({
                date: new Date().toISOString(),
                type: testData.testType,
                score: correctCount,
                total: questions.length,
                questionIds: newIds,
                timeTaken: testData.metadata.durationSeconds - timeLeft,
            });

            // Keep only last 100 attempts
            if (history.attempts.length > 100) {
                history.attempts = history.attempts.slice(-100);
            }

            localStorage.setItem('mockHistory', JSON.stringify(history));
        } catch { /* ignore */ }
    }, [testData, answers, timeLeft]);

    // ── Format Time ────────────────────────────────────────────────────

    const formatTime = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // ── Loading ────────────────────────────────────────────────────────

    if (examState === 'loading' || !testData) {
        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-accent-500 animate-spin mx-auto mb-3" />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading your exam…</p>
                </div>
            </div>
        );
    }

    const questions = testData.questions;
    const attempted = Object.keys(answers).length;
    const correctCount = questions.reduce((acc, q, i) =>
        answers[i]?.toUpperCase() === q.correct_answer?.toUpperCase() ? acc + 1 : acc, 0);
    const wrongCount = questions.reduce((acc, q, i) =>
        answers[i] && answers[i]?.toUpperCase() !== q.correct_answer?.toUpperCase() ? acc + 1 : acc, 0);
    const score = correctCount * testData.metadata.marksPerCorrect;
    const negativeMarks = wrongCount * testData.metadata.negativeMarks;
    const totalMarks = score - negativeMarks;
    const maxMarks = questions.length * testData.metadata.marksPerCorrect;
    const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const timeTaken = testData.metadata.durationSeconds - timeLeft;

    // ═══════════════════════════════════════════════════════════════════
    // EXAM INTERFACE
    // ═══════════════════════════════════════════════════════════════════
    if (examState === 'exam' || examState === 'confirm_submit') {
        const q = questions[currentQ];
        if (!q) return null;

        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
                {/* Top Bar */}
                <div className="sticky top-0 z-40 border-b backdrop-blur-xl"
                    style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
                        <h2 className="font-heading font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {testData.testType === 'full_length' ? 'UPSC Prelims Full Length Mock' : 'Customised Mock Test'}
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                                {attempted}/{questions.length} answered
                            </span>
                            <button onClick={() => setShowPalette(!showPalette)}
                                className="lg:hidden text-xs px-2 py-1 rounded-lg border"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                                Q{currentQ + 1}
                            </button>
                            <span className={`font-mono font-bold text-sm px-3 py-1.5 rounded-lg ${timeLeft < 300
                                ? 'bg-red-500/10 text-red-500 animate-pulse'
                                : 'bg-primary-500/10 text-primary-600 dark:text-primary-400'}`}>
                                <Clock className="w-3.5 h-3.5 inline mr-1" />
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-4 gap-5">
                    {/* Question Panel */}
                    <div className="lg:col-span-3">
                        <div className="glass-card p-6">
                            {/* Question Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 text-white font-bold text-sm flex items-center justify-center">
                                    {currentQ + 1}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-600' :
                                    q.difficulty === 'hard' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                    {q.difficulty}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-600">
                                    {SUBJECT_LABELS[q.subject] || q.subject}
                                </span>
                            </div>

                            {/* Question Text */}
                            <p className="text-base leading-relaxed mb-6 whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
                                {q.question}
                            </p>

                            {/* Options */}
                            <div className="space-y-3">
                                {[
                                    { key: 'A', text: q.option_a },
                                    { key: 'B', text: q.option_b },
                                    { key: 'C', text: q.option_c },
                                    { key: 'D', text: q.option_d },
                                ].map(opt => {
                                    const isSelected = answers[currentQ]?.toUpperCase() === opt.key;
                                    return (
                                        <button key={opt.key} onClick={() => selectAnswer(currentQ, opt.key)}
                                            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${isSelected
                                                ? 'border-accent-500 bg-accent-500/5 shadow-md'
                                                : 'hover:border-gray-300 dark:hover:border-gray-600'}`}
                                            style={!isSelected ? { background: 'var(--bg-card)', borderColor: 'var(--border-color)' } : undefined}>
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSelected
                                                ? 'bg-accent-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                                                {opt.key}
                                            </span>
                                            <span className="text-sm pt-1.5" style={{ color: 'var(--text-primary)' }}>{opt.text}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <button onClick={() => setCurrentQ(p => Math.max(0, p - 1))} disabled={currentQ === 0}
                                    className="flex items-center gap-1 text-sm px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-all"
                                    style={{ color: 'var(--text-secondary)' }}>
                                    <ChevronLeft className="w-4 h-4" /> Previous
                                </button>

                                <div className="flex items-center gap-2">
                                    {answers[currentQ] && (
                                        <button onClick={() => clearAnswer(currentQ)}
                                            className="text-xs px-3 py-1.5 rounded-lg border text-red-500 border-red-500/30 hover:bg-red-500/5 transition-all">
                                            Clear
                                        </button>
                                    )}
                                    <button onClick={() => toggleMark(currentQ)}
                                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${markedForReview.has(currentQ)
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                                            : 'border-gray-300 dark:border-gray-600 text-gray-500'}`}>
                                        <Flag className="w-3 h-3 inline mr-1" />
                                        {markedForReview.has(currentQ) ? 'Marked' : 'Mark for Review'}
                                    </button>
                                </div>

                                {currentQ < questions.length - 1 ? (
                                    <button onClick={() => setCurrentQ(p => p + 1)}
                                        className="flex items-center gap-1 text-sm btn-primary !px-4 !py-2">
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button onClick={() => setExamState('confirm_submit')}
                                        className="flex items-center gap-1 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:from-emerald-400 transition-all shadow-lg">
                                        <Trophy className="w-4 h-4" /> Submit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Question Palette (Desktop always visible, mobile toggle) */}
                    <div className={`${showPalette ? 'fixed inset-0 z-50 bg-black/50 flex items-end lg:items-start lg:relative lg:bg-transparent' : 'hidden lg:block'}`}
                        onClick={() => setShowPalette(false)}>
                        <div className={`${showPalette ? 'w-full max-h-[60vh] rounded-t-2xl lg:rounded-2xl lg:max-h-none' : ''} glass-card p-4 lg:sticky lg:top-14`}
                            onClick={e => e.stopPropagation()}
                            style={showPalette ? { background: 'var(--bg-card)' } : undefined}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Questions</h3>
                                {showPalette && (
                                    <button onClick={() => setShowPalette(false)} className="text-xs text-accent-500 lg:hidden">Close</button>
                                )}
                            </div>
                            <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-1.5 mb-4 max-h-[30vh] lg:max-h-none overflow-y-auto">
                                {questions.map((_, i) => (
                                    <button key={i} onClick={() => { setCurrentQ(i); setShowPalette(false); }}
                                        className={`w-full aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all ${currentQ === i ? 'ring-2 ring-accent-500' : ''
                                            } ${answers[i]
                                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                : markedForReview.has(i)
                                                    ? 'bg-amber-500/20 text-amber-600'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500/20" /> Answered ({attempted})</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-500/20" /> Marked ({markedForReview.size})</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800" /> Not Attempted ({questions.length - attempted})</div>
                            </div>
                            <button onClick={() => setExamState('confirm_submit')}
                                className="mt-4 w-full text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2.5 rounded-lg font-medium hover:from-emerald-400 transition-all">
                                Submit Exam
                            </button>
                        </div>
                    </div>
                </div>

                {/* Confirm Submit Modal */}
                <AnimatePresence>
                    {examState === 'confirm_submit' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setExamState('exam')} />
                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                                className="relative glass-card p-6 max-w-sm w-full text-center shadow-2xl">
                                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                                <h3 className="font-heading font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Submit Exam?</h3>
                                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                    You have answered <strong>{attempted}</strong> out of <strong>{questions.length}</strong> questions.
                                    {questions.length - attempted > 0 && (
                                        <span className="block mt-1 text-amber-600">
                                            {questions.length - attempted} questions are unattempted.
                                        </span>
                                    )}
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setExamState('exam')}
                                        className="flex-1 btn-outline text-sm">
                                        Continue Exam
                                    </button>
                                    <button onClick={submitExam}
                                        className="flex-1 btn-primary text-sm">
                                        Submit Now
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // RESULTS & ANALYSIS
    // ═══════════════════════════════════════════════════════════════════
    if (examState === 'results') {
        const grade = percentage >= 70 ? 'Excellent' : percentage >= 50 ? 'Good' : percentage >= 35 ? 'Average' : 'Needs Improvement';
        const emoji = percentage >= 70 ? '🏆' : percentage >= 50 ? '👍' : percentage >= 35 ? '📝' : '💪';
        const gradeColor = percentage >= 70 ? 'text-emerald-500' : percentage >= 50 ? 'text-blue-500' : percentage >= 35 ? 'text-amber-500' : 'text-red-500';

        // Subject-wise analysis
        const subjectAnalysis: Record<string, { total: number; correct: number; wrong: number; skipped: number }> = {};
        questions.forEach((q, i) => {
            if (!subjectAnalysis[q.subject]) {
                subjectAnalysis[q.subject] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
            }
            subjectAnalysis[q.subject].total++;
            if (!answers[i]) subjectAnalysis[q.subject].skipped++;
            else if (answers[i]?.toUpperCase() === q.correct_answer?.toUpperCase()) subjectAnalysis[q.subject].correct++;
            else subjectAnalysis[q.subject].wrong++;
        });

        // Difficulty-wise analysis
        const diffAnalysis: Record<string, { total: number; correct: number }> = {};
        questions.forEach((q, i) => {
            const d = q.difficulty || 'medium';
            if (!diffAnalysis[d]) diffAnalysis[d] = { total: 0, correct: 0 };
            diffAnalysis[d].total++;
            if (answers[i]?.toUpperCase() === q.correct_answer?.toUpperCase()) diffAnalysis[d].correct++;
        });

        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
                <section className="section-padding">
                    <div className="max-w-4xl mx-auto">
                        {/* Score Card */}
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-8 text-center mb-6">
                            <div className="text-5xl mb-3">{emoji}</div>
                            <h1 className={`font-heading text-2xl font-bold mb-1 ${gradeColor}`}>
                                {grade}!
                            </h1>
                            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                                {testData.testType === 'full_length' ? 'UPSC Full Length Mock Test' : 'Customised Mock Test'}
                            </p>

                            {/* Score Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                                {[
                                    { label: 'Score', value: `${totalMarks.toFixed(1)}/${maxMarks}`, color: 'text-primary-600' },
                                    { label: 'Correct', value: `${correctCount}`, color: 'text-emerald-600' },
                                    { label: 'Wrong', value: `${wrongCount}`, color: 'text-red-600' },
                                    { label: 'Skipped', value: `${questions.length - attempted}`, color: 'text-gray-500' },
                                    { label: 'Accuracy', value: `${percentage}%`, color: gradeColor },
                                ].map(s => (
                                    <div key={s.label} className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                                        <div className={`text-xl font-bold font-heading ${s.color}`}>{s.value}</div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Marks Breakdown */}
                            <div className="text-xs grid grid-cols-3 gap-2 mb-6" style={{ color: 'var(--text-secondary)' }}>
                                <div className="p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                                    <span className="text-emerald-600 font-bold">+{score.toFixed(1)}</span> marks gained
                                </div>
                                <div className="p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                                    <span className="text-red-600 font-bold">-{negativeMarks.toFixed(1)}</span> negative
                                </div>
                                <div className="p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                        {Math.floor(timeTaken / 60)}m {timeTaken % 60}s
                                    </span> time taken
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-center gap-3">
                                <Link href="/mock-tests" className="btn-outline flex items-center gap-2 text-sm">
                                    <ArrowLeft className="w-4 h-4" /> Mock Tests
                                </Link>
                                <button onClick={() => { setExamState('review'); setCurrentQ(0); }}
                                    className="btn-primary flex items-center gap-2 text-sm">
                                    <BookOpen className="w-4 h-4" /> Review Answers
                                </button>
                            </div>
                        </motion.div>

                        {/* Analysis Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Subject-wise Analysis */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="glass-card p-6">
                                <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2"
                                    style={{ color: 'var(--text-primary)' }}>
                                    <PieChart className="w-4 h-4 text-accent-500" /> Subject-wise Analysis
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(subjectAnalysis)
                                        .sort((a, b) => b[1].total - a[1].total)
                                        .map(([subject, data]) => {
                                            const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                                            return (
                                                <div key={subject}>
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span style={{ color: 'var(--text-secondary)' }}>
                                                            {SUBJECT_LABELS[subject] || subject}
                                                        </span>
                                                        <span style={{ color: 'var(--text-muted)' }}>
                                                            {data.correct}/{data.total} ({pct}%)
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-0.5 h-2">
                                                        <div className="rounded-l-full bg-emerald-500"
                                                            style={{ width: `${data.total > 0 ? (data.correct / data.total) * 100 : 0}%` }} />
                                                        <div className="bg-red-500"
                                                            style={{ width: `${data.total > 0 ? (data.wrong / data.total) * 100 : 0}%` }} />
                                                        <div className="rounded-r-full bg-gray-300 dark:bg-gray-700"
                                                            style={{ width: `${data.total > 0 ? (data.skipped / data.total) * 100 : 0}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                                <div className="flex gap-4 mt-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Correct</div>
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Wrong</div>
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700" /> Skipped</div>
                                </div>
                            </motion.div>

                            {/* Difficulty-wise Analysis */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                className="glass-card p-6">
                                <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2"
                                    style={{ color: 'var(--text-primary)' }}>
                                    <TrendingUp className="w-4 h-4 text-accent-500" /> Difficulty-wise Analysis
                                </h3>
                                <div className="space-y-4">
                                    {['easy', 'medium', 'hard'].map(diff => {
                                        const data = diffAnalysis[diff] || { total: 0, correct: 0 };
                                        const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                                        const diffColor = diff === 'easy' ? 'text-emerald-500' : diff === 'hard' ? 'text-red-500' : 'text-amber-500';
                                        const barColor = diff === 'easy' ? 'bg-emerald-500' : diff === 'hard' ? 'bg-red-500' : 'bg-amber-500';
                                        return (
                                            <div key={diff}>
                                                <div className="flex items-center justify-between text-xs mb-1.5">
                                                    <span className={`font-semibold capitalize ${diffColor}`}>{diff}</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>{data.correct}/{data.total} ({pct}%)</span>
                                                </div>
                                                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                                                    <div className={`h-full rounded-full ${barColor} transition-all`}
                                                        style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Quick Insights */}
                                <div className="mt-5 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                                    <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>💡 Insights</h4>
                                    <ul className="text-[11px] space-y-1" style={{ color: 'var(--text-secondary)' }}>
                                        {percentage >= 70 && <li>• Outstanding performance! You&apos;re well-prepared.</li>}
                                        {percentage >= 50 && percentage < 70 && <li>• Good attempt. Focus on the weaker subjects to push past 70%.</li>}
                                        {percentage < 50 && <li>• Don&apos;t worry — keep practicing. Focus on easier questions to build confidence.</li>}
                                        {(diffAnalysis['hard']?.total || 0) > 0 && (diffAnalysis['hard']?.correct || 0) / (diffAnalysis['hard']?.total || 1) < 0.3 && (
                                            <li>• Hard questions need more attention. Review NCERT and analytical concepts.</li>
                                        )}
                                        {wrongCount > attempted * 0.5 && <li>• High error rate. Consider skipping uncertain questions to avoid negative marks.</li>}
                                    </ul>
                                </div>
                            </motion.div>
                        </div>

                        {/* Question Summary Grid */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                            className="glass-card p-6 mt-6">
                            <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Question Summary</h3>
                            <div className="grid grid-cols-10 sm:grid-cols-20 gap-1.5">
                                {questions.map((q, i) => {
                                    const ans = answers[i];
                                    const correct = ans?.toUpperCase() === q.correct_answer?.toUpperCase();
                                    return (
                                        <button key={i} onClick={() => { setExamState('review'); setCurrentQ(i); }}
                                            title={`Q${i + 1}: ${SUBJECT_LABELS[q.subject] || q.subject}`}
                                            className={`aspect-square rounded-lg text-[10px] font-bold flex items-center justify-center transition-all hover:scale-110 ${!ans ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' :
                                                correct ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' :
                                                    'bg-red-500/20 text-red-600 border border-red-500/30'}`}>
                                            {i + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                </section>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // REVIEW MODE
    // ═══════════════════════════════════════════════════════════════════
    if (examState === 'review') {
        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
                {/* Review Header */}
                <div className="sticky top-0 z-40 border-b backdrop-blur-xl"
                    style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                        <button onClick={() => setExamState('results')} className="text-sm flex items-center gap-1 hover:text-accent-500"
                            style={{ color: 'var(--text-secondary)' }}>
                            <ChevronLeft className="w-4 h-4" /> Results
                        </button>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Review: {questions.length} Questions
                        </span>
                        <Link href="/mock-tests" className="btn-outline text-xs !px-3 !py-1.5">Mock Tests</Link>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-4 py-6">
                    {questions.map((q, i) => {
                        const userAns = answers[i]?.toUpperCase();
                        const correct = userAns === q.correct_answer?.toUpperCase();
                        return (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} className="glass-card p-6 mb-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center text-white ${!userAns ? 'bg-gray-400' : correct ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                        {i + 1}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-600' :
                                        q.difficulty === 'hard' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                        {q.difficulty}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{SUBJECT_LABELS[q.subject] || q.subject}</span>
                                    {!userAns ? <span className="ml-auto text-xs text-gray-400">Skipped</span> :
                                        correct ? <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" /> :
                                            <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
                                </div>
                                <p className="text-sm mb-3 whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>{q.question}</p>
                                <div className="space-y-1.5 mb-3">
                                    {[
                                        { key: 'A', text: q.option_a },
                                        { key: 'B', text: q.option_b },
                                        { key: 'C', text: q.option_c },
                                        { key: 'D', text: q.option_d },
                                    ].map(opt => (
                                        <div key={opt.key} className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${q.correct_answer?.toUpperCase() === opt.key ? 'bg-emerald-500/10 border border-emerald-500/30' :
                                            userAns === opt.key ? 'bg-red-500/10 border border-red-500/30' : ''}`}
                                            style={q.correct_answer?.toUpperCase() !== opt.key && userAns !== opt.key ? { background: 'var(--bg-secondary)' } : undefined}>
                                            <span className="font-bold">{opt.key}.</span>
                                            <span style={{ color: 'var(--text-primary)' }}>{opt.text}</span>
                                            {q.correct_answer?.toUpperCase() === opt.key && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
                                            {userAns === opt.key && q.correct_answer?.toUpperCase() !== opt.key && <XCircle className="w-3.5 h-3.5 text-red-500 ml-auto" />}
                                        </div>
                                    ))}
                                </div>
                                {q.explanation && (
                                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                            <Lightbulb className="w-3 h-3 text-blue-500 inline mr-1" />
                                            {q.explanation}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
}
