/**
 * API Route: POST /api/current-affairs/update
 *
 * Triggers the full news scraping + AI categorization pipeline.
 * Protected by a secret key (CRON_SECRET in env).
 *
 * This endpoint is designed to be called by:
 *  1. A cron job service (e.g. cron-job.org, Vercel Cron, GitHub Actions)
 *  2. A local cron job via curl
 *  3. The admin UI manually
 *
 * Required headers:
 *  - Authorization: Bearer <CRON_SECRET>
 *
 * Environment variables needed:
 *  - GEMINI_API_KEY: Google Gemini API key
 *  - CRON_SECRET: Secret key for authenticating cron requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllSources } from '@/lib/news-scraper';
import { generateDailyCurrentAffairs } from '@/lib/news-categorizer';
import { saveDailyArticles, loadDailyArticles } from '@/lib/current-affairs-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for scraping + AI

export async function POST(request: NextRequest) {
    try {
        // --- Auth check ---
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // --- Check Gemini API key ---
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not configured in environment variables' },
                { status: 500 }
            );
        }

        // --- Check if already updated today ---
        const today = new Date().toISOString().split('T')[0];
        const existing = loadDailyArticles(today);
        const forceUpdate = request.nextUrl.searchParams.get('force') === 'true';

        if (existing && !forceUpdate) {
            return NextResponse.json({
                message: `Already updated for ${today}. Use ?force=true to re-run.`,
                date: today,
                articlesCount: existing.articles.length,
                lastUpdated: existing.lastUpdated,
            });
        }

        console.log(`[update] Starting daily current affairs update for ${today}…`);

        // --- Step 1: Scrape news ---
        const rawArticles = await scrapeAllSources();

        if (rawArticles.length === 0) {
            return NextResponse.json({
                message: 'No articles found from any source. RSS feeds may be unavailable.',
                date: today,
                articlesCount: 0,
            });
        }

        // --- Step 2: AI categorization ---
        const dailyData = await generateDailyCurrentAffairs(rawArticles, geminiApiKey);

        // --- Step 3: Save to data store ---
        saveDailyArticles(dailyData);

        console.log(`[update] ✅ Daily update complete: ${dailyData.articles.length} articles processed`);

        return NextResponse.json({
            message: `Successfully updated current affairs for ${today}`,
            date: today,
            totalScraped: dailyData.totalScraped,
            totalProcessed: dailyData.totalProcessed,
            lastUpdated: dailyData.lastUpdated,
            sources: dailyData.sources,
            articlesByCategory: dailyData.articles.reduce((acc, a) => {
                acc[a.category] = (acc[a.category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
        });
    } catch (err: any) {
        console.error('[update] Pipeline error:', err);
        return NextResponse.json(
            {
                error: 'Current affairs update failed',
                details: err.message,
            },
            { status: 500 }
        );
    }
}

// Also support GET for Vercel Cron Jobs (which sends GET requests)
export async function GET(request: NextRequest) {
    // Rewrite as POST
    return POST(request);
}
