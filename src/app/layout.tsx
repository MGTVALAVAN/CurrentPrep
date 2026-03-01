import type { Metadata, Viewport } from 'next';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: '#1E3A8A',
};

export const metadata: Metadata = {
    title: 'CurrentPrep – Where Aspirants Become Achievers | Free UPSC CSE Resources',
    description: 'CurrentPrep (CSE SelfStudy Hub) – Free UPSC CSE self-study resources: NCERT summaries, AI quiz generator, progress tracker, and community forum. Self-paced IAS preparation.',
    keywords: 'CurrentPrep, free UPSC coaching, CSE syllabus resources, self-study IAS preparation, NCERT summaries, UPSC prelims mains, civil services exam free resources',
    authors: [{ name: 'CurrentPrep' }],
    openGraph: {
        title: 'CurrentPrep – Where Aspirants Become Achievers',
        description: 'Your complete self-study companion for UPSC CSE. NCERT summaries, AI tools, community – 100% free.',
        type: 'website',
        locale: 'en_IN',
        siteName: 'CurrentPrep',
    },
    manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="CurrentPrep" />
                <meta name="mobile-web-app-capable" content="yes" />
                <link rel="apple-touch-icon" href="/icons/icon-192.png" />
            </head>
            <body className="antialiased min-h-screen flex flex-col">
                <ClientProviders>{children}</ClientProviders>
            </body>
        </html>
    );
}
