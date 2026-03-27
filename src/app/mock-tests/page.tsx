'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Brain, BookOpen,
    Play, Crown, X, Check,
    Loader2, Zap, GraduationCap, FileText,
    AlertTriangle, Timer, Award
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────

type TestMode = 'custom' | 'full_length' | null;
type Paper = 'gs' | 'csat';

const GS_SUBJECTS = [
    { id: 'art_culture', label: 'Art & Culture', icon: '🎭', color: 'from-pink-500 to-rose-600' },
    { id: 'current_affairs', label: 'Current Affairs', icon: '📰', color: 'from-red-500 to-rose-600' },
    { id: 'economics', label: 'Indian Economy', icon: '💰', color: 'from-yellow-500 to-amber-600' },
    { id: 'environment', label: 'Environment & Ecology', icon: '🌿', color: 'from-green-500 to-emerald-600' },
    { id: 'geography', label: 'Geography', icon: '🌍', color: 'from-emerald-500 to-teal-600' },
    { id: 'history', label: 'Indian History', icon: '📜', color: 'from-amber-500 to-orange-600' },
    { id: 'polity', label: 'Indian Polity', icon: '🏛️', color: 'from-blue-500 to-indigo-600' },
    { id: 'science', label: 'Science & Technology', icon: '🔬', color: 'from-cyan-500 to-blue-600' },
    { id: 'society', label: 'Society & Social Issues', icon: '👥', color: 'from-purple-500 to-violet-600' },
];

const CSAT_SUBJECTS = [
    { id: 'maths', label: 'Maths / Numeracy', icon: '🔢', color: 'from-amber-500 to-orange-600' },
    { id: 'comprehension', label: 'Comprehension', icon: '📖', color: 'from-blue-500 to-indigo-600' },
    { id: 'reasoning', label: 'Logical Reasoning', icon: '🧩', color: 'from-purple-500 to-violet-600' },
];

const GS_QUESTION_COUNTS = [
    { value: 10, timer: '12 min', label: '10 Questions' },
    { value: 25, timer: '30 min', label: '25 Questions' },
    { value: 50, timer: '60 min', label: '50 Questions' },
    { value: 100, timer: '120 min', label: '100 Questions' },
];

const CSAT_QUESTION_COUNTS = [
    { value: 10, timer: '15 min', label: '10 Questions' },
    { value: 20, timer: '30 min', label: '20 Questions' },
    { value: 40, timer: '60 min', label: '40 Questions' },
    { value: 80, timer: '120 min', label: '80 Questions' },
];

const DIFFICULTIES = [
    { id: 'mixed', label: 'Mixed', desc: 'Balanced mix of all levels', color: 'text-blue-500' },
    { id: 'easy', label: 'Easy', desc: 'NCERT-level factual', color: 'text-emerald-500' },
    { id: 'medium', label: 'Medium', desc: 'Application & analysis', color: 'text-amber-500' },
    { id: 'hard', label: 'Hard', desc: 'Analytical & tricky', color: 'text-red-500' },
];

// ─── Page Component ────────────────────────────────────────────────────

