'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    CreditCard, Shield, Loader2, BarChart3, Users, FileText, Inbox,
    ChevronLeft, ChevronRight, IndianRupee, CheckCircle2, XCircle, Timer,
    Download,
} from 'lucide-react';
import '../admin.css';

interface Transaction {
    id: string;
    userName: string;
    userEmail: string;
    plan: string;
    amount: number;
    status: string;
    receipt: string;
    orderId: string;
    date: string;
}

interface PaymentData {
    summary: {
        totalRevenue: number;
        totalPaid: number;
        totalFailed: number;
        totalPending: number;
        avgOrderValue: number;
    };
    byPlan: Array<{ plan: string; count: number; revenue: number }>;
    recent: Transaction[];
    total: number;
    page: number;
    limit: number;
}

const PLAN_LABELS: Record<string, string> = {
    monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual',
    pro_monthly: 'Pro Monthly', pro_yearly: 'Pro Yearly',
    single_10q: 'Single (10Q)', single_25q: 'Single (25Q)',
    pack_5: 'Pack of 5', pack_10: 'Pack of 10',
};

function formatPaise(paise: number): string {
    if (paise === 0) return '₹0';
    const rupees = paise / 100;
    if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
    if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
    return `₹${rupees.toLocaleString('en-IN')}`;
}

export default function AdminPaymentsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [data, setData] = useState<PaymentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const limit = 20;

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/admin/login');
        }
        if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') {
            router.replace('/dashboard');
        }
    }, [status, session, router]);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
            });
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const res = await fetch(`/api/admin/payments?${params}`, { cache: 'no-store' });
            if (res.ok) {
                setData(await res.json());
            }
        } catch (err) {
            console.error('Failed to fetch payments:', err);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        if (status === 'authenticated' && (session?.user as any)?.role === 'admin') {
            fetchPayments();
        }
    }, [status, session, fetchPayments]);

    const totalPages = data ? Math.ceil(data.total / limit) : 0;
    const s = data?.summary;

    if (status === 'loading') {
        return (
            <div className="admin-loading">
                <Loader2 className="animate-spin" size={28} />
                <p>Loading…</p>
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
                    <Link href="/admin/payments" className="admin-nav-item active">
                        <CreditCard size={16} /><span>Payments</span>
                    </Link>
                    <Link href="/admin/content" className="admin-nav-item">
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
                        <h1>Payment Management</h1>
                        <p>{data?.total ?? 0} total transactions</p>
                    </div>
                </header>

                {/* ── Revenue Summary ──────────────── */}
                <div className="admin-stats-grid">
                    <div className="admin-stat-card" style={{ borderTopColor: '#059669' }}>
                        <div className="admin-stat-icon" style={{ color: '#059669' }}><IndianRupee size={22} /></div>
                        <div className="admin-stat-value">{s ? formatPaise(s.totalRevenue) : '—'}</div>
                        <div className="admin-stat-label">Total Revenue</div>
                        <div className="admin-stat-sub">
                            Avg: {s ? formatPaise(s.avgOrderValue) : '—'}/order
                        </div>
                    </div>
                    <div className="admin-stat-card" style={{ borderTopColor: '#10b981' }}>
                        <div className="admin-stat-icon" style={{ color: '#10b981' }}><CheckCircle2 size={22} /></div>
                        <div className="admin-stat-value">{s?.totalPaid ?? '—'}</div>
                        <div className="admin-stat-label">Successful</div>
                        <div className="admin-stat-sub">Payments completed</div>
                    </div>
                    <div className="admin-stat-card" style={{ borderTopColor: '#ef4444' }}>
                        <div className="admin-stat-icon" style={{ color: '#ef4444' }}><XCircle size={22} /></div>
                        <div className="admin-stat-value">{s?.totalFailed ?? '—'}</div>
                        <div className="admin-stat-label">Failed</div>
                        <div className="admin-stat-sub">Need attention</div>
                    </div>
                    <div className="admin-stat-card" style={{ borderTopColor: '#f59e0b' }}>
                        <div className="admin-stat-icon" style={{ color: '#f59e0b' }}><Timer size={22} /></div>
                        <div className="admin-stat-value">{s?.totalPending ?? '—'}</div>
                        <div className="admin-stat-label">Pending</div>
                        <div className="admin-stat-sub">Awaiting payment</div>
                    </div>
                </div>

                {/* ── Revenue by Plan ──────────────── */}
                {data && data.byPlan.length > 0 && (
                    <section className="admin-section">
                        <h2><CreditCard size={18} /> Revenue by Plan</h2>
                        <div className="admin-plan-chips">
                            {data.byPlan.map(p => (
                                <div key={p.plan} className="admin-plan-chip">
                                    <span className="admin-plan-name">{PLAN_LABELS[p.plan] || p.plan}</span>
                                    <span className="admin-plan-revenue">{formatPaise(p.revenue)}</span>
                                    <span className="admin-plan-count">{p.count} sale{p.count !== 1 ? 's' : ''}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Filters ──────────────────────────── */}
                <div className="admin-toolbar">
                    {['all', 'paid', 'created', 'failed', 'refunded'].map(s => (
                        <button
                            key={s}
                            className={`admin-filter-btn ${statusFilter === s ? 'active' : ''}`}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                        >
                            {s === 'all' ? '📋 All' : s === 'paid' ? '✅ Paid' : s === 'created' ? '⏳ Pending' : s === 'failed' ? '❌ Failed' : '↩️ Refunded'}
                        </button>
                    ))}
                </div>

                {/* ── Transactions Table ──────────────── */}
                {loading ? (
                    <div className="admin-loading" style={{ minHeight: 200 }}>
                        <Loader2 className="animate-spin" size={24} />
                    </div>
                ) : !data || data.recent.length === 0 ? (
                    <div className="admin-empty">
                        <CreditCard size={32} />
                        <p>No transactions found</p>
                    </div>
                ) : (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Plan</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recent.map(txn => (
                                    <tr key={txn.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--admin-ink)' }}>
                                                {txn.userName}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--admin-ink-3)' }}>
                                                {txn.userEmail}
                                            </div>
                                        </td>
                                        <td>{PLAN_LABELS[txn.plan] || txn.plan}</td>
                                        <td style={{ fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
                                            {formatPaise(txn.amount)}
                                        </td>
                                        <td>
                                            <span className={`admin-payment-status ${txn.status}`}>
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 11, color: 'var(--admin-ink-3)', fontFamily: 'monospace' }}>
                                            {txn.orderId ? txn.orderId.substring(0, 16) + '…' : '—'}
                                        </td>
                                        <td style={{ fontSize: 12 }}>
                                            {new Date(txn.date).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Pagination ──────────────────────── */}
                {totalPages > 1 && (
                    <div className="admin-pagination">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <span>Page {page} of {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
