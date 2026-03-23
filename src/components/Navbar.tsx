'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeProvider';
import { useLanguage } from '@/contexts/LanguageProvider';
import { Menu, X, Sun, Moon, BookOpen, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { language, toggleLanguage, t } = useLanguage();

    const links: { href: string; label: string }[] = [
        { href: '/', label: t('nav_home') },
        { href: '/current-affairs', label: 'Current Affairs' },
        { href: '/daily-mock', label: 'Daily Mock' },
        { href: '/mock-tests', label: 'Practice Mock Tests' },
        { href: '/pricing', label: t('nav_pricing') },
        { href: '/contact', label: 'Contact' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b"
            style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)' }}
            role="navigation"
            aria-label="Main navigation">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center group shrink min-w-0" aria-label="CurrentPrep Home">
                        <div className="bg-[#E3120B] p-1.5 md:p-2 rounded-xl flex shrink min-w-0 items-center justify-center gap-2 transition-transform group-hover:scale-[1.02] shadow-sm">
                            <Image
                                src="/images/logo_globe.png"
                                alt=""
                                width={32}
                                height={32}
                                className="h-6 md:h-8 w-auto object-contain drop-shadow-sm shrink-0"
                                priority
                            />
                            <div className="bg-white px-2 py-1 md:py-1.5 rounded-lg shadow-sm flex items-center justify-center shrink min-w-0">
                                <Image
                                    src="/images/logo_text.png"
                                    alt="CurrentPrep"
                                    width={80}
                                    height={24}
                                    className="h-4 md:h-6 w-auto object-contain shrink min-w-0"
                                    priority
                                />
                            </div>
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
                            aria-label={language === 'en' ? 'Switch to Tamil' : 'Switch to English'}
                            style={{ color: 'var(--text-secondary)' }}>
                            <Globe className="w-5 h-5" aria-hidden="true" />
                            <span className="sr-only">{t('language_toggle')}</span>
                        </button>


                        <button onClick={toggleTheme}
                            className="p-2 rounded-lg transition-all duration-200 hover:bg-primary-800/10 dark:hover:bg-primary-400/10"
                            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                            style={{ color: 'var(--text-secondary)' }}>
                            {theme === 'light' ? <Moon className="w-5 h-5" aria-hidden="true" /> : <Sun className="w-5 h-5" aria-hidden="true" />}
                        </button>

                        <Link href="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 btn-outline text-sm !px-3 !py-2 mr-1"
                            style={{ fontSize: '13px' }}>
                            Dashboard
                        </Link>
                        <Link href="/register" className="hidden sm:inline-flex btn-accent text-sm !px-4 !py-2">
                            {t('nav_signup')}
                        </Link>

                        {/* Mobile Menu Toggle */}
                        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-lg"
                            aria-label={isOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={isOpen}
                            aria-controls="mobile-nav"
                            style={{ color: 'var(--text-primary)' }}>
                            {isOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
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
                        id="mobile-nav"
                        className="md:hidden border-t overflow-hidden"
                        role="menu"
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
                            <Link href="/register" onClick={() => setIsOpen(false)}
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
