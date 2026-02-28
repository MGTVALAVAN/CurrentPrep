'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import {
    Newspaper, Calendar, ChevronLeft, ChevronRight,
    FileText, Archive, Loader2, BookOpen
} from 'lucide-react';

interface ArchiveData {
    dates: string[];
    totalArticles: number;
    latestDate: string | null;
}

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' },
    }),
};

function formatDateReadable(dateStr: string): string {
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function groupByMonth(dates: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    for (const date of dates) {
        const ym = date.slice(0, 7); // YYYY-MM
        const monthLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
        });
        if (!groups[monthLabel]) groups[monthLabel] = [];
        groups[monthLabel].push(date);
    }
    return groups;
}

export default function EpaperArchivePage() {
    const { t } = useLanguage();
    const [archiveData, setArchiveData] = useState<ArchiveData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchArchive() {
            try {
                const res = await fetch('/api/epaper?archive=true');
                if (!res.ok) throw new Error('Failed to load');
                const data = await res.json();
                setArchiveData(data);
            } catch {
                setArchiveData({ dates: [], totalArticles: 0, latestDate: null });
            } finally {
                setIsLoading(false);
            }
        }
        fetchArchive();
    }, []);

    const groupedDates = archiveData ? groupByMonth(archiveData.dates) : {};

    return (
        <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">
            {/* Header */}
            <header className="epaper-masthead">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="epaper-rule-double mb-6" />

                    <div className="flex items-center justify-between mb-4">
                        <Link href="/daily-epaper"
                            className="text-xs flex items-center gap-1 hover:text-accent-500 transition-colors"
                            style={{ color: 'var(--text-muted)' }}>
                            <ChevronLeft className="w-3 h-3" /> Latest ePaper
                        </Link>
                    </div>

                    <div className="text-center">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                            <div className="flex items-center justify-center gap-3 mb-3">
                                <Archive className="w-8 h-8 text-primary-500" />
                                <h1 className="font-heading text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                    ePaper Archive
                                </h1>
                            </div>
                            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                                Access past UPSC Daily ePapers — up to 60 days of GS-mapped current affairs
                            </p>
                            {archiveData && (
                                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                                    {archiveData.dates.length} editions · {archiveData.totalArticles} total articles
                                </p>
                            )}
                        </motion.div>
                    </div>

                    <div className="epaper-rule-double mt-6" />
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="glass-card p-16 text-center">
                        <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-primary-500" />
                        <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                            Loading archive…
                        </p>
                    </div>
                ) : Object.keys(groupedDates).length === 0 ? (
                    <div className="glass-card p-16 text-center">
                        <Newspaper className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                        <h2 className="text-xl font-heading font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                            No ePapers Yet
                        </h2>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            Generate your first ePaper from the main page
                        </p>
                        <Link href="/daily-epaper" className="btn-primary text-sm inline-flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Go to ePaper
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedDates).map(([month, dates], monthIdx) => (
                            <motion.section key={month}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: monthIdx * 0.1, duration: 0.4 }}>
                                <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2"
                                    style={{ color: 'var(--text-primary)' }}>
                                    <Calendar className="w-5 h-5 text-primary-500" />
                                    {month}
                                    <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary-800/5 dark:bg-primary-400/5"
                                        style={{ color: 'var(--text-muted)' }}>
                                        {dates.length} {dates.length === 1 ? 'edition' : 'editions'}
                                    </span>
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {dates.map((date, i) => (
                                        <motion.div key={date} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                                            <Link href={`/daily-epaper/${date}`}
                                                className="glass-card p-4 block card-hover group">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-heading font-semibold text-sm group-hover:text-accent-500 transition-colors"
                                                            style={{ color: 'var(--text-primary)' }}>
                                                            {formatDateReadable(date)}
                                                        </p>
                                                        <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                                                            {date}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {date === archiveData?.latestDate && (
                                                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                                                                Latest
                                                            </span>
                                                        )}
                                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-accent-500" />
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
