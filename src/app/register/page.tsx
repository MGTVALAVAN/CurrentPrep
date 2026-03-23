'use client';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageProvider';
import {
    Mail, Lock, User, Eye, EyeOff, BookOpen, ArrowRight,
    CheckCircle2, AlertTriangle, Sparkles
} from 'lucide-react';

const benefits = [
    'Free NCERT summaries & study material',
    'AI-powered quiz generator',
    'Track your preparation progress',
    'Join community of UPSC aspirants',
    'Personalized study roadmap',
    'Daily current affairs updates',
];

export default function RegisterPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [name, setName] = useState(searchParams.get('name') || '');
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Client-side validation
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            // Call our registration API
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Registration failed. Please try again.');
                setIsLoading(false);
                return;
            }

            // Auto sign-in after successful registration
            const signInResult = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (signInResult?.ok) {
                router.push('/dashboard');
            } else {
                // Registration worked but auto-login failed — redirect to login
                router.push('/login');
            }
        } catch {
            setError('Something went wrong. Please try again.');
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = () => {
        signIn('google', { callbackUrl: '/dashboard' });
    };

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="hero-bg absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary-800/90 to-primary-900/95" />
                <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-accent-500/10 blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-primary-400/10 blur-3xl" />

                <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16 text-white">
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}>
                        <Link href="/" className="flex items-center gap-3 mb-10">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                <BookOpen className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <span className="font-heading font-bold text-2xl block leading-tight">{t('site_name')}</span>
                                <span className="text-xs text-primary-200/80 block">CSE SelfStudy Hub</span>
                            </div>
                        </Link>

                        <h1 className="font-heading text-4xl lg:text-5xl font-bold leading-tight mb-2">
                            Start Your<br />
                            <span className="text-accent-300">UPSC Journey</span>
                        </h1>
                        <p className="text-primary-300 text-sm mb-6 font-medium tracking-wide uppercase">
                            100% Free • No Credit Card Needed
                        </p>
                        <p className="text-primary-200 text-lg mb-10 max-w-md">
                            Join thousands of aspirants preparing smarter with AI-powered tools and curated free resources.
                        </p>

                        <ul className="space-y-4">
                            {benefits.map((benefit, i) => (
                                <motion.li key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className="flex items-center gap-3 text-primary-100">
                                    <CheckCircle2 className="w-5 h-5 text-accent-400 flex-shrink-0" />
                                    <span>{benefit}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md">

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-800 to-accent-500 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-heading font-bold text-lg gradient-text block leading-tight">{t('site_name')}</span>
                            <span className="text-[10px] font-medium block leading-none" style={{ color: 'var(--text-muted)' }}>CSE SelfStudy Hub</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="w-5 h-5 text-accent-500" />
                        <h2 className="font-heading text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            Create Account
                        </h2>
                    </div>
                    <p className="text-base mb-8" style={{ color: 'var(--text-secondary)' }}>
                        Start your UPSC preparation journey today — completely free.
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                        </div>
                    )}

                    {/* Google OAuth */}
                    <button
                        onClick={handleGoogleSignup}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md mb-6"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-card)' }}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign up with Google
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>or register with email</span>
                        <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                    </div>

                    {/* Registration Form */}
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="input-field !pl-11"
                                    required
                                    id="register-name"
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="input-field !pl-11"
                                    required
                                    id="register-email"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min 8 characters"
                                    className="input-field !pl-11 !pr-11"
                                    required
                                    minLength={8}
                                    id="register-password"
                                    autoComplete="new-password"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                                    style={{ color: 'var(--text-muted)' }}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter your password"
                                    className="input-field !pl-11"
                                    required
                                    minLength={8}
                                    id="register-confirm-password"
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading}
                            id="register-submit"
                            className="w-full btn-primary flex items-center justify-center gap-2 !py-3.5 text-base disabled:opacity-60">
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Create Free Account
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                            By creating an account, you agree to our{' '}
                            <Link href="/terms" className="text-accent-500 hover:underline">Terms</Link>
                            {' '}and{' '}
                            <Link href="/privacy-policy" className="text-accent-500 hover:underline">Privacy Policy</Link>.
                        </p>
                    </form>

                    <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Already have an account?{' '}
                        <Link href="/login"
                            className="font-semibold text-accent-500 hover:text-accent-600 transition-colors">
                            Sign In
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
