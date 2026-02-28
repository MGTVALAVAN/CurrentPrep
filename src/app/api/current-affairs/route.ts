/**
 * API Route: GET /api/current-affairs
 *
 * Returns current affairs articles.
 * Query params:
 *  - date: specific date (YYYY-MM-DD), defaults to latest
 *  - days: number of days to fetch (1-30), defaults to 7
 *  - category: filter by UPSC category
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadDailyArticles, loadRecentArticles, loadLatestArticles, getAvailableDates } from '@/lib/current-affairs-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const days = parseInt(searchParams.get('days') || '7', 10);
        const category = searchParams.get('category');

        if (date) {
            // Return articles for a specific date
            const data = loadDailyArticles(date);
            if (!data) {
                return NextResponse.json(
                    { error: `No articles found for date: ${date}` },
                    { status: 404 }
                );
            }

            let articles = data.articles;
            if (category && category !== 'all') {
                articles = articles.filter((a) => a.category === category);
            }

            return NextResponse.json({
                ...data,
                articles,
            });
        }

        // Return recent articles
        const clampedDays = Math.max(1, Math.min(30, days));
        let articles = loadRecentArticles(clampedDays);

        if (category && category !== 'all') {
            articles = articles.filter((a) => a.category === category);
        }

        const latest = loadLatestArticles();

        return NextResponse.json({
            date: latest?.date || new Date().toISOString().split('T')[0],
            lastUpdated: latest?.lastUpdated || null,
            articles,
            availableDates: getAvailableDates(),
            sources: ['The Hindu', 'Indian Express', 'News on AIR'],
            totalArticles: articles.length,
        });
    } catch (err: any) {
        console.error('[api/current-affairs] Error:', err.message);
        return NextResponse.json(
            { error: 'Failed to load current affairs' },
            { status: 500 }
        );
    }
}
