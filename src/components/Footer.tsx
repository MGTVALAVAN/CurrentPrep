'use client';
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageProvider';
import { BookOpen, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
    const { t } = useLanguage();

    const quickLinks = [
        { href: '/', label: t('nav_home') },
        { href: '/syllabus', label: t('nav_syllabus') },
        { href: '/features', label: t('nav_features') },
        { href: '/pricing', label: t('nav_pricing') },
        { href: '/dashboard', label: 'Dashboard' },
    ];

    const resources = [
        { href: '/blog', label: t('nav_blog'), external: false },
        { href: '/current-affairs', label: 'Current Affairs', external: false },
        { href: '/community', label: 'Community', external: false },
        { href: '/about', label: t('nav_about'), external: false },
        { href: '/contact', label: 'Contact', external: false },
        { href: 'https://ncert.nic.in', label: 'NCERT Portal', external: true },
        { href: 'https://upsc.gov.in', label: 'UPSC Official', external: true },
    ];

    return (
        <footer className="border-t" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="bg-[#E3120B] p-1.5 md:p-2 rounded-xl flex shrink min-w-0 items-center justify-center gap-2 transition-transform group-hover:scale-[1.02] shadow-sm">
                                <img
                                    src="/images/logo_globe.png?v=2"
                                    alt="Globe Icon"
                                    className="h-6 md:h-8 w-auto object-contain drop-shadow-sm shrink-0"
                                />
                                <div className="bg-white px-2 py-1 md:py-1.5 rounded-lg shadow-sm flex items-center justify-center shrink min-w-0">
                                    <img
                                        src="/images/logo_text.png?v=2"
                                        alt="Current IAS Prep"
                                        className="h-4 md:h-6 w-auto object-contain shrink min-w-0"
                                    />
                                </div>
                            </div>
                        </Link>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {t('footer_tagline')}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
                            {t('footer_quick_links')}
                        </h3>
                        <ul className="space-y-2">
                            {quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href}
                                        className="text-sm transition-colors hover:text-accent-500"
                                        style={{ color: 'var(--text-secondary)' }}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
                            {t('footer_resources')}
                        </h3>
                        <ul className="space-y-2">
                            {resources.map((link) => (
                                <li key={link.href}>
                                    {link.external ? (
                                        <a href={link.href} target="_blank" rel="noopener noreferrer"
                                            className="text-sm transition-colors hover:text-accent-500"
                                            style={{ color: 'var(--text-secondary)' }}>
                                            {link.label} ↗
                                        </a>
                                    ) : (
                                        <Link href={link.href}
                                            className="text-sm transition-colors hover:text-accent-500"
                                            style={{ color: 'var(--text-secondary)' }}>
                                            {link.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
                            {t('footer_contact')}
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                <Mail className="w-4 h-4 text-accent-500 flex-shrink-0" />
                                <span>hello@currentprep.in</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                <MapPin className="w-4 h-4 text-accent-500 flex-shrink-0" />
                                <span>Chennai, Tamil Nadu, India</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                <Phone className="w-4 h-4 text-accent-500 flex-shrink-0" />
                                <span>+91 98765 43210</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
                    style={{ borderColor: 'var(--border-color)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {t('footer_rights')}
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                            🇮🇳 Made in India
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
