'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Brain, ChevronRight, Trophy, Target, Sparkles, BookOpen,
    Clock, BarChart3, Play, CheckCircle2, ArrowLeft, Loader2
} from 'lucide-react';

type SubjectInfo = {
    subject: string;
    label: string;
    icon: string;
    mockCount: number;
    totalQuestions: number;
    mocks: { mock_id: string; title: string; total_questions: number; difficulty_summary: Record<string, number> }[];
};

type SubjectData = {
    subjects: SubjectInfo[];
    totalSubjects: number;
    totalMocks: number;
    totalQuestions: number;
};

const SUBJECT_COLORS: Record<string, string> = {
    'art_culture': 'from-pink-500 to-rose-600',
    'current_affairs': 'from-red-500 to-rose-600',
    'economics': 'from-yellow-500 to-amber-600',
    'environment': 'from-green-500 to-emerald-600',
    'geography': 'from-emerald-500 to-teal-600',
    'history': 'from-amber-500 to-orange-600',
    'polity': 'from-blue-500 to-indigo-600',
    'science': 'from-cyan-500 to-blue-600',
    'society': 'from-purple-500 to-violet-600',
};

export default function MockTestsPage() {
    const [data, setData] = useState<SubjectData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<SubjectInfo | null>(null);

    useEffect(() => {
        fetch('/api/mock-tests')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
            {/* Header */}
            <section className="hero-bg py-12 lg:py-16">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm text-blue-100 mb-4">
                        <Target className="w-4 h-4 text-accent-400" />
                        <span>{data?.totalQuestions?.toLocaleString()}+ Questions • {data?.totalMocks} Mock Papers</span>
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-3xl sm:text-4xl font-heading font-bold text-white mb-3">
                        UPSC CSE Prelims Mock Tests
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="text-lg text-blue-100/80 max-w-2xl mx-auto">
                        Subject-wise mock tests with 100 questions each. Practice at your own pace with detailed explanations.
                    </motion.p>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="mt-6">
                        <Link href="/quiz" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-all">
                            <Sparkles className="w-4 h-4" /> Quick Quiz (pick topics & count)
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
                <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4">
                    {[
                        { label: 'Subjects', value: data?.totalSubjects || 0, icon: BookOpen },
                        { label: 'Mock Papers', value: data?.totalMocks || 0, icon: BarChart3 },
                        { label: 'Total Questions', value: data?.totalQuestions?.toLocaleString() || '0', icon: Brain },
                    ].map((stat, i) => (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="glass-card p-4 text-center shadow-xl">
                            <stat.icon className="w-5 h-5 text-accent-500 mx-auto mb-1" />
                            <div className="text-xl font-bold font-heading" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Subject Grid or Mock List */}
            <section className="section-padding">
                <div className="max-w-5xl mx-auto">
                    <AnimatePresence mode="wait">
                        {!selectedSubject ? (
                            /* ─── Subject Cards ─── */
                            <motion.div key="subjects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <h2 className="font-heading font-semibold text-xl mb-6" style={{ color: 'var(--text-primary)' }}>
                                    Choose a Subject
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {data?.subjects.map((subj, i) => (
                                        <motion.button key={subj.subject}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => setSelectedSubject(subj)}
                                            className="glass-card p-5 text-left card-hover group">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${SUBJECT_COLORS[subj.subject] || 'from-gray-500 to-gray-600'} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                                    <span className="text-2xl">{subj.icon}</span>
                                                </div>
                                                <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                                            </div>
                                            <h3 className="font-heading font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                                                {subj.label}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                <span>{subj.mockCount} tests</span>
                                                <span>•</span>
                                                <span>{subj.totalQuestions} Qs</span>
                                            </div>
                                            {/* Progress placeholder */}
                                            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                                                <div className={`h-full rounded-full bg-gradient-to-r ${SUBJECT_COLORS[subj.subject] || 'from-gray-400 to-gray-500'}`}
                                                    style={{ width: '0%' }} />
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            /* ─── Mock List for Selected Subject ─── */
                            <motion.div key="mocks" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                                <button onClick={() => setSelectedSubject(null)}
                                    className="flex items-center gap-2 text-sm font-medium mb-6 hover:text-accent-500 transition-colors"
                                    style={{ color: 'var(--text-secondary)' }}>
                                    <ArrowLeft className="w-4 h-4" /> Back to All Subjects
                                </button>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${SUBJECT_COLORS[selectedSubject.subject] || 'from-gray-500 to-gray-600'} flex items-center justify-center shadow-lg`}>
                                        <span className="text-3xl">{selectedSubject.icon}</span>
                                    </div>
                                    <div>
                                        <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
                                            {selectedSubject.label}
                                        </h2>
                                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                            {selectedSubject.mockCount} Mock Tests • {selectedSubject.totalQuestions} Questions
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {selectedSubject.mocks.map((mock, i) => (
                                        <motion.div key={mock.mock_id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}>
                                            <Link href={`/mock-tests/${mock.mock_id}`}
                                                className="block glass-card p-5 card-hover group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${SUBJECT_COLORS[selectedSubject.subject] || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                                                            {i + 1}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-heading font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                                                                {mock.title}
                                                            </h3>
                                                            <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                                                <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> {mock.total_questions} Qs</span>
                                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 120 min</span>
                                                                {mock.difficulty_summary && (
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="text-emerald-500">E:{mock.difficulty_summary.easy}</span>
                                                                        <span className="text-amber-500">M:{mock.difficulty_summary.medium}</span>
                                                                        <span className="text-red-500">H:{mock.difficulty_summary.hard}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="btn-primary text-xs !px-4 !py-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Play className="w-3.5 h-3.5" /> Start
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </div>
    );
}
