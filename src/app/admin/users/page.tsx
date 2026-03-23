'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Users, Shield, Search, Loader2, ChevronLeft,
    ChevronRight, BarChart3, FileText, Inbox,
    UserCheck, Crown,
} from 'lucide-react';
import '../admin.css';

interface AdminUser {
    id: string;
    name: string | null;
    email: string;
    role: string;
    is_premium: boolean;
    created_at: string;
    updated_at: string;
}

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const limit = 20;

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/login?callbackUrl=/admin/users');
        }
        if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') {
            router.replace('/dashboard');
        }
    }, [status, session, router]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
            });
            if (search) params.set('search', search);
            if (roleFilter !== 'all') params.set('role', roleFilter);

            const res = await fetch(`/api/admin/users?${params}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setTotal(data.total);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter]);

    useEffect(() => {
        if (status === 'authenticated' && (session?.user as any)?.role === 'admin') {
            fetchUsers();
        }
    }, [status, session, fetchUsers]);

    const totalPages = Math.ceil(total / limit);

    async function updateUserRole(userId: string, newRole: string) {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole }),
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (err) {
            console.error('Failed to update role:', err);
        }
    }

    async function togglePremium(userId: string, isPremium: boolean) {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, is_premium: !isPremium }),
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (err) {
            console.error('Failed to toggle premium:', err);
        }
    }

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
                    <Link href="/admin/users" className="admin-nav-item active">
                        <Users size={16} /><span>Users</span>
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

            {/* ── Main Content ─────────────────────── */}
            <main className="admin-main">
                <header className="admin-header">
                    <div>
                        <h1>User Management</h1>
                        <p>{total} total users</p>
                    </div>
                </header>

                {/* ── Toolbar ──────────────────────────── */}
                <div className="admin-toolbar">
                    <input
                        type="text"
                        className="admin-search"
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                    {['all', 'admin', 'user'].map(r => (
                        <button
                            key={r}
                            className={`admin-filter-btn ${roleFilter === r ? 'active' : ''}`}
                            onClick={() => { setRoleFilter(r); setPage(1); }}
                        >
                            {r === 'all' ? 'All' : r === 'admin' ? '🛡️ Admins' : '👤 Users'}
                        </button>
                    ))}
                </div>

                {/* ── Table ────────────────────────────── */}
                {loading ? (
                    <div className="admin-loading" style={{ minHeight: 200 }}>
                        <Loader2 className="animate-spin" size={24} />
                    </div>
                ) : users.length === 0 ? (
                    <div className="admin-empty">
                        <Users size={32} />
                        <p>No users found</p>
                    </div>
                ) : (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Plan</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--admin-ink)' }}>
                                            {user.name || '—'}
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`admin-role-badge ${user.role}`}>
                                                {user.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                                            </span>
                                        </td>
                                        <td>
                                            {user.is_premium ? (
                                                <span className="admin-premium-badge">
                                                    <Crown size={10} style={{ display: 'inline', marginRight: 3 }} />
                                                    Premium
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--admin-ink-3)', fontSize: 12 }}>Free</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: 12 }}>
                                            {new Date(user.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    className="admin-filter-btn"
                                                    onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                                    title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                                                >
                                                    <UserCheck size={12} />
                                                </button>
                                                <button
                                                    className="admin-filter-btn"
                                                    onClick={() => togglePremium(user.id, user.is_premium)}
                                                    title={user.is_premium ? 'Remove premium' : 'Grant premium'}
                                                >
                                                    <Crown size={12} />
                                                </button>
                                            </div>
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
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <span>Page {page} of {totalPages}</span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
