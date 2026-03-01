/**
 * API Route: GET /api/epaper
 *
 * Returns ePaper data.
 * Query params:
 *  - date: specific date (YYYY-MM-DD), defaults to latest
 *  - gs: filter by GS paper (GS1, GS2, GS3, GS4)
 *  - category: filter by UPSC category
 *  - archive: if "true", returns list of available dates only
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    loadEpaper,
    loadLatestEpaper,
    getEpaperDates,
    getEpaperIndex,
} from '@/lib/epaper-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const gs = searchParams.get('gs');
        const category = searchParams.get('category');
        const archive = searchParams.get('archive');

        // Return archive list
        if (archive === 'true') {
            const dates = getEpaperDates(60);
            const index = getEpaperIndex();
            return NextResponse.json({
                dates,
                totalArticles: index?.totalArticles || 0,
                latestDate: index?.latestDate || null,
            }, { headers: NO_CACHE_HEADERS });
        }

        // Load specific date or latest
        let epaper = date ? loadEpaper(date) : loadLatestEpaper();

        if (!epaper) {
            return NextResponse.json(
                {
                    error: date
                        ? `No ePaper found for date: ${date}`
                        : 'No ePaper data available yet. Trigger generation first.',
                },
                { status: 404, headers: NO_CACHE_HEADERS }
            );
        }

        // Filter by GS paper
        if (gs && gs !== 'all') {
            epaper = {
                ...epaper,
                articles: epaper.articles.filter((a) => a.gsPaper === gs),
                articlesByGS: { [gs]: epaper.articlesByGS[gs] || [] },
            };
        }

        // Filter by category
        if (category && category !== 'all') {
            epaper = {
                ...epaper,
                articles: epaper.articles.filter(
                    (a) => a.category === category
                ),
            };
        }

        return NextResponse.json({
            ...epaper,
            availableDates: getEpaperDates(30),
        }, { headers: NO_CACHE_HEADERS });
    } catch (err: any) {
        console.error('[api/epaper] Error:', err.message);
        return NextResponse.json(
            { error: 'Failed to load ePaper data' },
            { status: 500, headers: NO_CACHE_HEADERS }
        );
    }
}