export default function MockTestsPage() {
    const router = useRouter();

    const [activeModal, setActiveModal] = useState<TestMode>(null);
    const [paper, setPaper] = useState<Paper>('gs');

    // Custom test config
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [difficulty, setDifficulty] = useState('mixed');
    const [questionCount, setQuestionCount] = useState(25);
    const [generating, setGenerating] = useState(false);

    // Derived from paper selection
    const SUBJECTS = paper === 'csat' ? CSAT_SUBJECTS : GS_SUBJECTS;
    const QUESTION_COUNTS = paper === 'csat' ? CSAT_QUESTION_COUNTS : GS_QUESTION_COUNTS;
    const allSelected = selectedSubjects.length === 0 || selectedSubjects.length === SUBJECTS.length;
    const timerDisplay = QUESTION_COUNTS.find(q => q.value === questionCount)?.timer || '30 min';
    const isCSAT = paper === 'csat';

    // ── Open Test Configuration ─────────────────────────────────────────────
    // Note: Auth & premium gating will be added at a later stage

    function handleTestStart(mode: TestMode) {
        setActiveModal(mode);
    }

    // ── Subject Toggle ─────────────────────────────────────────────────────

    function toggleSubject(subjectId: string) {
        setSelectedSubjects(prev => {
            if (prev.includes(subjectId)) {
                return prev.filter(s => s !== subjectId);
            }
            return [...prev, subjectId];
        });
    }

    function toggleAllSubjects() {
        if (allSelected) {
            setSelectedSubjects([SUBJECTS[0].id]);
        } else {
            setSelectedSubjects([]);
        }
    }

    // ── Generate Test ──────────────────────────────────────────────────────

    const [genStatus, setGenStatus] = useState('');

    async function generateTest(type: 'custom' | 'full_length') {
        setGenerating(true);
        setGenStatus('Generating questions...');
        try {
            // Load seen questions from localStorage
            const history = getHistory();

            const body: any = {
                type,
                paper,
                seenQuestionIds: history.seenQuestionIds,
            };

            if (type === 'custom') {
                body.subjects = allSelected ? [] : selectedSubjects;
                body.difficulty = difficulty;
                body.questionCount = questionCount;
            }

            const res = await fetch('/api/mock-tests/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                throw new Error('Failed to generate test');
            }

            const data = await res.json();

            // Store the generated test in sessionStorage for the exam page
            sessionStorage.setItem('currentMockTest', JSON.stringify(data));

            setGenStatus('Preparing your exam...');
            setActiveModal(null);

            // Navigate — keep generating=true so overlay persists until exam page loads
            router.push('/mock-tests/exam');

        } catch (error) {
            console.error('Error generating test:', error);
            alert('Failed to generate mock test. Please try again.');
            setGenerating(false);
            setGenStatus('');
        }
    }

    // ── History Helper ─────────────────────────────────────────────────────

    function getHistory(): { seenQuestionIds: string[]; attempts: any[] } {
        try {
            const raw = localStorage.getItem('mockHistory');
            if (raw) return JSON.parse(raw);
        } catch { /* ignore */ }
        return { seenQuestionIds: [], attempts: [] };
    }

    // ─── Render ────────────────────────────────────────────────────────────

    return (
        <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
            {/* Full-page loading overlay during test generation/navigation */}
            {generating && !activeModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="text-center glass-card p-8 shadow-2xl">
                        <Loader2 className="w-10 h-10 text-accent-500 animate-spin mx-auto mb-4" />
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {genStatus || 'Preparing your exam...'}
                        </p>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                            This may take a few seconds on first load
                        </p>
                    </div>
                </div>
            )}
            {/* ── Hero ── */}
            <section className="hero-bg py-14 lg:py-20">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm text-blue-100 mb-5">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>Premium Feature • 7,200+ Questions</span>
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
                        UPSC CSE Mock Tests
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="text-lg text-blue-100/80 max-w-2xl mx-auto">
                        Practice with AI-powered mock tests built on expert developed predictive model. Customise your own or take a full-length UPSC-style paper.
                    </motion.p>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section className="px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="max-w-5xl mx-auto glass-card p-5 shadow-xl">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { step: '1', title: 'Choose Mode', desc: 'Custom or Full Length' },
                            { step: '2', title: 'Configure', desc: 'Set subjects, difficulty & count' },
                            { step: '3', title: 'Take Test', desc: 'Timer-based exam interface' },
                            { step: '4', title: 'Review', desc: 'Detailed analysis & explanations' },
                        ].map((item) => (
                            <div key={item.step} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                                    {item.step}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
                                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── Test Mode Cards ── */}
            <section className="section-padding">
                <div className="max-w-5xl mx-auto">
                    {/* Paper Selector Tabs */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {[
                            { id: 'gs' as Paper, label: 'GS Paper I', icon: '📋', desc: 'General Studies' },
                            { id: 'csat' as Paper, label: 'CSAT Paper II', icon: '🧠', desc: 'Aptitude & Reasoning' },
                        ].map(tab => (
                            <button key={tab.id}
                                onClick={() => { setPaper(tab.id); setSelectedSubjects([]); setQuestionCount(tab.id === 'csat' ? 20 : 25); }}
                                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all border-2 ${
                                    paper === tab.id
                                        ? 'border-accent-500 bg-accent-500/10 shadow-md'
                                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                style={paper !== tab.id ? { background: 'var(--bg-card)', color: 'var(--text-secondary)' } : undefined}
                            >
                                <span className="text-lg">{tab.icon}</span>
                                <div className="text-left">
                                    <div className={paper === tab.id ? 'text-accent-600 font-semibold' : ''} style={paper === tab.id ? {} : { color: 'var(--text-primary)' }}>{tab.label}</div>
                                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{tab.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <h2 className="font-heading font-semibold text-xl mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
                        Choose Your Test Mode
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ── Card 1: Customised Mock Test ── */}
                        <motion.button
                            key={`custom-${paper}`}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                            onClick={() => handleTestStart('custom')}
                            className="glass-card p-8 text-left card-hover group relative overflow-hidden"
                        >
                            {/* Gradient accent */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Zap className="w-7 h-7 text-white" />
                                </div>
                                <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-medium border border-amber-500/20">
                                    <Crown className="w-3 h-3" /> Premium
                                </span>
                            </div>

                            <h3 className="font-heading font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                                {isCSAT ? 'Customised CSAT Mock' : 'Customised Mock Test'}
                            </h3>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                {isCSAT
                                    ? 'Pick from comprehension, reasoning, numeracy & more. Choose difficulty and question count.'
                                    : 'Build your own test — pick subjects, difficulty level, and number of questions. Timer adjusts automatically.'}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {(isCSAT
                                    ? ['Topic Mix', 'Difficulty', '10-80 Qs', 'Auto Timer']
                                    : ['Subject Mix', 'Difficulty', '10-100 Qs', 'Auto Timer']
                                ).map(tag => (
                                    <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full border"
                                        style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 text-sm font-medium text-accent-500 group-hover:translate-x-1 transition-transform">
                                <Play className="w-4 h-4" /> Configure & Start
                            </div>
                        </motion.button>

                        {/* ── Card 2: UPSC Full Length Mock ── */}
                        <motion.button
                            key={`full-${paper}`}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                            onClick={() => handleTestStart('full_length')}
                            className="glass-card p-8 text-left card-hover group relative overflow-hidden"
                        >
                            {/* Gradient accent */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <GraduationCap className="w-7 h-7 text-white" />
                                </div>
                                <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-medium border border-amber-500/20">
                                    <Crown className="w-3 h-3" /> Premium
                                </span>
                            </div>

                            <h3 className="font-heading font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                                {isCSAT ? 'UPSC Style Full Length CSAT' : 'UPSC Style Full Length Mock'}
                            </h3>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                {isCSAT
                                    ? '80 questions, 2 hours, real UPSC CSAT distribution. Comprehension passages, reasoning & numeracy. Qualifying paper (33% cutoff).'
                                    : '100 questions, 2 hours, real UPSC subject distribution, negative marking. No repeat from last 3 years\' PYQ.'}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {(isCSAT
                                    ? ['80 Questions', '2 Hours', '+2.5/-0.83', 'Qualifying']
                                    : ['100 Questions', '2 Hours', '+2/-0.67', 'PYQ Excluded']
                                ).map(tag => (
                                    <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full border"
                                        style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 text-sm font-medium text-accent-500 group-hover:translate-x-1 transition-transform">
                                <Play className="w-4 h-4" /> {isCSAT ? 'Start CSAT Mock' : 'Start Full Length Test'}
                            </div>
                        </motion.button>
                    </div>


                </div>
            </section>

            {/* ═════════════════════════════════════════════════════════════════
                MODAL: Customised Mock Test Configuration
               ═════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {activeModal === 'custom' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={() => setActiveModal(null)}>
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                        {/* Dialog */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border"
                            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b backdrop-blur-xl"
                                style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                            Customised Mock Test
                                        </h2>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Configure your test</p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveModal(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                </button>
                            </div>

                            <div className="p-5 space-y-6">
                                {/* ── Subjects ── */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            Select Subjects
                                        </label>
                                        <button onClick={toggleAllSubjects}
                                            className="text-xs text-accent-500 hover:text-accent-400 font-medium transition-colors">
                                            {allSelected ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {SUBJECTS.map(subj => {
                                            const isSelected = allSelected || selectedSubjects.includes(subj.id);
                                            return (
                                                <button key={subj.id} onClick={() => toggleSubject(subj.id)}
                                                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all text-sm ${isSelected
                                                        ? 'border-accent-500 bg-accent-500/5 shadow-sm'
                                                        : 'hover:border-gray-300 dark:hover:border-gray-600'
                                                        }`}
                                                    style={!isSelected ? { borderColor: 'var(--border-color)' } : undefined}>
                                                    <span className="text-lg">{subj.icon}</span>
                                                    <span className="truncate" style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                        {subj.label}
                                                    </span>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-accent-500 ml-auto flex-shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ── Difficulty ── */}
                                <div>
                                    <label className="text-sm font-semibold mb-3 block" style={{ color: 'var(--text-primary)' }}>
                                        Difficulty Level
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {DIFFICULTIES.map(diff => (
                                            <button key={diff.id} onClick={() => setDifficulty(diff.id)}
                                                className={`p-3 rounded-xl border-2 text-center transition-all ${difficulty === diff.id
                                                    ? 'border-accent-500 bg-accent-500/5 shadow-sm'
                                                    : 'hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                                style={difficulty !== diff.id ? { borderColor: 'var(--border-color)' } : undefined}>
                                                <div className={`text-sm font-semibold ${diff.color}`}>{diff.label}</div>
                                                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{diff.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Question Count ── */}
                                <div>
                                    <label className="text-sm font-semibold mb-3 block" style={{ color: 'var(--text-primary)' }}>
                                        Number of Questions
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {QUESTION_COUNTS.map(qc => (
                                            <button key={qc.value} onClick={() => setQuestionCount(qc.value)}
                                                className={`p-3 rounded-xl border-2 text-center transition-all ${questionCount === qc.value
                                                    ? 'border-accent-500 bg-accent-500/5 shadow-sm'
                                                    : 'hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                                style={questionCount !== qc.value ? { borderColor: 'var(--border-color)' } : undefined}>
                                                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{qc.value}</div>
                                                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{qc.timer}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Timer & Marks Info ── */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-secondary)' }}>
                                        <Timer className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                                        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{timerDisplay}</div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Duration</div>
                                    </div>
                                    <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-secondary)' }}>
                                        <Award className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                                        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>+2</div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Per correct</div>
                                    </div>
                                    <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-secondary)' }}>
                                        <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
                                        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>-0.67</div>
                                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Negative marking</div>
                                    </div>
                                </div>

                                {/* ── Instructions ── */}
                                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <FileText className="w-4 h-4 text-accent-500" /> Instructions
                                    </h4>
                                    <ul className="text-xs space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                                        <li>• Each question has 4 options. Only one is correct.</li>
                                        <li>• You can navigate between questions freely using the question palette.</li>
                                        <li>• Questions can be marked for review and revisited before submission.</li>
                                        <li>• Negative marking of -0.67 applies for each wrong answer.</li>
                                        <li>• Timer starts once you begin. The exam auto-submits when time runs out.</li>
                                        <li>• Questions are drawn from our bank of 7,200+ UPSC-standard questions.</li>
                                        <li>• On repeat attempts, at most 20% questions will overlap with previous tests.</li>
                                    </ul>
                                </div>

                                {/* ── Start Button ── */}
                                <button
                                    onClick={() => generateTest('custom')}
                                    disabled={generating}
                                    className="btn-primary w-full flex items-center justify-center gap-2 text-base !py-4 !rounded-xl shadow-lg"
                                >
                                    {generating ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Generating Questions…</>
                                    ) : (
                                        <><Play className="w-5 h-5" /> Take the Mock Test</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═════════════════════════════════════════════════════════════════
                MODAL: UPSC Full Length Instructions
               ═════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {activeModal === 'full_length' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={() => setActiveModal(null)}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border"
                            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b"
                                style={{ borderColor: 'var(--border-color)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                        <GraduationCap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                            {isCSAT ? 'UPSC Full Length CSAT' : 'UPSC Full Length Mock'}
                                        </h2>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {isCSAT ? 'Prelims CSAT Paper II Simulation' : 'Prelims GS Paper I Simulation'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveModal(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                </button>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Exam Details */}
                                <div className="grid grid-cols-2 gap-3">
                                    {(isCSAT ? [
                                        { label: 'Questions', value: '80', icon: Brain },
                                        { label: 'Duration', value: '2 Hours', icon: Timer },
                                        { label: 'Marks/Correct', value: '+2.5', icon: Award },
                                        { label: 'Negative Marking', value: '-0.83', icon: AlertTriangle },
                                    ] : [
                                        { label: 'Questions', value: '100', icon: Brain },
                                        { label: 'Duration', value: '2 Hours', icon: Timer },
                                        { label: 'Marks/Correct', value: '+2', icon: Award },
                                        { label: 'Negative Marking', value: '-0.67', icon: AlertTriangle },
                                    ]).map(item => (
                                        <div key={item.label} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-secondary)' }}>
                                            <item.icon className="w-4 h-4 text-accent-500 mx-auto mb-1" />
                                            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</div>
                                            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Instructions */}
                                <div className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <FileText className="w-4 h-4 text-accent-500" /> Instructions
                                    </h4>
                                    {isCSAT ? (
                                        <ul className="text-xs space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                                            <li>• This is a full-length simulation of UPSC CSE Prelims CSAT Paper II.</li>
                                            <li>• 80 questions, 120 minutes (2 hours). The timer is strict.</li>
                                            <li>• Marking scheme: +2.5 for correct, -0.83 for wrong, 0 for unattempted.</li>
                                            <li>• This is a qualifying paper — 33% (66.66/200) is needed to qualify.</li>
                                            <li>• Includes comprehension passages, logical reasoning, numeracy & data interpretation.</li>
                                            <li>• Comprehension questions are grouped with their passage.</li>
                                            <li>• Navigate freely using the question palette sidebar.</li>
                                            <li>• Results include topic-wise and difficulty-wise analysis.</li>
                                        </ul>
                                    ) : (
                                        <ul className="text-xs space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                                            <li>• This is a full-length simulation of UPSC CSE Prelims GS Paper I.</li>
                                            <li>• 100 questions, 120 minutes (2 hours). The timer is strict.</li>
                                            <li>• Marking scheme: +2 for correct, -0.67 for wrong, 0 for unattempted.</li>
                                            <li>• Subject distribution follows the actual UPSC Prelims pattern.</li>
                                            <li>• No question from the last 3 years&apos; Prelims papers will appear.</li>
                                            <li>• Navigate freely using the question palette sidebar.</li>
                                            <li>• Mark questions for review and revisit before final submission.</li>
                                            <li>• Results include subject-wise and difficulty-wise analysis.</li>
                                            <li>• On repeat attempts, at most 20% questions will overlap.</li>
                                        </ul>
                                    )}
                                </div>

                                {/* Start Button */}
                                <button
                                    onClick={() => generateTest('full_length')}
                                    disabled={generating}
                                    className="w-full flex items-center justify-center gap-2 text-base !py-4 !rounded-xl shadow-lg font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 transition-all"
                                >
                                    {generating ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Generating Full Length Paper…</>
                                    ) : (
                                        <><Play className="w-5 h-5" /> Start the Mock Test</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Payment gate modal will be added at a later stage */}
        </div>
    );
}
