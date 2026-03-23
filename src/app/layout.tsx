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
    metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://currentprep.vercel.app'),
    title: {
        default: 'CurrentPrep – Where Aspirants Become Achievers | Free UPSC CSE Resources',
        template: '%s | CurrentPrep',
    },
    description: 'Current IAS Prep (CSE SelfStudy Hub) – Free UPSC CSE self-study resources: NCERT summaries, AI quiz generator, daily ePaper, mock tests, and community forum.',
    keywords: 'Current IAS Prep, free UPSC coaching, CSE syllabus resources, self-study IAS preparation, NCERT summaries, UPSC prelims mains, civil services exam free, daily current affairs, UPSC mock tests',
    authors: [{ name: 'CurrentPrep' }],
    creator: 'CurrentPrep',
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
    },
    openGraph: {
        title: 'CurrentPrep – Where Aspirants Become Achievers',
        description: 'Your complete self-study companion for UPSC CSE. Daily ePaper, AI quizzes, mock tests, current affairs – 100% free core.',
        type: 'website',
        locale: 'en_IN',
        siteName: 'CurrentPrep',
        images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'CurrentPrep – UPSC CSE Preparation' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'CurrentPrep – Free UPSC CSE Resources',
        description: 'Daily ePaper, AI quizzes, mock tests, and more for UPSC aspirants.',
        images: ['/images/og-image.png'],
    },
    manifest: '/manifest.json',
    alternates: {
        canonical: '/',
    },
};

// JSON-LD structured data for rich search results
const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Organization',
            name: 'CurrentPrep',
            url: process.env.NEXTAUTH_URL || 'https://currentprep.vercel.app',
            description: 'Free UPSC CSE preparation platform with AI-powered tools.',
            sameAs: [],
        },
        {
            '@type': 'WebSite',
            name: 'CurrentPrep',
            url: process.env.NEXTAUTH_URL || 'https://currentprep.vercel.app',
            potentialAction: {
                '@type': 'SearchAction',
                target: `${process.env.NEXTAUTH_URL || 'https://currentprep.vercel.app'}/current-affairs?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
            },
        },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
            <head>
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="CurrentPrep" />
                <meta name="mobile-web-app-capable" content="yes" />
                <link rel="apple-touch-icon" href="/icons/icon-192.png" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body className="antialiased min-h-screen flex flex-col">
                <ClientProviders>{children}</ClientProviders>
            </body>
        </html>
    );
}
