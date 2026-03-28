'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Users, Mail, FileText, BarChart3, Shield,
    TrendingUp, Eye, Clock, AlertCircle, Loader2,
    ChevronRight, Inbox, BookOpen, Activity,
    IndianRupee, CreditCard, XCircle, Timer,
    CheckCircle2, HeartPulse,
} from 'lucide-react';
import './admin.css';

// ── Types ──────────────────────────────────────────────────────────────

interface AdminStats {
    users: { total: number; premium: number; newThisWeek: number };
    content: { epapers: number; mockDays: number; quizzesTaken: number };
    contact: { total: number; unread: number };
}

interface PaymentStats {
    summary: {
        totalRevenue: number;
        totalPaid: number;
        totalFailed: number;
        totalPending: number;
        avgOrderValue: number;
    };
    byPlan: Array<{ plan: string; count: number; revenue: number }>;
    recent: Array<{
        id: string;
        userName: string;
        userEmail: string;
        plan: string;
        amount: number;
        status: string;
        date: string;
    }>;
}

interface HealthCheck {
    status: string;
    checks: Record<string, 'ok' | 'error' | 'unconfigured'>;
    responseTime: string;
    environment: string;
}

// ── Component ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
    const [health, setHealth] = useState<HealthCheck | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/admin/login');
            return;
        }
        if (status === 'authenticated') {
            const role = (session?.user as any)?.role;
            if (role !== 'admin') {
                router.replace('/dashboard');
                return;
            }
            fetchAllData();
        }
    }, [status, session, router]);

    async function fetchAllData() {
        try {
            const [statsRes, paymentsRes, healthRes] = await Promise.allSettled([
                fetch('/api/admin/stats', { cache: 'no-store' }),
                fetch('/api/admin/payments?limit=5', { cache: 'no-store' }),
                fetch('/api/health', { cache: 'no-store' }),
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
                setStats(await statsRes.value.json());
            }
            if (paymentsRes.status === 'fulfilled' && paymentsRes.value.ok) {
                setPaymentStats(await paymentsRes.value.json());
            }
            if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
                setHealth(await healthRes.value.json());
            }
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
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
    const p = paymentStats?.summary;

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
                    <Link href="/admin/payments" className="admin-nav-item">
                        <CreditCard size={16} />
                        <span>Payments</span>
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

                {/* ── User & Content Stats ──────────────────── */}
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

                {/* ── Revenue Overview ───────────────────────── */}
                <section className="admin-section">
                    <h2><IndianRupee size={18} /> Revenue Overview</h2>
                    <div className="admin-stats-grid">
                        <StatCard
                            icon={<IndianRupee size={22} />}
                            label="Total Revenue"
                            value={p ? formatPaise(p.totalRevenue) : '—'}
                            sub={p ? `Avg order: ${formatPaise(p.avgOrderValue)}` : '—'}
                            color="#059669"
                        />
                        <StatCard
                            icon={<CheckCircle2 size={22} />}
                            label="Successful Payments"
                            value={p?.totalPaid ?? '—'}
                            sub="All time"
                            color="#10b981"
                        />
                        <StatCard
                            icon={<XCircle size={22} />}
                            label="Failed"
                            value={p?.totalFailed ?? '—'}
                            sub={p?.totalPending ? `${p.totalPending} pending` : '—'}
                            color="#ef4444"
                        />
                        <StatCard
                            icon={<Timer size={22} />}
                            label="Pending Orders"
                            value={p?.totalPending ?? '—'}
                            sub="Awaiting payment"
                            color="#f59e0b"
                        />
                    </div>

                    {/* ── Revenue by Plan ── */}
                    {paymentStats && paymentStats.byPlan.length > 0 && (
                        <div className="admin-revenue-plans">
                            <h3 style={{ fontSize: 13, color: 'var(--admin-ink-2)', marginBottom: 8, fontWeight: 600 }}>
                                Revenue by Plan
                            </h3>
                            <div className="admin-plan-chips">
                                {paymentStats.byPlan.map(p => (
                                    <div key={p.plan} className="admin-plan-chip">
                                        <span className="admin-plan-name">{formatPlanName(p.plan)}</span>
                                        <span className="admin-plan-revenue">{formatPaise(p.revenue)}</span>
                                        <span className="admin-plan-count">{p.count} sale{p.count !== 1 ? 's' : ''}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Recent Transactions ── */}
                    {paymentStats && paymentStats.recent.length > 0 && (
                        <div className="admin-recent-txn">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <h3 style={{ fontSize: 13, color: 'var(--admin-ink-2)', fontWeight: 600 }}>
                                    Recent Transactions
                                </h3>
                                <Link href="/admin/payments" style={{ fontSize: 12, color: 'var(--admin-accent)', textDecoration: 'none' }}>
                                    View all →
                                </Link>
                            </div>
                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Plan</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentStats.recent.map(txn => (
                                            <tr key={txn.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{txn.userName}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--admin-ink-3)' }}>{txn.userEmail}</div>
                                                </td>
                                                <td>{formatPlanName(txn.plan)}</td>
                                                <td style={{ fontWeight: 600 }}>{formatPaise(txn.amount)}</td>
                                                <td>
                                                    <span className={`admin-payment-status ${txn.status}`}>
                                                        {txn.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: 12 }}>
                                                    {new Date(txn.date).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short',
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>

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
                        <Link href="/admin/payments" className="admin-action-card">
                            <CreditCard size={20} />
                            <div>
                                <strong>Payment History</strong>
                                <p>All transactions and revenue</p>
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

                {/* ── System Status (Live) ───────────────────── */}
                <section className="admin-section">
                    <h2><HeartPulse size={18} /> System Health</h2>
                    <div className="admin-status-list">
                        {health ? (
                            <>
                                <StatusRow
                                    label="Overall"
                                    status={health.status === 'ok' ? 'active' : 'warning'}
                                    detail={`${health.status.toUpperCase()} • ${health.responseTime} • ${health.environment}`}
                                />
                                <StatusRow
                                    label="Database (Supabase)"
                                    status={health.checks.database === 'ok' ? 'active' : health.checks.database === 'error' ? 'error' : 'warning'}
                                    detail={health.checks.database === 'ok' ? 'Connected' : health.checks.database === 'error' ? 'Connection failed' : 'Not configured'}
                                />
                                <StatusRow
                                    label="Authentication"
                                    status={health.checks.auth === 'ok' ? 'active' : 'warning'}
                                    detail={health.checks.auth === 'ok' ? 'NEXTAUTH_SECRET set' : 'Missing secret'}
                                />
                                <StatusRow
                                    label="AI (Gemini)"
                                    status={health.checks.ai === 'ok' ? 'active' : 'warning'}
                                    detail={health.checks.ai === 'ok' ? 'API key configured' : 'Key not set'}
                                />
                            </>
                        ) : (
                            <>
                                <StatusRow label="NextAuth" status="active" detail="JWT sessions, 30-day TTL" />
                                <StatusRow label="Supabase" status="active" detail="Database connected" />
                                <StatusRow label="Daily Pipeline" status="active" detail="Cron: 00:00 UTC daily" />
                                <StatusRow label="Rate Limiting" status="active" detail="In-memory, per-IP" />
                            </>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatPaise(paise: number): string {
    if (paise === 0) return '₹0';
    const rupees = paise / 100;
    if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
    if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
    return `₹${rupees.toLocaleString('en-IN')}`;
}

function formatPlanName(plan: string): string {
    const labels: Record<string, string> = {
        monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual',
        pro_monthly: 'Pro Monthly', pro_yearly: 'Pro Yearly',
        single_10q: 'Single (10Q)', single_25q: 'Single (25Q)',
        pack_5: 'Pack of 5', pack_10: 'Pack of 10',
    };
    return labels[plan] || plan;
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
