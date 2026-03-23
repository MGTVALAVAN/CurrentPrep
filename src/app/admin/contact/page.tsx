'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Inbox, Shield, Loader2, Mail, Clock, Check,
    Archive, BarChart3, Users, FileText,
    ChevronLeft, ChevronRight, Eye,
} from 'lucide-react';
import '../admin.css';

type ContactStatus = 'new' | 'read' | 'replied' | 'archived';

interface Message {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: ContactStatus;
    created_at: string;
}

export default function AdminContactPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const limit = 15;

    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            router.replace('/login?callbackUrl=/admin/contact');
        }
        if (authStatus === 'authenticated' && (session?.user as any)?.role !== 'admin') {
            router.replace('/dashboard');
        }
    }, [authStatus, session, router]);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
            });
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const res = await fetch(`/api/admin/contact?${params}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.submissions);
                setTotal(data.total);
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        if (authStatus === 'authenticated' && (session?.user as any)?.role === 'admin') {
            fetchMessages();
        }
    }, [authStatus, session, fetchMessages]);

    async function updateStatus(id: string, newStatus: ContactStatus) {
        try {
            await fetch('/api/admin/contact', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus }),
            });
            fetchMessages();
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    }

    const totalPages = Math.ceil(total / limit);
    const statusIcons: Record<string, React.ReactNode> = {
        new: <Mail size={12} />,
        read: <Eye size={12} />,
        replied: <Check size={12} />,
        archived: <Archive size={12} />,
    };

    if (authStatus === 'loading') {
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
                    <Link href="/admin/content" className="admin-nav-item">
                        <FileText size={16} /><span>Content</span>
                    </Link>
                    <Link href="/admin/contact" className="admin-nav-item active">
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
                        <h1>Contact Messages</h1>
                        <p>{total} total messages</p>
                    </div>
                </header>

                {/* ── Filters ──────────────────────────── */}
                <div className="admin-toolbar">
                    {['all', 'new', 'read', 'replied', 'archived'].map(s => (
                        <button
                            key={s}
                            className={`admin-filter-btn ${statusFilter === s ? 'active' : ''}`}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                        >
                            {s === 'all' ? '📋 All' : <>{statusIcons[s]} {s.charAt(0).toUpperCase() + s.slice(1)}</>}
                        </button>
                    ))}
                </div>

                {/* ── Messages ──────────────────────────── */}
                {loading ? (
                    <div className="admin-loading" style={{ minHeight: 200 }}>
                        <Loader2 className="animate-spin" size={24} />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="admin-empty">
                        <Inbox size={32} />
                        <p>No messages found</p>
                    </div>
                ) : (
                    <div>
                        {messages.map(msg => (
                            <div key={msg.id} className={`admin-message-card ${msg.status === 'new' ? 'unread' : ''}`}>
                                <div className="admin-message-header">
                                    <span className="admin-message-from">{msg.name}</span>
                                    <span className="admin-message-date">
                                        <Clock size={10} style={{ display: 'inline', marginRight: 4 }} />
                                        {new Date(msg.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                                <div className="admin-message-subject">{msg.subject}</div>
                                <div className="admin-message-body">{msg.message}</div>
                                <div className="admin-message-meta">
                                    <span>📧 {msg.email}</span>
                                    <span>·</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {statusIcons[msg.status]} {msg.status}
                                    </span>
                                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                                        {msg.status === 'new' && (
                                            <button className="admin-filter-btn" onClick={() => updateStatus(msg.id, 'read')}>
                                                Mark Read
                                            </button>
                                        )}
                                        {msg.status !== 'archived' && (
                                            <button className="admin-filter-btn" onClick={() => updateStatus(msg.id, 'archived')}>
                                                Archive
                                            </button>
                                        )}
                                    </span>
                                </div>
                            </div>
                        ))}
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
