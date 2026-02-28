/**
 * CurrentPrep Article Image Fetcher
 * Uses Pexels API (free, 200 req/hr) to find relevant photos for articles.
 * 
 * Strategy:
 * 1. Extract keywords from article headline + imageDescription
 * 2. Search Pexels for relevant photos
 * 3. Download the best match and save locally
 * 4. Fall back to Gemini AI generation if Pexels fails
 */

import fs from 'fs';
import path from 'path';

const GENERATED_DIR = path.join(process.cwd(), 'public', 'images', 'generated');

interface ArticleImageOptions {
    articleId: string;
    headline: string;
    category: string;
    imageDescription: string;
    date: string;
    tags?: string[];
}

/**
 * Extract search keywords from article data
 */
function extractSearchQuery(options: ArticleImageOptions): string {
    const { headline, category, imageDescription, tags } = options;

    // Use imageDescription first (it's AI-crafted to be visual)
    if (imageDescription) {
        // Extract key nouns/phrases (remove generic words)
        const stopWords = new Set(['a', 'an', 'the', 'of', 'in', 'for', 'and', 'or', 'to', 'with',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'has', 'have', 'had',
            'its', 'it', 'that', 'this', 'their', 'from', 'on', 'at', 'by', 'as']);
        const words = imageDescription
            .replace(/[^a-zA-Z\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()));
        // Take first 4-5 meaningful words
        return words.slice(0, 5).join(' ');
    }

    // Fallback: extract from headline
    const headlineWords = headline
        .replace(/[^a-zA-Z\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3)
        .slice(0, 4);

    // Add category context
    const categoryMap: Record<string, string> = {
        polity: 'India parliament government',
        governance: 'India government administration',
        economy: 'India economy finance',
        ir: 'diplomacy international relations',
        environment: 'environment nature India',
        science: 'science technology India',
        social: 'India society education',
        security: 'India military defense',
        agriculture: 'India agriculture farming',
        history: 'India heritage culture',
        geography: 'India landscape geography',
        ethics: 'justice governance ethics',
        disaster: 'disaster relief rescue',
    };

    const context = categoryMap[category.toLowerCase()] || 'India';
    return [...headlineWords, ...context.split(' ').slice(0, 2)].join(' ');
}

/**
 * Search Pexels for a relevant photo and download it
 */
async function fetchFromPexels(
    pexelsKey: string,
    query: string,
    filepath: string
): Promise<boolean> {
    try {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodedQuery}&per_page=5&orientation=landscape`,
            {
                headers: { Authorization: pexelsKey },
            }
        );

        if (!response.ok) {
            console.log(`[ImageFetch] Pexels returned ${response.status}`);
            return false;
        }

        const data = await response.json();
        const photos = data.photos || [];

        if (photos.length === 0) {
            console.log(`[ImageFetch] No Pexels results for: ${query}`);
            return false;
        }

        // Take the first (most relevant) photo
        const photo = photos[0];
        const imageUrl = photo.src?.large || photo.src?.medium || photo.src?.original;

        if (!imageUrl) return false;

        // Download the image
        const imgResponse = await fetch(imageUrl);
        if (!imgResponse.ok) return false;

        const buffer = Buffer.from(await imgResponse.arrayBuffer());
        fs.writeFileSync(filepath, buffer);
        console.log(`[ImageFetch] ✓ Pexels: "${query}" → ${buffer.length} bytes (by ${photo.photographer})`);
        return true;
    } catch (err: any) {
        console.log(`[ImageFetch] Pexels error: ${err.message}`);
        return false;
    }
}

/**
 * Generate image using Gemini API as fallback
 */
async function fetchFromGemini(
    geminiKey: string,
    prompt: string,
    filepath: string
): Promise<boolean> {
    const models = [
        'gemini-2.0-flash-exp-image-generation',
        'gemini-2.5-flash-image',
        'gemini-3.1-flash-image-preview',
    ];

    const fullPrompt = `Generate a professional, photojournalistic-style newspaper photo.
${prompt}
Requirements: Photorealistic, Indian context where relevant, no text/watermarks, 16:9 landscape, editorial quality.`;

    for (const model of models) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: fullPrompt }] }],
                            generationConfig: { responseModalities: ['Text', 'Image'] },
                        }),
                    }
                );

                if (response.status === 429) {
                    const waitMs = (attempt + 1) * 5000;
                    console.log(`[ImageFetch] Gemini ${model}: rate limited, waiting ${waitMs / 1000}s...`);
                    await new Promise(r => setTimeout(r, waitMs));
                    continue;
                }

                if (!response.ok) {
                    console.log(`[ImageFetch] Gemini ${model}: ${response.status}`);
                    break;
                }

                const data = await response.json();
                for (const candidate of (data.candidates || [])) {
                    for (const part of (candidate.content?.parts || [])) {
                        if (part.inlineData?.data) {
                            const buffer = Buffer.from(part.inlineData.data, 'base64');
                            fs.writeFileSync(filepath, buffer);
                            console.log(`[ImageFetch] ✓ Gemini ${model}: ${buffer.length} bytes`);
                            return true;
                        }
                    }
                }
                break;
            } catch (err: any) {
                console.log(`[ImageFetch] Gemini ${model} error: ${err.message}`);
                break;
            }
        }
    }
    return false;
}

/**
 * Sanitize a string for use as a filename
 */
function sanitizeFilename(str: string): string {
    return (str || 'unnamed')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60);
}

/**
 * Fetch and save an image for a single article
 */
export async function fetchArticleImage(
    options: ArticleImageOptions,
    pexelsKey?: string,
    geminiKey?: string
): Promise<string | null> {
    const dateDir = path.join(GENERATED_DIR, options.date);
    if (!fs.existsSync(dateDir)) {
        fs.mkdirSync(dateDir, { recursive: true });
    }

    const filename = `${sanitizeFilename(options.articleId)}.jpg`;
    const filepath = path.join(dateDir, filename);
    const publicUrl = `/images/generated/${options.date}/${filename}`;

    // Already exists?
    if (fs.existsSync(filepath)) {
        return publicUrl;
    }

    const query = extractSearchQuery(options);

    // Priority 1: Pexels (free, reliable, relevant)
    if (pexelsKey) {
        const ok = await fetchFromPexels(pexelsKey, query, filepath);
        if (ok) return publicUrl;

        // Try a simpler query (just category + India)
        const simpleQuery = `${options.category} India`;
        const ok2 = await fetchFromPexels(pexelsKey, simpleQuery, filepath);
        if (ok2) return publicUrl;
    }

    // Priority 2: Gemini AI generation
    if (geminiKey) {
        const prompt = options.imageDescription || options.headline;
        const ok = await fetchFromGemini(geminiKey, prompt, filepath);
        if (ok) return publicUrl;
    }

    return null;
}

/**
 * Fetch images for all articles (batch)
 */
export async function fetchArticleImages(
    articles: ArticleImageOptions[],
    pexelsKey?: string,
    geminiKey?: string,
    delayMs: number = 1000
): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    console.log(`[ImageFetch] Processing ${articles.length} articles...`);

    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const url = await fetchArticleImage(article, pexelsKey, geminiKey);
        if (url) {
            results[article.articleId] = url;
        }

        // Rate limit delay
        if (i < articles.length - 1) {
            await new Promise(r => setTimeout(r, delayMs));
        }
    }

    console.log(`[ImageFetch] ✅ Got ${Object.keys(results).length}/${articles.length} images`);
    return results;
}

/**
 * Check if a generated image exists for an article
 */
export function getGeneratedImageUrl(articleId: string, date: string): string | null {
    const filename = `${sanitizeFilename(articleId)}.jpg`;
    const filepath = path.join(GENERATED_DIR, date, filename);

    if (fs.existsSync(filepath)) {
        return `/images/generated/${date}/${filename}`;
    }
    return null;
}
