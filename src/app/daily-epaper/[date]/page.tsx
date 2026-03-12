import { Metadata } from 'next';
import { loadEpaper, getEpaperDates } from '@/lib/epaper-store';
import EpaperDateClient from './EpaperDateClient';

interface PageProps {
    params: { date: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { date } = params;
    const epaper = loadEpaper(date);

    return {
        title: epaper
            ? `UPSC Daily ePaper — ${epaper.dateFormatted} | Current IAS Prep`
            : `ePaper — ${date} | Current IAS Prep`,
        description: epaper
            ? `${epaper.articles.length} UPSC-relevant articles for ${epaper.dateFormatted}. GS-mapped current affairs with 200-300 word explainers.`
            : `Current IAS Prep Daily ePaper for ${date}.`,
    };
}

export async function generateStaticParams() {
    const dates = getEpaperDates(60);
    return dates.map((date) => ({ date }));
}

export default function EpaperDatePage({ params }: PageProps) {
    return <EpaperDateClient date={params.date} />;
}
