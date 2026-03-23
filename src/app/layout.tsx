import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';

// ── Font Loading (replaces CSS @import — Issue 4.4) ──────────────────
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
    weight: ['300', '400', '500', '600', '700', '800'],
});

const outfit = Outfit({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-outfit',
    weight: ['400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: '#1E3A8A',
};

export const metadata: Metadata = {
    title: 'CurrentPrep – Where Aspirants Become Achievers | Free UPSC CSE Resources',
    description: 'Current IAS Prep (CSE SelfStudy Hub) – Free UPSC CSE self-study resources: NCERT summaries, AI quiz generator, progress tracker, and community forum. Self-paced IAS preparation.',
    keywords: 'Current IAS Prep, free UPSC coaching, CSE syllabus resources, self-study IAS preparation, NCERT summaries, UPSC prelims mains, civil services exam free resources',
    authors: [{ name: 'Current IAS Prep' }],
    openGraph: {
        title: 'Current IAS Prep – Where Aspirants Become Achievers',
        description: 'Your complete self-study companion for UPSC CSE. NCERT summaries, AI tools, community – 100% free.',
        type: 'website',
        locale: 'en_IN',
        siteName: 'Current IAS Prep',
    },
    manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
            <head>
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="Current IAS Prep" />
                <meta name="mobile-web-app-capable" content="yes" />
                <link rel="apple-touch-icon" href="/icons/icon-192.png" />
            </head>
            <body className="antialiased min-h-screen flex flex-col">
                <ClientProviders>{children}</ClientProviders>
            </body>
        </html>
    );
}
