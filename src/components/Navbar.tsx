'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeProvider';
import { useLanguage } from '@/contexts/LanguageProvider';
import { Menu, X, Sun, Moon, BookOpen, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { language, toggleLanguage, t } = useLanguage();

    const links = [
        { href: '/', label: t('nav_home') },
        { href: '/syllabus', label: t('nav_syllabus') },
        { href: '/features', label: t('nav_features') },
        { href: '/current-affairs', label: 'Current Affairs' },
        { href: '/community', label: 'Community' },
        { href: '/blog', label: t('nav_blog') },
        { href: '/pricing', label: t('nav_pricing') },
        { href: '/about', label: t('nav_about') },
        { href: '/contact', label: 'Contact' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b"
            style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-800 to-accent-500 flex items-center justify-center shadow-lg group-hover:shadow-accent-500/30 transition-shadow">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <span className="font-heading font-bold text-lg gradient-text leading-tight block">
                                {t('site_name')}
                            </span>
                            <span className="text-[10px] font-medium leading-none block" style={{ color: 'var(--text-muted)' }}>
                                CSE SelfStudy Hub
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map((link) => (
                            <Link key={link.href} href={link.href}
                                className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  hover:bg-primary-800/10 dark:hover:bg-primary-400/10"
                                style={{ color: 'var(--text-secondary)' }}>
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button onClick={toggleLanguage}
                            className="p-2 rounded-lg transition-all duration-200 hover:bg-primary-800/10 dark:hover:bg-primary-400/10"
                            title={language === 'en' ? 'Switch to Tamil' : 'Switch to English'}
                            style={{ color: 'var(--text-secondary)' }}>
                            <Globe className="w-5 h-5" />
                            <span className="sr-only">{t('language_toggle')}</span>
                        </button>

                        <button onClick={toggleTheme}
                            className="p-2 rounded-lg transition-all duration-200 hover:bg-primary-800/10 dark:hover:bg-primary-400/10"
                            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                            style={{ color: 'var(--text-secondary)' }}>
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>

                        <Link href="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 btn-outline text-sm !px-3 !py-2 mr-1"
                            style={{ fontSize: '13px' }}>
                            Dashboard
                        </Link>
                        <Link href="/login" className="hidden sm:inline-flex btn-accent text-sm !px-4 !py-2">
                            {t('nav_signup')}
                        </Link>

                        {/* Mobile Menu Toggle */}
                        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-lg"
                            style={{ color: 'var(--text-primary)' }}>
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t overflow-hidden"
                        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                        <div className="px-4 py-4 space-y-1">
                            {links.map((link) => (
                                <Link key={link.href} href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="block px-4 py-3 rounded-lg text-base font-medium transition-all
                    hover:bg-primary-800/10 dark:hover:bg-primary-400/10"
                                    style={{ color: 'var(--text-primary)' }}>
                                    {link.label}
                                </Link>
                            ))}
                            <Link href="/pricing" onClick={() => setIsOpen(false)}
                                className="block text-center btn-accent mt-3 text-sm">
                                {t('nav_signup')}
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
