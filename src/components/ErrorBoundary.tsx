/**
 * Global Error Boundary
 * 
 * Catches runtime errors in React components and displays
 * a friendly error page. In production, can report to Sentry.
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
        
        // Report to monitoring service (Sentry, etc.)
        // if (typeof window !== 'undefined' && (window as any).Sentry) {
        //     (window as any).Sentry.captureException(error, { extra: errorInfo });
        // }
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[60vh] flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                            Something went wrong
                        </h2>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="text-xs text-left p-4 rounded-lg mb-6 overflow-auto max-h-40"
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                                {this.state.error.message}
                            </pre>
                        )}
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-primary-800 to-primary-600 text-white shadow-lg hover:shadow-xl transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh Page
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

        return this.props.children;
    }
}
