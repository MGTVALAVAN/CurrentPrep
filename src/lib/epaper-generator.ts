/**
 * ePaper Generator — Uses Gemini AI to transform raw scraped articles into
 * a fully structured UPSC Daily ePaper.
 *
 * For each article, generates:
 *  - UPSC-friendly headline (not clickbait)
 *  - 200-300 word explainer with context, conceptual clarity,
 *    Prelims & Mains relevance, and embedded syllabus keywords
 *  - GS paper mapping (GS1/GS2/GS3/GS4)
 *  - One-line image description
 *  - Key terms for quick revision
 *
 * Reuses the Gemini retry + model fallback logic from news-categorizer.
 */

import type { RawEpaperArticle } from './epaper-scraper';
import type { EpaperCategory, GSPaper } from './epaper-sources';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EpaperArticle {
    id: string;
    headline: string;
    explainer: string;
    category: EpaperCategory;
    gsPaper: GSPaper;
    gsSubTopics: string[];
    date: string;
    source: string;
    sourceUrl: string;
    importance: 'high' | 'medium' | 'low';
    tags: string[];
    keyTerms: string[];
    prelims: boolean;
    prelimsPoints: string[];
    mains: boolean;
    mainsPoints: string[];
    imageDescription: string;
    section: string;
    processedAt: string;
}

export interface DailyEpaper {
    date: string;
    dateFormatted: string;
    lastUpdated: string;
    edition: number;
    articles: EpaperArticle[];
    articlesByGS: Record<string, EpaperArticle[]>;
    sources: string[];
    totalScraped: number;
    totalProcessed: number;
    highlights: string[];
}

// ---------------------------------------------------------------------------
// Gemini AI Integration
// ---------------------------------------------------------------------------

const EPAPER_SYSTEM_PROMPT = `You are the chief editor of "CurrentPrep Daily ePaper" — a premium UPSC Civil Services Exam current affairs ePaper. You produce rigorously structured, syllabus-mapped content for serious Prelims and Mains aspirants.

IMPORTANT — WHAT TO SKIP (set "skip": true):
You MUST skip articles that are:
- **Party politics / Electoral**: News about specific political parties, party leaders' statements, election campaigns, seat-sharing talks, party protests, inter-party rivalries, political rallies, party spokesperson quotes
- **Political controversies / Accusations**: News framed around political accusations, corruption charges against specific politicians, political arrests/bail/acquittals (e.g., "Kejriwal", "liquor policy case", "Youth Congress protest"), CBI/ED cases with political tone
- **Sports, Entertainment, Celebrity news**: Cricket, Bollywood, film reviews, awards shows
- **Routine crime**: Local murders, thefts, accidents (unless they raise a policy/governance dimension like road safety policy or criminal justice reform)
- **Obituaries and personal profiles**: Unless the person is significant for governance/institutional reasons

WHAT TO INCLUDE:
Focus ONLY on news with institutional, governance, or policy significance:
- Supreme Court / High Court judgments (constitutional interpretation, fundamental rights, PIL)
- Parliament proceedings, Bills, Acts (legislative process, not party squabbles)
- Government schemes, policy changes, Budget provisions, Finance Commission
- RBI/SEBI/regulatory decisions (monetary policy, banking reforms)
- PIB press releases about government programs, initiatives
- International relations (treaties, summits, bilateral relations)
- Environmental policy, climate action, biodiversity conservation
- Science & Technology breakthroughs (ISRO, DRDO, biotech, AI policy)
- UN/WHO/IMF/World Bank reports and recommendations affecting India
- Agricultural policy (MSP, crop insurance, farmer welfare schemes)
- Social justice (education policy, health policy, tribal welfare, women empowerment)

For each INCLUDED article, return a JSON object with these fields:

1. "headline": A clear, UPSC-relevant headline (max 100 chars, no clickbait, institutional/policy tone)

2. "explainer": A 200-300 word explainer structured as:
   - **Context**: What happened, where, when, which institution/body was involved (2-3 sentences)
   - **Significance**: Why it matters for India / policy / governance (2-3 sentences)  
   - **UPSC Connect**: How it links to static syllabus topics. Weave in syllabus keywords naturally (e.g., federal structure, constitutionalism, fiscal deficit, inclusive growth, biodiversity hotspots, MSP, climate resilience, cooperative federalism, SDGs, Article 21, Directive Principles, etc.)
   - **Way Forward / Analysis**: Key dimensions, challenges, implications (2-3 sentences)

3. "category": One of: polity, governance, economy, ir, environment, science, social, history, geography, security, agriculture, disaster, ethics

4. "gsPaper": The primary GS paper — one of: GS1, GS2, GS3, GS4

5. "gsSubTopics": Array of specific syllabus sub-topics (e.g., ["Polity: Federal Structure", "Governance: Centre-State Relations"])

6. "importance": "high" (landmark judgments, budget, major policy changes, international summits), "medium" (government schemes, reports, bilateral relations), "low" (minor updates)

7. "tags": Array of 4-6 keyword tags

8. "keyTerms": Array of 3-5 key terms/concepts an aspirant must know from this news (e.g., ["Article 370", "Abrogation", "Special Status", "J&K Reorganisation Act"])

9. "prelims": boolean — relevant for Prelims?
10. "prelimsPoints": Array of 2-3 crisp bullet points for Prelims revision (facts, institutions, dates, schemes)

11. "mains": boolean — relevant for Mains?
12. "mainsPoints": Array of 2-3 key dimensions for Mains answer writing (issues, arguments, way forward)

13. "imageDescription": A one-line description for an illustrative image in Indian context (e.g., "Front view of Supreme Court of India building", "Indian farmer in paddy field with tractor", "RBI headquarters Mumbai skyline")

14. "skip": boolean — set true if the article should be excluded per the rules above

RULES:
- NEVER include party-political news, even if it involves a policy topic — skip it
- Keep explainers factual and exam-oriented — NO opinions, NO editorializing
- Every explainer MUST have embedded syllabus keywords and concepts
- RETURN VALID JSON ONLY — an array of objects`;

