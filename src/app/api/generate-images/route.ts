import { NextResponse } from 'next/server';
import { fetchArticleImages } from '@/lib/image-generator';
import { loadLatestEpaper } from '@/lib/epaper-store';

/**
 * POST /api/generate-images
 * Fetches relevant images for all articles in the latest ePaper.
 * Uses Pexels API (primary) + Gemini AI (fallback).
 * 
 * Set PEXELS_API_KEY in .env.local for Pexels (free at pexels.com/api/)
 * Set GEMINI_API_KEY for AI generation fallback
 */
export async function POST() {
    try {
        const pexelsKey = process.env.PEXELS_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;

        if (!pexelsKey && !geminiKey) {
            return NextResponse.json(
                { error: 'No image API configured. Set PEXELS_API_KEY (free at pexels.com/api/) or GEMINI_API_KEY in .env.local' },
                { status: 500 }
            );
        }

        // Get latest ePaper data
        const epaper = loadLatestEpaper();
        if (!epaper || !epaper.articles?.length) {
            return NextResponse.json(
                { error: 'No ePaper articles found. Generate ePaper first.' },
                { status: 404 }
            );
        }

        // Prepare articles for image fetching
        const articlesToProcess = epaper.articles.map((a: any) => ({
            articleId: a.id,
            headline: a.headline,
            category: a.category,
            imageDescription: a.imageDescription || '',
            date: epaper.date,
            tags: a.tags || [],
        }));

        // Fetch images (Pexels → Gemini fallback)
        const results = await fetchArticleImages(
            articlesToProcess,
            pexelsKey,
            geminiKey,
            1500 // 1.5s delay between requests
        );

        return NextResponse.json({
            success: true,
            date: epaper.date,
            total: articlesToProcess.length,
            generated: Object.keys(results).length,
            source: pexelsKey ? 'pexels' : 'gemini',
            images: results,
        });
    } catch (error: any) {
        console.error('[API generate-images] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Image generation failed' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/generate-images?date=YYYY-MM-DD
 * Returns the list of generated images for a given date
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    try {
        const fs = await import('fs');
        const path = await import('path');
        const dir = path.join(process.cwd(), 'public', 'images', 'generated', date);

        if (!fs.existsSync(dir)) {
            return NextResponse.json({ date, images: [], count: 0 });
        }

        const files = fs.readdirSync(dir).filter((f: string) => f.endsWith('.jpg') || f.endsWith('.png'));
        const images = files.map((f: string) => ({
            filename: f,
            url: `/images/generated/${date}/${f}`,
            articleId: f.replace(/\.(jpg|png)$/, ''),
        }));

        return NextResponse.json({
            date,
            images,
            count: images.length,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
