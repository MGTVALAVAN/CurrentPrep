import { Metadata } from 'next';
import { loadEpaper, loadLatestEpaper } from '@/lib/epaper-store';
import EpaperPrintView from './EpaperPrintView';

interface PageProps {
    params: { date: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { date } = params;
    return {
        title: `CurrentPrep Daily ePaper — ${date} (Print)`,
        description: `Printable A4 PDF version of CurrentPrep Daily ePaper for ${date}`,
    };
}

export default function EpaperPrintPage({ params }: PageProps) {
    return <EpaperPrintView date={params.date} />;
}
