import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Feedback — Get Free Pro Access | CurrentPrep',
    description:
        'Share your feedback on CurrentPrep and get 12 months of Pro access absolutely free. First 250 users only.',
};

export default function FeedbackLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
