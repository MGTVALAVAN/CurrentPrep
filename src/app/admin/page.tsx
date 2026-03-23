'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Users, Mail, FileText, BarChart3, Shield,
    TrendingUp, Eye, Clock, AlertCircle, Loader2,
    ChevronRight, Inbox, BookOpen, Activity,
} from 'lucide-react';
import './admin.css';

// ── Types ──────────────────────────────────────────────────────────────

interface AdminStats {
    users: { total: number; premium: number; newThisWeek: number };
    content: { epapers: number; mockDays: number; quizzesTaken: number };
    contact: { total: number; unread: number };
}

// ── Component ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/login?callbackUrl=/admin');
            return;
        }
        if (status === 'authenticated') {
            const role = (session?.user as any)?.role;
            if (role !== 'admin') {
                router.replace('/dashboard');
                return;
            }
            fetchStats();
        }
    }, [status, session, router]);

    async function fetchStats() {
        try {
            const res = await fetch('/api/admin/stats', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to fetch admin stats:', err);
        } finally {
            setLoading(false);
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="admin-loading">
                <Loader2 className="animate-spin" size={28} />
                <p>Loading admin console…</p>
            </div>
        );
    }

    const user = session?.user;
    const s = stats;

    return (
        <div className="admin-page">
            {/* ── Sidebar ──────────────────────────────────── */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <Shield size={20} />
                    <span>Admin Console</span>
                </div>
                <nav className="admin-nav">
                    <Link href="/admin" className="admin-nav-item active">
                        <BarChart3 size={16} />
                        <span>Overview</span>
                    </Link>
                    <Link href="/admin/users" className="admin-nav-item">
                        <Users size={16} />
                        <span>Users</span>
                    </Link>
                    <Link href="/admin/content" className="admin-nav-item">
                        <FileText size={16} />
                        <span>Content</span>
                    </Link>
                    <Link href="/admin/contact" className="admin-nav-item">
                        <Inbox size={16} />
                        <span>Messages</span>
                        {s && s.contact.unread > 0 && (
                            <span className="admin-badge">{s.contact.unread}</span>
                        )}
                    </Link>
                </nav>
                <div className="admin-sidebar-footer">
                    <Link href="/dashboard">← Back to Dashboard</Link>
                </div>
            </aside>

            {/* ── Main Content ─────────────────────────────── */}
            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Admin Overview</h1>
                        <p>Welcome back, {user?.name || 'Admin'}</p>
                    </div>
                    <div className="admin-header-meta">
                        <span><Clock size={14} /> {new Date().toLocaleDateString('en-IN', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                        })}</span>
                    </div>
                </header>

                {/* ── Stats Grid ──────────────────────────── */}
                <div className="admin-stats-grid">
                    <StatCard
                        icon={<Users size={22} />}
                        label="Total Users"
                        value={s?.users.total ?? '—'}
                        sub={`${s?.users.newThisWeek ?? 0} new this week`}
                        color="#3b82f6"
                    />
                    <StatCard
                        icon={<TrendingUp size={22} />}
                        label="Premium Users"
                        value={s?.users.premium ?? '—'}
                        sub={s?.users.total ? `${Math.round(((s.users.premium || 0) / s.users.total) * 100)}% conversion` : '—'}
                        color="#10b981"
                    />
                    <StatCard
                        icon={<FileText size={22} />}
                        label="ePapers Published"
                        value={s?.content.epapers ?? '—'}
                        sub={`${s?.content.mockDays ?? 0} mock days`}
                        color="#8b5cf6"
                    />
                    <StatCard
                        icon={<Mail size={22} />}
                        label="Contact Messages"
                        value={s?.contact.total ?? '—'}
                        sub={`${s?.contact.unread ?? 0} unread`}
                        color={s?.contact.unread ? '#ef4444' : '#64748b'}
                    />
                </div>

                {/* ── Quick Actions ───────────────────────── */}
                <section className="admin-section">
                    <h2><Activity size={18} /> Quick Actions</h2>
                    <div className="admin-actions-grid">
                        <Link href="/admin/users" className="admin-action-card">
                            <Users size={20} />
                            <div>
                                <strong>Manage Users</strong>
                                <p>View, search, and update user roles</p>
                            </div>
                            <ChevronRight size={16} />
                        </Link>
                        <Link href="/admin/contact" className="admin-action-card">
                            <Inbox size={20} />
                            <div>
                                <strong>Read Messages</strong>
                                <p>Review contact form submissions</p>
                            </div>
                            {s && s.contact.unread > 0 && (
                                <span className="admin-badge">{s.contact.unread}</span>
                            )}
                            <ChevronRight size={16} />
                        </Link>
                        <Link href="/admin/content" className="admin-action-card">
                            <BookOpen size={20} />
                            <div>
                                <strong>Content Overview</strong>
                                <p>View ePaper and quiz stats</p>
                            </div>
                            <ChevronRight size={16} />
                        </Link>
                        <Link href="/daily-epaper" className="admin-action-card">
                            <Eye size={20} />
                            <div>
                                <strong>View Live ePaper</strong>
                                <p>See today&apos;s published content</p>
                            </div>
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                </section>

                {/* ── System Status ───────────────────────── */}
                <section className="admin-section">
                    <h2><AlertCircle size={18} /> System Status</h2>
                    <div className="admin-status-list">
                        <StatusRow label="NextAuth" status="active" detail="JWT sessions, 30-day TTL" />
                        <StatusRow label="Supabase" status="active" detail="Database connected" />
                        <StatusRow label="Daily Pipeline" status="active" detail="Cron: 00:00 UTC daily" />
                        <StatusRow label="Rate Limiting" status="active" detail="In-memory, per-IP" />
                    </div>
                </section>
            </main>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: {
    icon: React.ReactNode; label: string; value: string | number; sub: string; color: string;
}) {
    return (
        <div className="admin-stat-card" style={{ borderTopColor: color }}>
            <div className="admin-stat-icon" style={{ color }}>{icon}</div>
            <div className="admin-stat-value">{value}</div>
            <div className="admin-stat-label">{label}</div>
            <div className="admin-stat-sub">{sub}</div>
        </div>
    );
}

function StatusRow({ label, status, detail }: {
    label: string; status: 'active' | 'warning' | 'error'; detail: string;
}) {
    const colors = { active: '#10b981', warning: '#f59e0b', error: '#ef4444' };
    return (
        <div className="admin-status-row">
            <span className="admin-status-dot" style={{ background: colors[status] }} />
            <span className="admin-status-label">{label}</span>
            <span className="admin-status-detail">{detail}</span>
        </div>
    );
}
