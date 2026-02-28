/**
 * News Categorizer — uses Google Gemini AI to process raw scraped articles
 * into UPSC-ready current affairs with:
 *  - UPSC category classification
 *  - 100-150 word summary
 *  - Prelims/Mains relevance
 *  - GS paper mapping
 *  - Importance tagging (high/medium/low)
 *  - Keyword tags
 *
 * Includes automatic retry with exponential backoff for rate limits,
 * and fallback to gemini-1.5-flash if gemini-2.0-flash quota is exhausted.
 */

import type { RawArticle } from './news-scraper';
import type { UPSCCategory } from './news-sources';

export interface ProcessedArticle {
    id: string;
    title: string;
    summary: string;
    category: UPSCCategory;
    date: string;
    source: string;
    sourceUrl: string;
    importance: 'high' | 'medium' | 'low';
    tags: string[];
    prelims: boolean;
    mains: boolean;
    gsRelevance: string[];
    section: string;
    processedAt: string;
}

export interface DailyCurrentAffairs {
    date: string;
    lastUpdated: string;
    articles: ProcessedArticle[];
    sources: string[];
    totalScraped: number;
    totalProcessed: number;
}

// ---------------------------------------------------------------------------
// Gemini AI Integration
// ---------------------------------------------------------------------------

const GEMINI_SYSTEM_PROMPT = `You are an expert UPSC Civil Services Exam current affairs compiler. You analyze news articles and produce concise, exam-focused summaries.

For each article provided, you must return a JSON object with:
1. "title": A clear, UPSC-relevant title (max 80 chars)
2. "summary": A 100-150 word summary focusing on:
   - What happened (facts)
   - Why it matters for UPSC
   - Key terms/concepts an aspirant should know
   - Link to static syllabus topics where applicable
3. "category": One of: polity, economy, ir, environment, science, social, history, geography, security, ethics
4. "importance": "high" (national policy, Supreme Court, budget, international summits), "medium" (government schemes, reports, bilateral relations), or "low" (minor updates)
5. "tags": Array of 3-5 keyword tags (e.g., ["Fiscal Policy", "Budget", "Taxation"])
6. "prelims": boolean — Is this relevant for Prelims MCQs?
7. "mains": boolean — Is this relevant for Mains answer writing?
8. "gsRelevance": Array of GS paper mappings (e.g., ["GS-II: Polity", "GS-III: Economy"])

IMPORTANT RULES:
- Skip sports news, entertainment, celebrity news, and crime/accident reports unless they have policy implications
- Focus on governance, policy, judiciary, economy, international relations, science, environment
- Keep summaries factual and exam-oriented — avoid opinions
- If an article is not UPSC-relevant, set "skip": true
- Return valid JSON only`;

interface GeminiArticleResult {
    title: string;
    summary: string;
    category: UPSCCategory;
    importance: 'high' | 'medium' | 'low';
    tags: string[];
    prelims: boolean;
    mains: boolean;
    gsRelevance: string[];
    skip?: boolean;
}

// Models to try, in order of preference
const GEMINI_MODELS = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
];

/**
 * Sleep utility with jitter for rate limiting
 */
function sleep(ms: number): Promise<void> {
    const jitter = Math.random() * 1000;
    return new Promise((resolve) => setTimeout(resolve, ms + jitter));
}

/**
 * Call Gemini API with automatic retry and model fallback.
 * - Retries up to 3 times per model with exponential backoff on 429 errors
 * - Falls back to alternative models if primary model quota is exhausted
 */
