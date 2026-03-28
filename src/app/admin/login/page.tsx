'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './admin-login.css';

export default function AdminLoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // If already logged in as admin, redirect straight to admin dashboard
    useEffect(() => {
        if (status === 'authenticated') {
            const role = (session?.user as any)?.role;
            if (role === 'admin') {
                router.replace('/admin');
            } else {
                setError('Your account does not have admin privileges.');
            }
        }
    }, [status, session, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password) return;

        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email: email.trim(),
                password,
            });

            if (result?.error) {
                setError('Invalid admin credentials. Please try again.');
            } else {
                // Successful login — check role after session refresh
                // The useEffect above will handle the redirect
                router.refresh();
                // Small delay to allow session to update
                setTimeout(() => {
                    router.replace('/admin');
                }, 500);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (status === 'loading') {
        return (
            <div className="admin-login-loading">
                <Loader2 className="animate-spin" size={28} />
            </div>
        );
    }

    return (
        <div className="admin-login-page">
            <div className="admin-login-card">
                {/* Header */}
                <div className="admin-login-header">
                    <div className="admin-login-icon">
                        <Shield size={28} />
                    </div>
                    <h1>Admin Console</h1>
                    <p>CurrentPrep Administration</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="admin-login-error">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="admin-login-form">
                    <div className="admin-login-field">
                        <label htmlFor="admin-email">
                            <Mail size={14} />
                            Admin Email
                        </label>
                        <input
                            id="admin-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="admin@currentprep.in"
                            required
                            autoComplete="email"
                            autoFocus
                        />
                    </div>

                    <div className="admin-login-field">
                        <label htmlFor="admin-password">
                            <Lock size={14} />
                            Password
                        </label>
                        <div className="admin-login-password-wrap">
                            <input
                                id="admin-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter admin password"
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="admin-login-eye"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="admin-login-submit"
                        disabled={loading || !email || !password}
                    >
                        {loading ? (
                            <><Loader2 className="animate-spin" size={16} /> Authenticating…</>
                        ) : (
                            <><Lock size={16} /> Sign In to Admin</>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="admin-login-footer">
                    <p>This is a restricted area. Unauthorized access is prohibited.</p>
                </div>
            </div>
        </div>
    );
}
