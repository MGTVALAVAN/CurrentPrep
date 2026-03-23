import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Daily Mock Tests — Prelims & Mains',
    description: 'Practice daily UPSC mock tests for Prelims (MCQ) and Mains (descriptive). AI-generated questions linked to current affairs with detailed explanations.',
    openGraph: {
        title: 'Daily Mock Tests — CurrentPrep',
        description: 'Daily UPSC mock tests for Prelims & Mains practice.',
    },
};

export default function MockLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
