'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import {
    BookOpen, Calendar, ChevronLeft, ChevronRight,
    Archive, Loader2, PenTool, Brain, FileText, Target,
    BarChart3,
} from 'lucide-react';

interface MockArchiveEntry {
    date: string;
    dateFormatted: string;
    prelims: number;
    mains: number;
    csat: number;
}

interface MockArchiveData {
    entries: MockArchiveEntry[];
    totalPrelims: number;
    totalMains: number;
    totalCsat: number;
}

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.03, duration: 0.3, ease: 'easeOut' },
    }),
};

function groupByMonth(entries: MockArchiveEntry[]): Record<string, MockArchiveEntry[]> {
    const groups: Record<string, MockArchiveEntry[]> = {};
    for (const entry of entries) {
        const d = new Date(entry.date + 'T00:00:00');
        const monthLabel = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
        if (!groups[monthLabel]) groups[monthLabel] = [];
        groups[monthLabel].push(entry);
    }
    return groups;
}

export default function DailyMockArchivePage() {
    const { t } = useLanguage();
    const [data, setData] = useState<MockArchiveData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchArchive() {
            try {
                const res = await fetch('/api/daily-mock?limit=600&archive=true');
                if (!res.ok) throw new Error('Failed to load');
                const result = await res.json();

                // Build archive entries from days
                const entries: MockArchiveEntry[] = (result.days || []).map((day: any) => {
                    const csatCount = (day.csatMocks?.comprehension || [])
                        .reduce((s: number, c: any) => s + (c.questions?.length || 0), 0)
                        + (day.csatMocks?.reasoning || []).length;
                    return {
                        date: day.date,
                        dateFormatted: day.dateFormatted,
                        prelims: day.prelimsMocks?.length || 0,
                        mains: day.mainsMocks?.length || 0,
                        csat: csatCount,
                    };
                });

                setData({
                    entries,
                    totalPrelims: result.totalPrelims || 0,
                    totalMains: result.totalMains || 0,
                    totalCsat: result.totalCsat || 0,
                });
            } catch {
                setData({ entries: [], totalPrelims: 0, totalMains: 0, totalCsat: 0 });
            } finally {
                setIsLoading(false);
            }
        }
        fetchArchive();
    }, []);

    const groupedEntries = data ? groupByMonth(data.entries) : {};
    const totalQuestions = (data?.totalPrelims || 0) + (data?.totalMains || 0) + (data?.totalCsat || 0);

    return (
        <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
            {/* Header */}
            <header className="epaper-masthead">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="epaper-rule-double mb-6" />

                    <div className="flex items-center justify-between mb-4">
                        <Link href="/daily-mock"
                            className="text-xs flex items-center gap-1 hover:text-accent-500 transition-colors"
                            style={{ color: 'var(--text-muted)' }}>
                            <ChevronLeft className="w-3 h-3" /> Today&apos;s Mock
                        </Link>
                        <Link href="/daily-epaper/archive"
                            className="text-xs flex items-center gap-1 hover:text-accent-500 transition-colors"
                            style={{ color: 'var(--text-muted)' }}>
                            ePaper Archive <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="text-center">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                            <div className="flex items-center justify-center gap-3 mb-3">
                                <Archive className="w-8 h-8 text-primary-500" />
                                <h1 className="font-heading text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                    Daily Mock Archive
                                </h1>
                            </div>
                            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                                Practice with past daily mocks — Prelims MCQs, CSAT Aptitude &amp; Mains Questions
                            </p>
                            {data && (
                                <div className="flex items-center justify-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {data.entries.length} days
                                    </span>
                                    <span>·</span>
                                    <span>{totalQuestions} total questions</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> {data.totalPrelims} Prelims
                                    </span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1">
                                        <Brain className="w-3 h-3" /> {data.totalCsat} CSAT
                                    </span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1">
                                        <PenTool className="w-3 h-3" /> {data.totalMains} Mains
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    <div className="epaper-rule-double mt-6" />
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="glass-card p-16 text-center">
                        <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-primary-500" />
                        <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                            Loading mock archive…
                        </p>
                    </div>
                ) : Object.keys(groupedEntries).length === 0 ? (
                    <div className="glass-card p-16 text-center">
                        <BookOpen className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                        <h2 className="text-xl font-heading font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                            No Mock Data Yet
                        </h2>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            Mock questions will appear here once daily ePapers are generated.
                        </p>
                        <Link href="/daily-mock" className="btn-primary text-sm inline-flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Go to Daily Mock
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedEntries).map(([month, entries], monthIdx) => {
                            const monthPrelims = entries.reduce((s, e) => s + e.prelims, 0);
                            const monthMains = entries.reduce((s, e) => s + e.mains, 0);
                            const monthCsat = entries.reduce((s, e) => s + e.csat, 0);
                            const monthTotal = monthPrelims + monthMains + monthCsat;

                            return (
                                <motion.section key={month}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: monthIdx * 0.08, duration: 0.4 }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="font-heading font-bold text-lg flex items-center gap-2"
                                            style={{ color: 'var(--text-primary)' }}>
                                            <Calendar className="w-5 h-5 text-primary-500" />
                                            {month}
                                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary-800/5 dark:bg-primary-400/5"
                                                style={{ color: 'var(--text-muted)' }}>
                                                {entries.length} days · {monthTotal} Qs
                                            </span>
                                        </h2>
                                        <div className="flex gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                            <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(59, 130, 246, 0.08)' }}>
                                                📝 {monthPrelims}P
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(168, 85, 247, 0.08)' }}>
                                                🧩 {monthCsat}C
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.08)' }}>
                                                ✍️ {monthMains}M
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {entries.map((entry, i) => (
                                            <motion.div key={entry.date} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                                                <Link href={`/daily-mock?date=${entry.date}`}
                                                    className="glass-card p-4 block card-hover group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="font-heading font-semibold text-sm group-hover:text-accent-500 transition-colors"
                                                            style={{ color: 'var(--text-primary)' }}>
                                                            {entry.dateFormatted}
                                                        </p>
                                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-accent-500" />
                                                    </div>
                                                    <div className="flex gap-2 text-[10px]">
                                                        {entry.prelims > 0 && (
                                                            <span className="px-2 py-0.5 rounded-full font-semibold"
                                                                style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'rgb(59, 130, 246)' }}>
                                                                📝 {entry.prelims} Prelims
                                                            </span>
                                                        )}
                                                        {entry.csat > 0 && (
                                                            <span className="px-2 py-0.5 rounded-full font-semibold"
                                                                style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'rgb(168, 85, 247)' }}>
                                                                🧩 {entry.csat} CSAT
                                                            </span>
                                                        )}
                                                        {entry.mains > 0 && (
                                                            <span className="px-2 py-0.5 rounded-full font-semibold"
                                                                style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'rgb(34, 197, 94)' }}>
                                                                ✍️ {entry.mains} Mains
                                                            </span>
                                                        )}
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.section>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
