import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'CurrentPrep Daily ePaper — Download PDF',
    description: 'A4 printable PDF version of CurrentPrep UPSC Daily ePaper',
};

export default function PrintLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ margin: 0, padding: 0, background: '#FFF1E5', minHeight: '100vh' }}>
            {children}
        </div>
    );
}
