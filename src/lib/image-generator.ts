/**
 * CurrentPrep AI Image Generator
 * Uses Gemini API to generate relevant images for news articles.
 * Images are saved to public/images/generated/{date}/ and served statically.
 */

import fs from 'fs';
import path from 'path';

const GENERATED_DIR = path.join(process.cwd(), 'public', 'images', 'generated');

interface GenerateImageOptions {
    articleId: string;
    headline: string;
    category: string;
    imageDescription: string;
    date: string;
}

/**
 * Generate an image for an article using Gemini API
 * Returns the public URL path if successful, null if failed
 */
export async function generateArticleImage(
    apiKey: string,
    options: GenerateImageOptions
): Promise<string | null> {
    const { articleId, headline, category, imageDescription, date } = options;

    // Create date directory
    const dateDir = path.join(GENERATED_DIR, date);
    if (!fs.existsSync(dateDir)) {
        fs.mkdirSync(dateDir, { recursive: true });
    }

    // Check if image already exists
    const filename = `${sanitizeFilename(articleId)}.jpg`;
    const filepath = path.join(dateDir, filename);
    const publicUrl = `/images/generated/${date}/${filename}`;

    if (fs.existsSync(filepath)) {
        return publicUrl; // Already generated
    }

    // Build a descriptive prompt for image generation
    const prompt = buildImagePrompt(headline, category, imageDescription);

    try {
        const imageData = await callGeminiImageAPI(apiKey, prompt);
        if (imageData) {
            // Save the image
            const buffer = Buffer.from(imageData, 'base64');
            fs.writeFileSync(filepath, buffer);
            console.log(`[ImageGen] ✓ Generated: ${filename} (${buffer.length} bytes)`);
            return publicUrl;
        }
    } catch (error: any) {
        console.error(`[ImageGen] ✗ Failed for "${headline}": ${error.message}`);
    }

    return null;
}

/**
 * Build a clear, descriptive prompt for news image generation
 */
function buildImagePrompt(headline: string, category: string, imageDescription: string): string {
    const desc = imageDescription || headline;

    return `Generate a professional, photojournalistic-style image for a newspaper article.

Topic: ${headline}
Category: ${category}
Visual description: ${desc}

Requirements:
- Photorealistic style, like a newspaper/news agency photo
- Indian context (India-specific landmarks, people, settings where relevant)
- No text, watermarks, or logos in the image
- Professional composition, well-lit
- 16:9 landscape aspect ratio
- High quality, editorial/journalistic tone
- Appropriate and dignified representation`;
}

/**
 * Call Gemini API for image generation
 * Uses gemini-2.0-flash-exp or imagen-3.0-generate-002
 */
async function callGeminiImageAPI(apiKey: string, prompt: string): Promise<string | null> {
    // Models that support image generation (in priority order)
    const models = [
        'gemini-2.0-flash-exp-image-generation',
        'gemini-2.5-flash-image',
        'gemini-3.1-flash-image-preview',
    ];

    for (const model of models) {
        // Retry up to 3 times for rate limit (429) errors
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: prompt }],
                            }],
                            generationConfig: {
                                // Note: must include both 'Text' and 'Image' for the exp-image-generation model
                                responseModalities: ['Text', 'Image'],
                            },
                        }),
                    }
                );

                if (response.status === 429) {
                    // Rate limited — wait with exponential backoff
                    const waitMs = (attempt + 1) * 5000;
                    console.log(`[ImageGen] Model ${model}: rate limited (429), waiting ${waitMs / 1000}s (attempt ${attempt + 1}/3)...`);
                    await new Promise(r => setTimeout(r, waitMs));
                    continue;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    console.log(`[ImageGen] Model ${model} returned ${response.status}: ${errorText.slice(0, 200)}`);
                    break; // Try next model
                }

                const data = await response.json();

                // Extract image data from response
                const candidates = data.candidates || [];
                for (const candidate of candidates) {
                    const parts = candidate.content?.parts || [];
                    for (const part of parts) {
                        if (part.inlineData?.data) {
                            return part.inlineData.data; // base64 image data
                        }
                    }
                }

                console.log(`[ImageGen] Model ${model}: no image in response`);
                break; // Try next model
            } catch (err: any) {
                console.log(`[ImageGen] Model ${model} error: ${err.message}`);
                break;
            }
        }
    }

    // Fallback: try Imagen 4.0
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt }],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: '16:9',
                    },
                }),
            }
        );

        if (response.ok) {
            const data = await response.json();
            const predictions = data.predictions || [];
            if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
                return predictions[0].bytesBase64Encoded;
            }
        }
    } catch (err: any) {
        console.log(`[ImageGen] Imagen fallback error: ${err.message}`);
    }

    return null;
}

/**
 * Generate images for multiple articles (batch)
 * Returns a map of articleId → image URL
 */
export async function generateArticleImages(
    apiKey: string,
    articles: Array<{
        id: string;
        headline: string;
        category: string;
        imageDescription: string;
        date: string;
    }>,
    maxConcurrent: number = 2,
    delayMs: number = 1500
): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    console.log(`[ImageGen] Generating images for ${articles.length} articles...`);

    // Process in batches to respect rate limits
    for (let i = 0; i < articles.length; i += maxConcurrent) {
        const batch = articles.slice(i, i + maxConcurrent);
        const promises = batch.map(async (article) => {
            const url = await generateArticleImage(apiKey, {
                articleId: article.id,
                headline: article.headline,
                category: article.category,
                imageDescription: article.imageDescription,
                date: article.date,
            });
            if (url) {
                results[article.id] = url;
            }
        });

        await Promise.all(promises);

        // Rate limit delay
        if (i + maxConcurrent < articles.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    console.log(`[ImageGen] ✅ Generated ${Object.keys(results).length}/${articles.length} images`);
    return results;
}

/**
 * Get the generated image URL for an article (if it exists)
 */
export function getGeneratedImageUrl(articleId: string, date: string): string | null {
    const filename = `${sanitizeFilename(articleId)}.jpg`;
    const filepath = path.join(GENERATED_DIR, date, filename);

    if (fs.existsSync(filepath)) {
        return `/images/generated/${date}/${filename}`;
    }
    return null;
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
