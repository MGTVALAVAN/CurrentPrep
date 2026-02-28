'use client';
import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { LanguageProvider } from '@/contexts/LanguageProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPrintPage = pathname.includes('/print/');

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Service worker registration failed silently
            });
        }
    }, []);

    // Print pages get a completely clean layout — no navbar, no footer
    if (isPrintPage) {
        return (
            <ThemeProvider>
                <LanguageProvider>
                    {children}
                </LanguageProvider>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <LanguageProvider>
                <Navbar />
                <main className="flex-1 pt-16">{children}</main>
                <Footer />
            </LanguageProvider>
        </ThemeProvider>
    );
}
