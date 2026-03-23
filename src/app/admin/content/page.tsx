'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FileText, Shield, Loader2, BarChart3, Users, Inbox,
    Newspaper, BookOpen, Calendar, ExternalLink,
} from 'lucide-react';
import '../admin.css';

interface ContentStats {
    epapers: { total: number; latest: string | null };
    mocks: { totalDays: number; totalPrelims: number; totalMains: number; totalCsat: number };
}

export default function AdminContentPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<ContentStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/login?callbackUrl=/admin/content');
        }
        if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') {
            router.replace('/dashboard');
        }
        if (status === 'authenticated' && (session?.user as any)?.role === 'admin') {
            fetchStats();
        }
    }, [status, session, router]);

    async function fetchStats() {
        try {
            const res = await fetch('/api/admin/content', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to fetch content stats:', err);
        } finally {
            setLoading(false);
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="admin-loading">
                <Loader2 className="animate-spin" size={28} />
            </div>
        );
    }

    return (
        <div className="admin-page">
            {/* ── Sidebar ──────────────────────────── */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <Shield size={20} />
                    <span>Admin Console</span>
                </div>
                <nav className="admin-nav">
                    <Link href="/admin" className="admin-nav-item">
                        <BarChart3 size={16} /><span>Overview</span>
                    </Link>
                    <Link href="/admin/users" className="admin-nav-item">
                        <Users size={16} /><span>Users</span>
                    </Link>
                    <Link href="/admin/content" className="admin-nav-item active">
                        <FileText size={16} /><span>Content</span>
                    </Link>
                    <Link href="/admin/contact" className="admin-nav-item">
                        <Inbox size={16} /><span>Messages</span>
                    </Link>
                </nav>
                <div className="admin-sidebar-footer">
                    <Link href="/dashboard">← Back to Dashboard</Link>
                </div>
            </aside>

            {/* ── Main ─────────────────────────────── */}
            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>Content Management</h1>
                        <p>ePaper and mock test overview</p>
                    </div>
                </header>

                {/* ── ePaper Stats ──────────────────── */}
                <section className="admin-section">
                    <h2><Newspaper size={18} /> Daily ePaper</h2>
                    <div className="admin-stats-grid">
                        <div className="admin-stat-card" style={{ borderTopColor: '#8b5cf6' }}>
                            <div className="admin-stat-icon" style={{ color: '#8b5cf6' }}><Newspaper size={22} /></div>
                            <div className="admin-stat-value">{stats?.epapers.total ?? '—'}</div>
                            <div className="admin-stat-label">ePapers Published</div>
                            <div className="admin-stat-sub">
                                Latest: {stats?.epapers.latest || 'None yet'}
                            </div>
                        </div>
                    </div>
                    <div className="admin-actions-grid" style={{ marginTop: 12 }}>
                        <Link href="/daily-epaper" className="admin-action-card">
                            <ExternalLink size={16} />
                            <div>
                                <strong>View Live ePaper</strong>
                                <p>Open the public ePaper page</p>
                            </div>
                        </Link>
                        <Link href="/current-affairs" className="admin-action-card">
                            <BookOpen size={16} />
                            <div>
                                <strong>Current Affairs</strong>
                                <p>View categorized current affairs</p>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* ── Mock Test Stats ──────────────── */}
                <section className="admin-section">
                    <h2><Calendar size={18} /> Daily Mock Tests</h2>
                    <div className="admin-stats-grid">
                        <div className="admin-stat-card" style={{ borderTopColor: '#3b82f6' }}>
                            <div className="admin-stat-icon" style={{ color: '#3b82f6' }}><Calendar size={22} /></div>
                            <div className="admin-stat-value">{stats?.mocks.totalDays ?? '—'}</div>
                            <div className="admin-stat-label">Mock Days Available</div>
                        </div>
                        <div className="admin-stat-card" style={{ borderTopColor: '#ef4444' }}>
                            <div className="admin-stat-icon" style={{ color: '#ef4444' }}><BookOpen size={22} /></div>
                            <div className="admin-stat-value">{stats?.mocks.totalPrelims ?? '—'}</div>
                            <div className="admin-stat-label">Prelims Questions</div>
                        </div>
                        <div className="admin-stat-card" style={{ borderTopColor: '#10b981' }}>
                            <div className="admin-stat-icon" style={{ color: '#10b981' }}><FileText size={22} /></div>
                            <div className="admin-stat-value">{stats?.mocks.totalMains ?? '—'}</div>
                            <div className="admin-stat-label">Mains Questions</div>
                        </div>
                    </div>
                    <div className="admin-actions-grid" style={{ marginTop: 12 }}>
                        <Link href="/daily-mock" className="admin-action-card">
                            <ExternalLink size={16} />
                            <div>
                                <strong>View Mock Tests</strong>
                                <p>Open the public mock practice page</p>
                            </div>
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
