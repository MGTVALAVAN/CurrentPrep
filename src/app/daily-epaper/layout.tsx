import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Daily ePaper — UPSC Current Affairs',
    description: 'AI-generated daily ePaper with GS-mapped current affairs explainers for UPSC CSE. Prelims and Mains pointers, key terms, and source attribution.',
    openGraph: {
        title: 'Daily ePaper — CurrentPrep',
        description: 'AI-generated UPSC current affairs ePaper with prelims & mains pointers.',
    },
};

export default function EpaperLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