interface GeminiEpaperResult {
    headline: string;
    explainer: string;
    category: EpaperCategory;
    gsPaper: GSPaper;
    gsSubTopics: string[];
    importance: 'high' | 'medium' | 'low';
    tags: string[];
    keyTerms: string[];
    prelims: boolean;
    prelimsPoints: string[];
    mains: boolean;
    mainsPoints: string[];
    imageDescription: string;
    skip?: boolean;
}

// Models to try, in order of preference
const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
];

function sleep(ms: number): Promise<void> {
    const jitter = Math.random() * 1000;
    return new Promise((resolve) => setTimeout(resolve, ms + jitter));
}

async function callGeminiForEpaper(
    articles: RawEpaperArticle[],
    apiKey: string
): Promise<GeminiEpaperResult[]> {
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

    const userPrompt = `Analyze the following ${articles.length} news articles for the UPSC Daily ePaper. For each article that is NOT UPSC-relevant, set "skip": true. For relevant articles, provide the full structured analysis.

${articleTexts}

Return ONLY a valid JSON array. Each element must have: headline, explainer, category, gsPaper, gsSubTopics, importance, tags, keyTerms, prelims, prelimsPoints, mains, mainsPoints, imageDescription, skip.`;

    const requestBody = {
        contents: [
            {
                role: 'user',
                parts: [{ text: EPAPER_SYSTEM_PROMPT + '\n\n' + userPrompt }],
            },
        ],
        generationConfig: {
            temperature: 0.3,
            topP: 0.85,
            maxOutputTokens: 16384,
            responseMimeType: 'application/json',
        },
    };

    let lastError: Error | null = null;

    for (const model of GEMINI_MODELS) {
        const MAX_RETRIES = 3;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(
                    `[epaper-gen] Calling ${model} (attempt ${attempt}/${MAX_RETRIES})…`
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
                    const errBody = await response.text();
                    const retryMatch = errBody.match(/retry.*?(\d+\.?\d*)\s*s/i);
                    const retryDelaySec = retryMatch
                        ? parseFloat(retryMatch[1])
                        : 10 * attempt;

                    if (errBody.includes('limit: 0')) {
                        console.warn(
                            `[epaper-gen] ${model} daily quota exhausted, trying next model…`
                        );
                        lastError = new Error(`${model} daily quota exhausted`);
                        break;
                    }

                    console.warn(
                        `[epaper-gen] Rate limited on ${model}. Retrying in ${retryDelaySec}s…`
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
                        `[epaper-gen] ✅ ${model} returned ${parsed.length} results`
                    );
                    return parsed;
                } catch {
                    console.error(
                        '[epaper-gen] Failed to parse Gemini response:',
                        text.slice(0, 500)
                    );
                    throw new Error('Failed to parse Gemini AI response as JSON');
                }
            } catch (err: any) {
                lastError = err;
                if (
                    attempt < MAX_RETRIES &&
                    !err.message.includes('quota exhausted')
                ) {
                    const backoff = Math.pow(2, attempt) * 5000;
                    console.warn(
                        `[epaper-gen] Error on ${model}, retrying in ${backoff / 1000}s:`,
                        err.message
                    );
                    await sleep(backoff);
                }
            }
        }

        console.warn(
            `[epaper-gen] All retries failed for ${model}, trying next model…`
        );
    }

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

