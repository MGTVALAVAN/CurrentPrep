'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[App Error]', error);
        // Report to Sentry when configured:
        // if ((window as any).Sentry) {
        //     (window as any).Sentry.captureException(error);
        // }
    }, [error]);

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
            <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Something went wrong
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                    We encountered an unexpected error. The issue has been logged and we&apos;re working on it.
                </p>
                {process.env.NODE_ENV === 'development' && (
                    <pre className="text-xs text-left p-4 rounded-lg mb-6 overflow-auto max-h-40"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                        {error.message}
                    </pre>
                )}
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-primary-800 to-primary-600 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    <a
                        href="/"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </a>
                </div>
            </div>
        </div>
    );
}
