'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageProvider';
import {
    BookOpen, Target, Trophy, Flame, Clock, TrendingUp,
    BarChart3, Brain, MessageSquare, FileText, Play, Pause,
    RotateCcw, CheckCircle2, Star, Award, Zap, Calendar,
    ChevronRight, ArrowUpRight
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
    }),
};

// Demo data
const overviewStats = [
    { label: 'Topics Completed', value: 24, total: 180, icon: BookOpen, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { label: 'Quiz Score Avg', value: 72, total: 100, icon: Target, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', suffix: '%' },
    { label: 'Study Streak', value: 7, icon: Flame, color: 'text-orange-500', bgColor: 'bg-orange-500/10', suffix: ' days' },
    { label: 'Badges Earned', value: 3, total: 8, icon: Trophy, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
];

const subjectProgress = [
    { name: 'Indian Polity & Governance', paper: 'GS-II', completed: 18, total: 25, color: 'from-blue-500 to-indigo-600' },
    { name: 'History of India', paper: 'GS-I', completed: 12, total: 30, color: 'from-purple-500 to-pink-600' },
    { name: 'Geography', paper: 'GS-I', completed: 8, total: 22, color: 'from-emerald-500 to-teal-600' },
    { name: 'Indian Economy', paper: 'GS-III', completed: 6, total: 20, color: 'from-amber-500 to-orange-600' },
    { name: 'Environment & Ecology', paper: 'GS-III', completed: 4, total: 15, color: 'from-green-500 to-lime-600' },
    { name: 'Science & Technology', paper: 'GS-III', completed: 3, total: 18, color: 'from-cyan-500 to-blue-600' },
];

const recentActivity = [
    { type: 'quiz', text: 'Scored 80% in Indian Polity Quiz', time: '2 hours ago', icon: Target, color: 'text-emerald-500' },
    { type: 'topic', text: 'Completed "Fundamental Rights" topic', time: '5 hours ago', icon: CheckCircle2, color: 'text-blue-500' },
    { type: 'badge', text: 'Earned "7-Day Streak" badge 🔥', time: 'Today', icon: Award, color: 'text-amber-500' },
    { type: 'forum', text: 'Replied in "Prelims Strategy 2025" thread', time: 'Yesterday', icon: MessageSquare, color: 'text-purple-500' },
    { type: 'quiz', text: 'Scored 65% in Economy Current Affairs', time: '2 days ago', icon: Target, color: 'text-orange-500' },
];

const earnedBadges = [
    { icon: '🏆', name: 'First Quiz', earned: true },
    { icon: '🔥', name: '7-Day Streak', earned: true },
    { icon: '📚', name: 'NCERT Master', earned: false },
    { icon: '🚶', name: 'Healthy Mind', earned: true },
    { icon: '✍️', name: 'Essay Writer', earned: false },
    { icon: '🎯', name: 'Prelims Ready', earned: false },
    { icon: '⭐', name: 'Community Star', earned: false },
    { icon: '🤝', name: 'Mentor', earned: false },
];

const quickActions = [
    { label: 'Start Quiz', desc: 'AI-generated MCQs', icon: Brain, href: '/features', color: 'from-purple-500 to-indigo-600' },
    { label: 'Read Syllabus', desc: 'Explore topics', icon: FileText, href: '/syllabus', color: 'from-blue-500 to-cyan-600' },
    { label: 'Current Affairs', desc: 'Today\'s updates', icon: Zap, href: '/current-affairs', color: 'from-amber-500 to-orange-600' },
    { label: 'Community', desc: 'Join discussions', icon: MessageSquare, href: '/community', color: 'from-emerald-500 to-teal-600' },
];

const weeklyData = [
    { day: 'Mon', hours: 3.5 },
    { day: 'Tue', hours: 4.2 },
    { day: 'Wed', hours: 2.8 },
    { day: 'Thu', hours: 5.0 },
    { day: 'Fri', hours: 3.0 },
    { day: 'Sat', hours: 6.5 },
    { day: 'Sun', hours: 4.0 },
];

function StudyTimer() {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [walkBreakAlert, setWalkBreakAlert] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setSeconds(s => {
                    const next = s + 1;
                    // Walking break suggestion every 45 minutes
                    if (next > 0 && next % 2700 === 0) {
                        setWalkBreakAlert(true);
                    }
                    return next;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTime = (total: number) => {
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-accent-500" />
                <h3 className="font-heading font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                    Study Timer
                </h3>
            </div>

            <div className="text-center mb-4">
                <div className="font-mono text-4xl font-bold tracking-wider gradient-text mb-1">
                    {formatTime(seconds)}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Walking break reminder every 45 min
                </p>
            </div>

            <div className="flex items-center justify-center gap-3">
                <button onClick={() => setIsRunning(!isRunning)}
                    className={`p-3 rounded-xl text-white transition-all duration-200 shadow-lg hover:shadow-xl ${isRunning
                        ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400'
                        }`}>
                    {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button onClick={() => { setSeconds(0); setIsRunning(false); }}
                    className="p-3 rounded-xl border transition-all duration-200 hover:bg-primary-800/5"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>

            <AnimatePresence>
                {walkBreakAlert && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                            🚶 Time for a walking break! Stretch your legs for 5 minutes.
                        </p>
                        <button onClick={() => setWalkBreakAlert(false)}
                            className="text-xs text-amber-500 hover:text-amber-600 mt-1 underline">
                            Dismiss
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function DashboardPage() {
    const { t } = useLanguage();
    const maxHours = Math.max(...weeklyData.map(d => d.hours));

    return (
        <div style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <section className="section-padding !pb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent-500/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
                            <div>
                                <h1 className="font-heading text-3xl lg:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                    Welcome back, <span className="gradient-text">Demo User</span> 👋
                                </h1>
                                <p className="mt-2 text-base" style={{ color: 'var(--text-secondary)' }}>
                                    You&apos;re on a <strong className="text-orange-500">7-day streak</strong> — keep the momentum going!
                                </p>
                            </div>
                            <Link href="/syllabus" className="btn-accent flex items-center gap-2 text-sm !py-2.5 whitespace-nowrap">
                                <BookOpen className="w-4 h-4" /> Continue Studying
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Overview Stats */}
            <section className="px-4 sm:px-6 lg:px-8 -mt-4">
                <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {overviewStats.map((stat, i) => (
                        <motion.div key={stat.label} custom={i + 1} variants={fadeUp} initial="hidden" animate="visible"
                            className="glass-card p-5 card-hover">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold font-heading" style={{ color: 'var(--text-primary)' }}>
                                {stat.value}{stat.suffix || ''}
                                {stat.total && (
                                    <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                                        /{stat.total}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
                            {stat.total && (
                                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(stat.value / stat.total) * 100}%` }}
                                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                                        className={`h-full rounded-full bg-gradient-to-r ${stat.color === 'text-blue-500' ? 'from-blue-500 to-indigo-500' :
                                            stat.color === 'text-emerald-500' ? 'from-emerald-500 to-teal-500' :
                                                stat.color === 'text-amber-500' ? 'from-amber-500 to-orange-500' :
                                                    'from-orange-500 to-red-500'}`}
                                    />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Quick Actions */}
            <section className="px-4 sm:px-6 lg:px-8 mt-8">
                <div className="max-w-7xl mx-auto">
                    <h2 className="font-heading font-semibold text-xl mb-4" style={{ color: 'var(--text-primary)' }}>
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action, i) => (
                            <motion.div key={action.label} custom={i + 5} variants={fadeUp} initial="hidden" animate="visible">
                                <Link href={action.href}
                                    className="block glass-card p-5 card-hover group cursor-pointer">
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-shadow`}>
                                        <action.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-heading font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                        {action.label}
                                    </h3>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{action.desc}</p>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main Grid: Subject Progress + Sidebar */}
            <section className="section-padding">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Subject Progress + Weekly Chart */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Subject Progress */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-primary-500" />
                                    <h3 className="font-heading font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                                        Subject Progress
                                    </h3>
                                </div>
                                <Link href="/syllabus" className="text-sm font-medium text-accent-500 hover:text-accent-600 flex items-center gap-1">
                                    View All <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="space-y-5">
                                {subjectProgress.map((subject, i) => {
                                    const pct = Math.round((subject.completed / subject.total) * 100);
                                    return (
                                        <motion.div key={subject.name} custom={i} variants={fadeUp} initial="hidden"
                                            whileInView="visible" viewport={{ once: true }}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div>
                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {subject.name}
                                                    </span>
                                                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                                                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                                                        {subject.paper}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                                    {subject.completed}/{subject.total} ({pct}%)
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${pct}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: 0.2 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                                                    className={`h-full rounded-full bg-gradient-to-r ${subject.color}`}
                                                />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Weekly Study Chart */}
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Calendar className="w-5 h-5 text-primary-500" />
                                <h3 className="font-heading font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                                    This Week&apos;s Study Hours
                                </h3>
                            </div>

                            <div className="flex items-end justify-between gap-2 h-40">
                                {weeklyData.map((day, i) => (
                                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                            {day.hours}h
                                        </span>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            whileInView={{ height: `${(day.hours / maxHours) * 100}%` }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                                            className="w-full rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400 min-h-[4px]"
                                            style={{ maxHeight: '100%' }}
                                        />
                                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{day.day}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t flex items-center justify-between"
                                style={{ borderColor: 'var(--border-color)' }}>
                                <div>
                                    <span className="text-2xl font-bold font-heading" style={{ color: 'var(--text-primary)' }}>
                                        29.0h
                                    </span>
                                    <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>this week</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-emerald-500">
                                    <TrendingUp className="w-4 h-4" />
                                    +15% vs last week
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Study Timer */}
                        <StudyTimer />

                        {/* Recent Activity */}
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-primary-500" />
                                <h3 className="font-heading font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                                    Recent Activity
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {recentActivity.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="mt-0.5">
                                            <item.icon className={`w-4 h-4 ${item.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.text}</p>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-amber-500" />
                                    <h3 className="font-heading font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                                        Badges
                                    </h3>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                                    3/8 earned
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {earnedBadges.map((badge, i) => (
                                    <div key={i}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${badge.earned
                                            ? 'bg-amber-500/5'
                                            : 'opacity-40 grayscale'
                                            }`}
                                        title={badge.name}>
                                        <span className="text-2xl">{badge.icon}</span>
                                        <span className="text-[10px] text-center leading-tight" style={{ color: 'var(--text-muted)' }}>
                                            {badge.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