function formatDateReadable(date: string): string {
    try {
        const d = new Date(date + 'T00:00:00');
        return d.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return date;
    }
}

/**
 * Process raw articles through Gemini AI for the ePaper.
 * Processes in batches of 8 (larger explainers need more tokens).
 */
export async function generateEpaperArticles(
    rawArticles: RawEpaperArticle[],
    apiKey: string
): Promise<EpaperArticle[]> {
    console.log(
        `[epaper-gen] Processing ${rawArticles.length} articles for ePaper…`
    );

    const BATCH_SIZE = 8;
    const allResults: EpaperArticle[] = [];

    for (let i = 0; i < rawArticles.length; i += BATCH_SIZE) {
        const batch = rawArticles.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(rawArticles.length / BATCH_SIZE);
        console.log(
            `[epaper-gen] Processing batch ${batchNum}/${totalBatches}…`
        );

        try {
            const results = await callGeminiForEpaper(batch, apiKey);

            for (let j = 0; j < results.length && j < batch.length; j++) {
                const result = results[j];
                const raw = batch[j];

                if (result.skip) {
                    console.log(
                        `[epaper-gen] Skipping (not UPSC-relevant): ${raw.title.slice(0, 60)}`
                    );
                    continue;
                }

                const dateStr = formatDate(raw.pubDate);

                allResults.push({
                    id: generateId(result.headline || raw.title, dateStr),
                    headline: result.headline || raw.title,
                    explainer: result.explainer || raw.description,
                    category: result.category || 'polity',
                    gsPaper: result.gsPaper || 'GS2',
                    gsSubTopics: result.gsSubTopics || [],
                    date: dateStr,
                    source: raw.sourceShort || raw.source,
                    sourceUrl: raw.link,
                    importance: result.importance || 'medium',
                    tags: result.tags || [],
                    keyTerms: result.keyTerms || [],
                    prelims: result.prelims ?? false,
                    prelimsPoints: result.prelimsPoints || [],
                    mains: result.mains ?? false,
                    mainsPoints: result.mainsPoints || [],
                    imageDescription: result.imageDescription || '',
                    section: raw.section,
                    processedAt: new Date().toISOString(),
                });
            }

            // Rate limiting between batches
            if (i + BATCH_SIZE < rawArticles.length) {
                console.log('[epaper-gen] Waiting 6s before next batch…');
                await sleep(6000);
            }
        } catch (err: any) {
            console.error(
                `[epaper-gen] Batch ${batchNum} failed:`,
                err.message
            );
        }
    }

    console.log(
        `[epaper-gen] Successfully processed ${allResults.length} ePaper articles`
    );

    // Sort by importance, then by GS paper
    const importanceOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    allResults.sort(
        (a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]
    );

    return allResults;
}

/**
 * Generate highlights — top 3-5 headlines for the front page banner.
 */
function generateHighlights(articles: EpaperArticle[]): string[] {
    return articles
        .filter((a) => a.importance === 'high')
        .slice(0, 5)
        .map((a) => a.headline);
}

/**
 * Group articles by GS paper for section-wise rendering.
 */
function groupByGS(articles: EpaperArticle[]): Record<string, EpaperArticle[]> {
    const groups: Record<string, EpaperArticle[]> = {
        GS1: [],
        GS2: [],
        GS3: [],
        GS4: [],
    };

    for (const article of articles) {
        const paper = article.gsPaper || 'GS2';
        if (!groups[paper]) groups[paper] = [];
        groups[paper].push(article);
    }

    return groups;
}

/**
 * Full ePaper pipeline: scrape → AI process → structure as ePaper.
 */
export async function generateDailyEpaper(
    rawArticles: RawEpaperArticle[],
    apiKey: string
): Promise<DailyEpaper> {
    const articles = await generateEpaperArticles(rawArticles, apiKey);
    const today = new Date().toISOString().split('T')[0];

    const uniqueSources = Array.from(new Set(rawArticles.map((a) => a.sourceShort || a.source)));

    return {
        date: today,
        dateFormatted: formatDateReadable(today),
        lastUpdated: new Date().toISOString(),
        edition: 1,
        articles,
        articlesByGS: groupByGS(articles),
        sources: uniqueSources,
        totalScraped: rawArticles.length,
        totalProcessed: articles.length,
        highlights: generateHighlights(articles),
    };
}
