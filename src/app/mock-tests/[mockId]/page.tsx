'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ChevronLeft, ChevronRight, CheckCircle2, XCircle,
    RotateCcw, Trophy, Clock, Brain, Lightbulb,
    Loader2, Home, BookOpen, ArrowLeft, Play, Pause
} from 'lucide-react';

type Question = {
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    explanation: string;
    difficulty: string;
    sub_topic: string;
    id: string;
};

type MockData = {
    mock_id: string;
    title: string;
    subject: string;
    total_questions: number;
    duration_minutes: number;
    marks_per_correct: number;
    negative_marks: number;
    questions: Question[];
};

type ExamState = 'loading' | 'instructions' | 'exam' | 'results' | 'review';

export default function MockTestExam({ params }: { params: { mockId: string } }) {
    const [mockData, setMockData] = useState<MockData | null>(null);
    const [examState, setExamState] = useState<ExamState>('loading');
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
    const [timeLeft, setTimeLeft] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    // Load mock data
    useEffect(() => {
        fetch(`/api/mock-tests?mock=${params.mockId}`)
            .then(r => r.json())
            .then(d => {
                setMockData(d);
                setTimeLeft((d.duration_minutes || 120) * 60);
                setExamState('instructions');
            })
            .catch(() => setExamState('loading'));
    }, [params.mockId]);

    // Timer
    useEffect(() => {
        if (!timerRunning || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { setTimerRunning(false); setExamState('results'); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timerRunning, timeLeft]);

    const startExam = () => {
        setExamState('exam');
        setTimerRunning(true);
    };

    const selectAnswer = (qIndex: number, option: string) => {
        setAnswers(prev => ({ ...prev, [qIndex]: option }));
    };

    const submitExam = () => {
        setTimerRunning(false);
        setExamState('results');
    };

    const formatTime = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (examState === 'loading' || !mockData) {
        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
            </div>
        );
    }

    const questions = mockData.questions || [];
    const score = questions.reduce((acc, q, i) =>
        answers[i]?.toUpperCase() === q.correct_answer?.toUpperCase() ? acc + (mockData.marks_per_correct || 2) : acc, 0);
    const wrong = questions.reduce((acc, q, i) =>
        answers[i] && answers[i]?.toUpperCase() !== q.correct_answer?.toUpperCase() ? acc + 1 : acc, 0);
    const negativeMarks = wrong * (mockData.negative_marks || 0.67);
    const totalMarks = score - negativeMarks;
    const attempted = Object.keys(answers).length;
    const correctCount = questions.reduce((acc, q, i) =>
        answers[i]?.toUpperCase() === q.correct_answer?.toUpperCase() ? acc + 1 : acc, 0);
    const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    // ═══════════════════════════════════════════════
    // INSTRUCTIONS
    // ═══════════════════════════════════════════════
    if (examState === 'instructions') {
        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
                <section className="section-padding">
                    <div className="max-w-2xl mx-auto">
                        <Link href="/mock-tests" className="flex items-center gap-2 text-sm mb-6 hover:text-accent-500 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}>
                            <ArrowLeft className="w-4 h-4" /> Back to Mock Tests
                        </Link>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-8">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-xl">
                                    <Brain className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="font-heading text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                    {mockData.title}
                                </h1>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                    UPSC CSE Prelims Practice
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {[
                                    { label: 'Questions', value: mockData.total_questions || questions.length },
                                    { label: 'Duration', value: `${mockData.duration_minutes || 120} min` },
                                    { label: 'Marks/Correct', value: `+${mockData.marks_per_correct || 2}` },
                                    { label: 'Negative Marking', value: `-${mockData.negative_marks || 0.67}` },
                                ].map(item => (
                                    <div key={item.label} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-secondary)' }}>
                                        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</div>
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 rounded-xl mb-6" style={{ background: 'var(--bg-secondary)' }}>
                                <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Instructions:</h3>
                                <ul className="text-xs space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                                    <li>• Each question has 4 options. Only one is correct.</li>
                                    <li>• You can navigate between questions freely.</li>
                                    <li>• Questions can be marked for review and revisited.</li>
                                    <li>• Negative marking applies for wrong answers.</li>
                                    <li>• Timer starts once you click &quot;Start Exam&quot;.</li>
                                    <li>• The exam auto-submits when time runs out.</li>
                                </ul>
                            </div>

                            <button onClick={startExam}
                                className="btn-primary w-full flex items-center justify-center gap-2 text-lg !py-4">
                                <Play className="w-5 h-5" /> Start Exam
                            </button>
                        </motion.div>
                    </div>
                </section>
            </div>
        );
    }

    // ═══════════════════════════════════════════════
    // EXAM
    // ═══════════════════════════════════════════════
    if (examState === 'exam') {
        const q = questions[currentQ];
        if (!q) return null;

        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
                {/* Top Bar */}
                <div className="sticky top-16 z-40 border-b backdrop-blur-xl" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
                        <h2 className="font-heading font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {mockData.title}
                        </h2>
                        <div className="flex items-center gap-4">
                            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                                {attempted}/{questions.length} answered
                            </span>
                            <span className={`font-mono font-bold text-sm px-3 py-1 rounded-lg ${timeLeft < 300 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-primary-500/10 text-primary-600 dark:text-primary-400'}`}>
                                <Clock className="w-3.5 h-3.5 inline mr-1" />
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Question Panel */}
                    <div className="lg:col-span-3">
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 text-white font-bold text-sm flex items-center justify-center">
                                    {currentQ + 1}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-600' :
                                    q.difficulty === 'hard' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                    {q.difficulty}
                                </span>
                            </div>

                            <p className="text-base leading-relaxed mb-6 whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
                                {q.question}
                            </p>

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
                                <button onClick={() => {
                                    const newMarked = new Set(markedForReview);
                                    if (newMarked.has(currentQ)) newMarked.delete(currentQ);
                                    else newMarked.add(currentQ);
                                    setMarkedForReview(newMarked);
                                }}
                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${markedForReview.has(currentQ)
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                                        : 'border-gray-300 dark:border-gray-600 text-gray-500'}`}>
                                    {markedForReview.has(currentQ) ? '⭐ Marked' : 'Mark for Review'}
                                </button>
                                {currentQ < questions.length - 1 ? (
                                    <button onClick={() => setCurrentQ(p => p + 1)}
                                        className="flex items-center gap-1 text-sm btn-primary !px-4 !py-2">
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button onClick={submitExam}
                                        className="flex items-center gap-1 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:from-emerald-400 transition-all shadow-lg">
                                        <Trophy className="w-4 h-4" /> Submit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Question Palette */}
                    <div className="hidden lg:block">
                        <div className="glass-card p-4 sticky top-36">
                            <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Questions</h3>
                            <div className="grid grid-cols-5 gap-1.5 mb-4">
                                {questions.map((_, i) => (
                                    <button key={i} onClick={() => setCurrentQ(i)}
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
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500/20" /> Answered</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-500/20" /> Marked</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800" /> Not Attempted</div>
                            </div>
                            <button onClick={submitExam}
                                className="mt-4 w-full text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 rounded-lg font-medium hover:from-emerald-400 transition-all">
                                Submit Exam
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════
    // RESULTS
    // ═══════════════════════════════════════════════
    if (examState === 'results') {
        const grade = percentage >= 70 ? 'Excellent' : percentage >= 50 ? 'Good' : percentage >= 35 ? 'Average' : 'Needs Work';
        const emoji = percentage >= 70 ? '🏆' : percentage >= 50 ? '👍' : percentage >= 35 ? '📝' : '💪';

        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
                <section className="section-padding">
                    <div className="max-w-3xl mx-auto">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-8 text-center mb-6">
                            <div className="text-5xl mb-3">{emoji}</div>
                            <h1 className="font-heading text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                {grade}!
                            </h1>
                            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{mockData.title}</p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                {[
                                    { label: 'Score', value: `${totalMarks.toFixed(1)}/${questions.length * (mockData.marks_per_correct || 2)}` },
                                    { label: 'Correct', value: `${correctCount}/${questions.length}` },
                                    { label: 'Accuracy', value: `${percentage}%` },
                                    { label: 'Attempted', value: `${attempted}/${questions.length}` },
                                ].map(s => (
                                    <div key={s.label} className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                                        <div className="text-xl font-bold font-heading" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
                                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-center gap-3">
                                <Link href="/mock-tests" className="btn-outline flex items-center gap-2 text-sm">
                                    <Home className="w-4 h-4" /> All Tests
                                </Link>
                                <button onClick={() => { setExamState('review'); setCurrentQ(0); }}
                                    className="btn-primary flex items-center gap-2 text-sm">
                                    <BookOpen className="w-4 h-4" /> Review Answers
                                </button>
                            </div>
                        </motion.div>

                        {/* Question Summary Grid */}
                        <div className="glass-card p-6">
                            <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Question Summary</h3>
                            <div className="grid grid-cols-10 gap-1.5">
                                {questions.map((q, i) => {
                                    const ans = answers[i];
                                    const correct = ans?.toUpperCase() === q.correct_answer?.toUpperCase();
                                    return (
                                        <button key={i} onClick={() => { setExamState('review'); setCurrentQ(i); }}
                                            className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center ${!ans ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' :
                                                correct ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' :
                                                    'bg-red-500/20 text-red-600 border border-red-500/30'}`}>
                                            {i + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    // ═══════════════════════════════════════════════
    // REVIEW
    // ═══════════════════════════════════════════════
    if (examState === 'review') {
        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
                <div className="sticky top-16 z-40 border-b backdrop-blur-xl" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)' }}>
                    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                        <button onClick={() => setExamState('results')} className="text-sm flex items-center gap-1 hover:text-accent-500"
                            style={{ color: 'var(--text-secondary)' }}>
                            <ChevronLeft className="w-4 h-4" /> Results
                        </button>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Review: Q{currentQ + 1}/{questions.length}
                        </span>
                        <Link href="/mock-tests" className="btn-outline text-xs !px-3 !py-1.5">All Tests</Link>
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
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{q.sub_topic}</span>
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
