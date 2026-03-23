import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Page Not Found',
};

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
            <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                    <FileQuestion className="w-10 h-10 text-primary-500" />
                </div>
                <h1 className="text-6xl font-heading font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
                    404
                </h1>
                <h2 className="text-xl font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Page Not Found
                </h2>
                <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    Let&apos;s get you back on track with your UPSC preparation.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-primary-800 to-primary-600 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </Link>
                    <Link
                        href="/current-affairs"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Current Affairs
                    </Link>
                </div>
            </div>
        </div>
    );
}