async function callGeminiAPI(
    articles: RawArticle[],
    apiKey: string
): Promise<GeminiArticleResult[]> {
    const articleTexts = articles
        .map(
            (a, i) =>
                `[Article ${i + 1}]
Title: ${a.title}
Source: ${a.source} — ${a.section}
Description: ${a.description}
Published: ${a.pubDate}`
        )
        .join('\n\n---\n\n');

    const userPrompt = `Analyze the following ${articles.length} news articles and return a JSON array of processed results. For each article that is NOT UPSC-relevant, set "skip": true. For relevant articles, provide the full analysis.

${articleTexts}

Return ONLY a JSON array (no markdown fence, no explanation). Each element should have: title, summary, category, importance, tags, prelims, mains, gsRelevance, skip.`;

    const requestBody = {
        contents: [
            {
                role: 'user',
                parts: [{ text: GEMINI_SYSTEM_PROMPT + '\n\n' + userPrompt }],
            },
        ],
        generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
        },
    };

    let lastError: Error | null = null;

    // Try each model
    for (const model of GEMINI_MODELS) {
        const MAX_RETRIES = 3;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(
                    `[categorizer] Calling ${model} (attempt ${attempt}/${MAX_RETRIES})…`
                );

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                    }
                );

                if (response.status === 429) {
                    // Rate limited — parse retry delay if available
                    const errBody = await response.text();
                    const retryMatch = errBody.match(/retry.*?(\d+\.?\d*)\s*s/i);
                    const retryDelaySec = retryMatch
                        ? parseFloat(retryMatch[1])
                        : 10 * attempt;

                    // Check if it's a daily quota exhaustion (limit: 0) vs temporary rate limit
                    if (errBody.includes('limit: 0')) {
                        console.warn(
                            `[categorizer] ${model} daily quota exhausted, trying next model…`
                        );
                        lastError = new Error(
                            `${model} daily quota exhausted`
                        );
                        break; // Skip to next model
                    }

                    console.warn(
                        `[categorizer] Rate limited on ${model}. Retrying in ${retryDelaySec}s…`
                    );
                    await sleep(retryDelaySec * 1000);
                    continue;
                }

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(
                        `Gemini API error ${response.status}: ${errText.slice(0, 300)}`
                    );
                }

                const data = await response.json();
                const text =
                    data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

                try {
                    const cleaned = text
                        .replace(/```json\n?/g, '')
                        .replace(/```\n?/g, '')
                        .trim();
                    const parsed = JSON.parse(cleaned);
                    console.log(
                        `[categorizer] ✅ ${model} returned ${parsed.length} results`
                    );
                    return parsed;
                } catch {
                    console.error(
                        '[categorizer] Failed to parse Gemini response:',
                        text.slice(0, 500)
                    );
                    throw new Error(
                        'Failed to parse Gemini AI response as JSON'
                    );
                }
            } catch (err: any) {
                lastError = err;
                if (
                    attempt < MAX_RETRIES &&
                    !err.message.includes('quota exhausted')
                ) {
                    const backoff = Math.pow(2, attempt) * 5000;
                    console.warn(
                        `[categorizer] Error on ${model}, retrying in ${backoff / 1000}s:`,
                        err.message
                    );
                    await sleep(backoff);
                }
            }
        }

        console.warn(
            `[categorizer] All retries failed for ${model}, trying next model…`
        );
    }

    // All models failed
    throw lastError || new Error('All Gemini models failed');
}

// ---------------------------------------------------------------------------
// Process articles in batches
// ---------------------------------------------------------------------------

function generateId(title: string, date: string): string {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 60)
        .replace(/-+$/, '');
    return `${date}-${slug}`;
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toISOString().split('T')[0];
    } catch {
        return new Date().toISOString().split('T')[0];
    }
}

/**
 * Process raw articles through Gemini AI and return structured UPSC current affairs.
 * Processes in batches of 10 to stay within token limits.
 * Includes automatic retry with exponential backoff for rate limits.
 */
export async function categorizeArticles(
    rawArticles: RawArticle[],
    apiKey: string
): Promise<ProcessedArticle[]> {
    console.log(
        `[categorizer] Processing ${rawArticles.length} articles through Gemini AI…`
    );

    const BATCH_SIZE = 10;
    const allResults: ProcessedArticle[] = [];

    for (let i = 0; i < rawArticles.length; i += BATCH_SIZE) {
        const batch = rawArticles.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(rawArticles.length / BATCH_SIZE);
        console.log(
            `[categorizer] Processing batch ${batchNum}/${totalBatches}…`
        );

        try {
            const results = await callGeminiAPI(batch, apiKey);

            for (let j = 0; j < results.length && j < batch.length; j++) {
                const result = results[j];
                const raw = batch[j];

                if (result.skip) {
                    console.log(
                        `[categorizer] Skipping (not UPSC-relevant): ${raw.title.slice(0, 60)}`
                    );
                    continue;
                }

                const dateStr = formatDate(raw.pubDate);

                allResults.push({
                    id: generateId(result.title || raw.title, dateStr),
                    title: result.title || raw.title,
                    summary:
                        result.summary || raw.description.slice(0, 200),
                    category: result.category || 'polity',
                    date: dateStr,
                    source: raw.source,
                    sourceUrl: raw.link,
                    importance: result.importance || 'medium',
                    tags: result.tags || [],
                    prelims: result.prelims ?? false,
                    mains: result.mains ?? false,
                    gsRelevance: result.gsRelevance || [],
                    section: raw.section,
                    processedAt: new Date().toISOString(),
                });
            }

            // Rate limiting — longer delay between batches to avoid 429s
            if (i + BATCH_SIZE < rawArticles.length) {
                console.log('[categorizer] Waiting 5s before next batch…');
                await sleep(5000);
            }
        } catch (err: any) {
            console.error(
                `[categorizer] Batch ${batchNum} failed:`,
                err.message
            );
            // Continue with next batch
        }
    }

    console.log(
        `[categorizer] Successfully processed ${allResults.length} UPSC-relevant articles`
    );

    // Sort by importance
    const importanceOrder = { high: 0, medium: 1, low: 2 };
    allResults.sort(
        (a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]
    );

    return allResults;
}

/**
 * Full pipeline: scrape → categorize → return daily current affairs object.
 */
export async function generateDailyCurrentAffairs(
    rawArticles: RawArticle[],
    apiKey: string
): Promise<DailyCurrentAffairs> {
    const articles = await categorizeArticles(rawArticles, apiKey);
    const today = new Date().toISOString().split('T')[0];

    return {
        date: today,
        lastUpdated: new Date().toISOString(),
        articles,
        sources: ['The Hindu', 'Indian Express', 'News on AIR'],
        totalScraped: rawArticles.length,
        totalProcessed: articles.length,
    };
}
