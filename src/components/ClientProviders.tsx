'use client';
import React, { useEffect } from 'react';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { LanguageProvider } from '@/contexts/LanguageProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Service worker registration failed silently
            });
        }
    }, []);

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
