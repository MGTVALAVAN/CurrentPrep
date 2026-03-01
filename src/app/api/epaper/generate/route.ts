/**
 * API Route: POST /api/epaper/generate
 *
 * Triggers the full ePaper generation pipeline:
 *  1. Scrape all ePaper sources (RSS)
 *  2. AI processing (Gemini) — 200-300 word explainers per article
 *  3. Save structured JSON to data store
 *  4. Auto-fetch relevant images (Pexels / Gemini)
 *
 * Auth: Cron calls require CRON_SECRET; UI calls with ?force=true are allowed.
 * Designed to be called by:
 *  - GitHub Actions at 8:00 AM IST (02:30 UTC)
 *  - Vercel Cron
 *  - Manual trigger from admin/UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeEpaperSources } from '@/lib/epaper-scraper';
import { generateDailyEpaper } from '@/lib/epaper-generator';
import { saveEpaper, loadEpaper } from '@/lib/epaper-store';
import { fetchArticleImages } from '@/lib/image-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // ePaper generation can take longer

export async function POST(request: NextRequest) {
    try {
        const forceUpdate = request.nextUrl.searchParams.get('force') === 'true';

        // --- Auth check (skip for UI-triggered force generation) ---
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && !forceUpdate && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
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

        // --- Step 4: Auto-fetch relevant images (non-blocking) ---
        const pexelsKey = process.env.PEXELS_API_KEY;
        if (pexelsKey || geminiApiKey) {
            const articlesToProcess = epaperData.articles.map((a: any) => ({
                articleId: a.id,
                headline: a.headline,
                category: a.category,
                imageDescription: a.imageDescription || '',
                date: epaperData.date,
                tags: a.tags || [],
            }));

            // Fire and forget — don't block the response
            fetchArticleImages(articlesToProcess, pexelsKey, geminiApiKey, 1500)
                .then(results => {
                    console.log(`[epaper-api] 🖼️ Fetched ${Object.keys(results).length} images`);
                })
                .catch(err => {
                    console.error('[epaper-api] Image fetch error:', err.message);
                });
        }

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
