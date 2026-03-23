import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Current Affairs — Daily UPSC Digest',
    description: 'Stay updated with daily current affairs for UPSC CSE. Categorized by GS papers, with explainers, key terms, and exam-relevant analysis.',
    openGraph: {
        title: 'Current Affairs — CurrentPrep',
        description: 'Daily UPSC current affairs categorized by GS papers with analysis.',
    },
};

export default function CurrentAffairsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
