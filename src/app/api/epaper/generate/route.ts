/**
 * API Route: POST /api/epaper/generate
 *
 * Triggers the full ePaper generation pipeline:
 *  1. Scrape all ePaper sources (RSS)
 *  2. AI processing (Gemini) — 200-300 word explainers per article
 *  3. Save structured JSON to data store
 *  4. Auto-fetch relevant images (Pexels / Gemini)
 *
 * Auth: ALL requests require CRON_SECRET in the Authorization header.
 *       Use ?force=true to regenerate an existing edition (still requires auth).
 *
 * Designed to be called by:
 *  - Vercel Cron
 *  - Admin console (with CRON_SECRET)
 *  - Manual trigger via curl (with CRON_SECRET)
 *
 * SECURITY FIX (Issue 1.3): Removed the ?force=true auth bypass.
 * Previously, anyone could trigger expensive Gemini API calls without auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeEpaperSources } from '@/lib/epaper-scraper';
import { generateDailyEpaper } from '@/lib/epaper-generator';
import { saveEpaper, loadEpaper } from '@/lib/epaper-store';
import { sendDailyEpaperEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // ePaper generation can take longer

export async function POST(request: NextRequest) {
    try {
        const forceUpdate = request.nextUrl.searchParams.get('force') === 'true';

        // --- Auth check: ALWAYS require CRON_SECRET (no bypasses) ---
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            console.error('[epaper-api] CRON_SECRET is not configured');
            return NextResponse.json(
                { error: 'Server misconfiguration: CRON_SECRET not set' },
                { status: 500 }
            );
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized. Provide valid CRON_SECRET in Authorization header.' },
                { status: 401 }
            );
        }

        // --- Check Gemini API key ---
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not configured' },
                { status: 500 }
            );
        }

        // --- Check if already generated today ---
        const today = new Date().toISOString().split('T')[0];
        const existing = loadEpaper(today);

        if (existing && !forceUpdate) {
            return NextResponse.json({
                message: `ePaper already generated for ${today}. Use ?force=true to regenerate.`,
                date: today,
                articlesCount: existing.articles.length,
                lastUpdated: existing.lastUpdated,
            });
        }

        console.log(`[epaper-api] Starting ePaper generation for ${today}…`);

        // --- Step 1: Scrape news ---
        const rawArticles = await scrapeEpaperSources();

        if (rawArticles.length === 0) {
            return NextResponse.json({
                message: 'No articles found from any source. RSS feeds may be unavailable.',
                date: today,
                articlesCount: 0,
            });
        }

        // --- Step 2: AI processing ---
        const epaperData = await generateDailyEpaper(rawArticles, geminiApiKey);

        // --- Step 3: Save ---
        saveEpaper(epaperData);

        console.log(
            `[epaper-api] ✅ ePaper generated: ${epaperData.articles.length} articles`
        );

        // --- Step 4: Email ---
        // Fire asynchronously to avoid blocking API response
        sendDailyEpaperEmail(today).catch(e => console.error("Email trigger failed:", e));

        return NextResponse.json({
            message: `Successfully generated ePaper for ${today}`,
            date: today,
            totalScraped: epaperData.totalScraped,
            totalProcessed: epaperData.totalProcessed,
            highlights: epaperData.highlights,
            lastUpdated: epaperData.lastUpdated,
            sources: epaperData.sources,
            articlesByGS: Object.fromEntries(
                Object.entries(epaperData.articlesByGS).map(([gs, arts]) => [
                    gs,
                    arts.length,
                ])
            ),
        });
    } catch (err: any) {
        console.error('[epaper-api] Pipeline error:', err);
        return NextResponse.json(
            {
                error: 'ePaper generation failed',
                details: err.message,
            },
            { status: 500 }
        );
    }
}

// Also support GET for Vercel Cron Jobs
export async function GET(request: NextRequest) {
    return POST(request);
}
