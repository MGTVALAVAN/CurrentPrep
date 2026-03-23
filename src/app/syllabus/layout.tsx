import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'UPSC CSE Syllabus — Complete Guide',
    description: 'Complete UPSC CSE syllabus for Prelims, Mains, and Interview. Subject-wise breakdown with PDF links, study resources, and preparation tips.',
    openGraph: {
        title: 'UPSC Syllabus — CurrentPrep',
        description: 'Full UPSC CSE syllabus with subject-wise breakdown and resources.',
    },
};

export default function SyllabusLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
