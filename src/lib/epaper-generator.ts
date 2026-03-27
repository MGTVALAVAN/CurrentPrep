/**
 * ePaper Generator — Uses Gemini AI to transform raw scraped articles into
 * a fully structured UPSC Daily ePaper.
 *
 * For each article, generates:
 *  - UPSC-friendly headline (not clickbait)
 *  - 300-400 word explainer with context, conceptual clarity,
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
    trivia: string;
    prelimsSyllabus: { subject: string; area: string; subArea: string };
    prelimsPotential: number;
    processedAt: string;
}

export interface MockQuestion {
    question: string;
    options?: string[]; // For prelims
    answer: string;
    explanation: string;
}

export interface MainsMockQuestion {
    question: string;
    syllabusMatch: string;
    approach: string;
}

export interface CsatComprehension {
    passage: string;
    source?: string;
    questions: {
        question: string;
        options: string[];
        answer: string;
        explanation: string;
    }[];
}

export type CsatReasoningCategory =
    | 'syllogism'
    | 'statement_assumption'
    | 'statement_conclusion'
    | 'coding_decoding'
    | 'blood_relation'
    | 'direction_sense'
    | 'series_sequence'
    | 'seating_arrangement'
    | 'puzzle'
    | 'data_sufficiency'
    | 'decision_making'
    | 'cause_effect';

export interface CsatReasoning {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    category: CsatReasoningCategory;
}

export interface QuickByte {
    text: string;
    category: string;
    gsPaper: string;
    tags: string[];
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
    prelimsMocks?: MockQuestion[];
    mainsMocks?: MainsMockQuestion[];
    csatMocks?: {
        comprehension: CsatComprehension[];
        reasoning: CsatReasoning[];
    };
    quickBytes?: QuickByte[];
    quoteOfTheDay?: { text: string; author: string };
    onThisDay?: { year: number; event: string };
    dataSnapshot?: { label: string; value: string; context: string };
}

// ---------------------------------------------------------------------------
// Gemini AI Integration
// ---------------------------------------------------------------------------

const EPAPER_SYSTEM_PROMPT = `You are the chief editor of "Current IAS Prep Daily ePaper" — a premium UPSC Civil Services Exam current affairs ePaper. You produce rigorously structured, syllabus-mapped content for serious Prelims and Mains aspirants.

IMPORTANT — WHAT TO SKIP (set "skip": true):
You MUST skip articles that are:
- **Party politics / Electoral**: News about specific political parties, party leaders' statements, election campaigns, seat-sharing talks, party protests, inter-party rivalries, political rallies, party spokesperson quotes
- **Political controversies / Accusations**: News framed around political accusations, corruption charges against specific politicians, political arrests/bail/acquittals (e.g., "Kejriwal", "liquor policy case", "Youth Congress protest"), CBI/ED cases with political tone
- **Sports, Entertainment, Celebrity news**: Cricket, Bollywood, film reviews, awards shows
- **Routine crime**: Local murders, thefts, accidents (unless they raise a policy/governance dimension like road safety policy or criminal justice reform)
- **Obituaries and personal profiles**: Unless the person is significant for governance/institutional reasons
- **Local / State / City-specific news**: State government announcements relevant ONLY to that state, municipal corporation decisions, district-level administrative orders, city infrastructure projects, state assembly proceedings, local civic body elections, state-specific welfare distribution, Collector/DM-level reviews, state police actions. UPSC CSE philosophy: a person in the remotest corner of India should have access to the information. If the news is meaningful ONLY to residents of one state or city, SKIP it.
  Examples to SKIP: "Chennai Corporation launches projects", "Collector reviews LPG stocks at Kondapalli", "AP CM inaugurates flyover", "6 ministers skip Naidu's cabinet meeting", "MP CM announces farm loan waiver for state"
  Exception: Include state-level news ONLY if it sets a national precedent, involves a High Court/Supreme Court ruling, or represents a first-of-its-kind policy applicable nationwide.

WHAT TO INCLUDE:
Focus ONLY on news with national or international significance — accessible and relevant to any citizen regardless of location:
- Supreme Court / High Court judgments with national implications (constitutional interpretation, fundamental rights, PIL)
- Parliament proceedings, Bills, Acts (legislative process, not party squabbles)
- Central government schemes, policy changes, Budget provisions, Finance Commission
- RBI/SEBI/regulatory decisions (monetary policy, banking reforms)
- PIB press releases about national government programs, initiatives
- International relations (treaties, summits, bilateral relations)
- Environmental policy, climate action, biodiversity conservation with national scope
- Science & Technology breakthroughs (ISRO, DRDO, biotech, AI policy)
- UN/WHO/IMF/World Bank reports and recommendations affecting India
- Agricultural policy (MSP, crop insurance, farmer welfare schemes applicable nationally)
- Social justice (national education policy, health policy, tribal welfare, women empowerment)

PRELIMS GS PAPER I SYLLABUS (use for "prelimsSyllabus" mapping):
1. Current Events of National & International Importance
2. History of India & Indian National Movement — Ancient, Medieval, Modern India, Freedom Struggle, Post-independence Consolidation
3. Indian & World Geography — Physical, Social, Economic Geography of India & World
4. Indian Polity & Governance — Constitution, Political System, Panchayati Raj, Public Policy, Rights Issues, Constitutional & Statutory Bodies
5. Economic & Social Development — Sustainable Development, Poverty, Inclusion, Demographics, Social Sector Initiatives
6. Environment, Ecology, Biodiversity & Climate Change — Protected Areas, Species, Climate Policy, International Environmental Agreements
7. General Science — Physics, Chemistry, Biology, Technology & everyday applications

PRELIMS POTENTIAL STAR RATING (for "prelimsPotential"):
1: Background awareness — unlikely to be directly tested
2: Could appear as a distractor option in MCQs
3: Moderate — may appear in statement-based questions
4: High — involves specific facts, bodies, acts, or provisions
5: Near-certain — constitutional articles, landmark judgments, new schemes/acts, specific data, or first-of-its-kind events

For each INCLUDED article, return a JSON object with these fields:

1. "headline": A clear, UPSC-relevant headline (max 100 chars, no clickbait, institutional/policy tone)

2. "explainer": A TWO-PART article body structured as follows:
   PART 1 — KEY FACTS: Exactly 5 bullet points, each starting with the • character. Each bullet must be a SINGLE crisp sentence stating one concrete, verifiable fact (what happened, who was involved, key data/provisions). Keep each bullet SHORT — maximum 15-20 words. No multi-sentence bullets. Example: "• India's crude oil import bill rose 18% to $142 billion in FY25."
   After the bullets, leave one blank line, then write:
   PART 2 — ANALYSIS: A 180-200 word analytical passage that helps the reader think deeper about the issue. Cover: why this matters for governance/policy, institutional implications, connections to constitutional principles or development challenges, and what dimensions a thoughtful citizen should consider. Write in premium newspaper prose — flowing paragraphs, not bullet points. Naturally weave in Civil Services syllabus keywords (e.g., federal structure, constitutionalism, fiscal deficit, inclusive growth, cooperative federalism, SDGs, Article 21). NEVER explicitly mention "UPSC", "syllabus", or "aspirants". Do NOT use structural headers. The analysis must be substantive and thought-provoking — aim for exactly 180-200 words.

3. "category": One of: polity, governance, economy, ir, environment, science, social, history, geography, security, agriculture, disaster, ethics

4. "gsPaper": The primary MAINS GS paper — one of: GS1, GS2, GS3, GS4

5. "gsSubTopics": Array of specific MAINS syllabus sub-topics (e.g., ["Polity: Federal Structure", "Governance: Centre-State Relations"])

6. "importance": "high" (landmark judgments, budget, major policy changes, international summits), "medium" (government schemes, reports, bilateral relations), "low" (minor updates)

7. "tags": Array of 4-6 keyword tags

8. "keyTerms": Array of 3-5 key terms/concepts an aspirant must know (e.g., ["Article 370", "Abrogation", "Special Status", "J&K Reorganisation Act"])

9. "prelims": boolean — relevant for Prelims?
10. "prelimsPoints": Array of 2-3 crisp bullet points for Prelims revision (facts, institutions, dates, schemes)

11. "mains": boolean — relevant for Mains?
12. "mainsPoints": Array of 2-3 key dimensions for Mains answer writing (issues, arguments, way forward)


13. "trivia": A single crisp, fascinating 1-2 sentence trivia fact relevant to the UPSC syllabus regarding the article's topic. Must be factual and testable.

14. "imageDescription": A one-line description for an illustrative image in Indian context (e.g., "Supreme Court of India building", "Indian farmer in paddy field")

15. "prelimsSyllabus": An object mapping to the PRELIMS GS Paper I syllabus with:
    - "subject": One of the 7 Prelims subjects listed above (e.g., "Indian Polity & Governance")
    - "area": The specific area within that subject (e.g., "Constitutional Bodies")
    - "subArea": The precise sub-area tested in Prelims (e.g., "Election Commission — Powers, Functions & Independence")

16. "prelimsPotential": Number 1-5 using the star rating rubric above

17. "skip": boolean — set true if the article should be excluded per the rules above

MANDATORY FACT-CHECK RULES — VIOLATION WILL CAUSE REJECTION:
These are verified ground-truth facts. Do NOT contradict them in any field (especially "trivia"):

CURRENT LEADERS:
- US President: Donald Trump (47th President, serving 2nd term since January 20, 2025). Do NOT call him "former president".
- India PM: Narendra Modi (3rd term since June 2024)
- RBI Governor: Sanjay Malhotra (since December 2024)

ECONOMIC DATA (use these exact figures):
- RBI Repo Rate: 6.00% (was 6.50% until Dec 2024, cut multiple times since)
- India GDP FY2024-25: approximately 330 Lakh Crore (Provisional Estimate)
- GDP Growth FY2024-25: 6.5% (Provisional Estimate — do NOT label as "Advance Estimate")
- Per Capita Income (NNI per capita): approximately 1.15 Lakh. GDP per capita: approximately 2.36 Lakh. Do NOT confuse the two.

CLIMATE / NDC TARGETS:
- India updated NDC (March 2026): 47% emission intensity reduction by 2035; 60% non-fossil fuel capacity by 2035
- Old NDC (2022): 45% by 2030 — use ONLY when specifically referring to the old target with context

COMMON ERRORS TO AVOID IN TRIVIA:
- "India was the first country to ratify the Paris Agreement" is FALSE. India was the 62nd country (Oct 2, 2016).
- "NALSA judgment was India's first legal recognition of transgender identity" is IMPRECISE. Say "first Supreme Court recognition at the national level".
- Never use "former" for any current sitting head of state/government.

RULES:
- NEVER include party-political news, even if it involves a policy topic — skip it
- The KEY FACTS bullets must contain concrete, verifiable facts — never vague statements like "This is significant" or "Experts say"
- The ANALYSIS paragraph must be factual and analytical — NO opinions, NO editorializing
- Every analysis paragraph MUST naturally embed syllabus keywords without explicitly pointing them out
- Every "trivia" field must state a testable, verifiable fact — cross-check against the FACT-CHECK RULES above
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
    trivia: string;
    imageDescription: string;
    prelimsSyllabus?: { subject: string; area: string; subArea: string };
    prelimsPotential?: number;
    skip?: boolean;
}

// Models to try, in order of preference
const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
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
Description: ${a.description}${a.fullText ? `\nFull Article Text: ${a.fullText}` : ''}
Published: ${a.pubDate}`
        )
        .join('\n\n---\n\n');

    const userPrompt = `Analyze the following ${articles.length} news articles for the UPSC Daily ePaper. For each article that is NOT UPSC-relevant, set "skip": true. For relevant articles, provide the full structured analysis. Use the "Full Article Text" if provided for accurate fact extraction in the KEY FACTS bullets.

${articleTexts}

Return ONLY a valid JSON array. Each element must have: headline, explainer, category, gsPaper, gsSubTopics, importance, tags, keyTerms, prelims, prelimsPoints, mains, mainsPoints, imageDescription, trivia, prelimsSyllabus, prelimsPotential, skip.`;

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
            maxOutputTokens: 32768,
            responseMimeType: 'application/json',
        },
    };

    let lastError: Error | null = null;

    for (const model of GEMINI_MODELS) {
        const MAX_RETRIES = 5;

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
                    trivia: result.trivia || '',
                    prelimsSyllabus: result.prelimsSyllabus || { subject: '', area: '', subArea: '' },
                    prelimsPotential: result.prelimsPotential || 3,
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

    // ── Post-AI Topic Consolidation ──
    // Group similar articles and cap each topic cluster to max 2
    const consolidated = consolidateByTopic(allResults, 2);

    // Limit to exactly 25 articles for optimal printing layout and reading experience
    return consolidated.slice(0, 25);
}

// ---------------------------------------------------------------------------
// Post-AI Topic Consolidation
// Groups articles by headline similarity and caps each cluster to maxPerTopic
// ---------------------------------------------------------------------------

const CONSOLIDATION_STOPWORDS = new Set([
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is',
    'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'it', 'its',
    'by', 'from', 'with', 'as', 'that', 'this', 'not', 'but', 'will', 'can',
    'may', 'over', 'says', 'said', 'new', 'after', 'amid', 'amidst', 'under',
    'into', 'about', 'between', 'more', 'also', 'how', 'why', 'what', 'who',
    'india', 'indian', 'government', 'centre', 'state', 'country', 'national',
]);

function getHeadlineWords(headline: string): Set<string> {
    return new Set(
        headline.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2 && !CONSOLIDATION_STOPWORDS.has(w))
    );
}

function headlineSimilarity(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) return 0;
    let intersection = 0;
    const aArr = Array.from(a);
    for (const w of aArr) { if (b.has(w)) intersection++; }
    const union = a.size + b.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

function consolidateByTopic(
    articles: EpaperArticle[],
    maxPerTopic: number
): EpaperArticle[] {
    if (articles.length <= maxPerTopic) return articles;

    // Build clusters using union-find style grouping
    const wordSets = articles.map(a => getHeadlineWords(a.headline));
    const clusterId = articles.map((_, i) => i);
    const SIMILARITY_THRESHOLD = 0.4;

    // Also check tags overlap for articles that might have different headlines
    function areTopicRelated(i: number, j: number): boolean {
        // Headline word similarity
        if (headlineSimilarity(wordSets[i], wordSets[j]) >= SIMILARITY_THRESHOLD) return true;
        // Tag overlap: if >50% tags match, likely same topic
        const tagsI = new Set(articles[i].tags.map(t => t.toLowerCase()));
        const tagsJ = articles[j].tags.map(t => t.toLowerCase());
        const tagOverlap = tagsJ.filter(t => tagsI.has(t)).length;
        if (tagsI.size > 0 && tagOverlap / Math.min(tagsI.size, tagsJ.length) > 0.5) return true;
        return false;
    }

    // Find root of cluster
    function find(i: number): number {
        while (clusterId[i] !== i) { clusterId[i] = clusterId[clusterId[i]]; i = clusterId[i]; }
        return i;
    }

    // Merge clusters
    for (let i = 0; i < articles.length; i++) {
        for (let j = i + 1; j < articles.length; j++) {
            if (areTopicRelated(i, j)) {
                const rootI = find(i);
                const rootJ = find(j);
                if (rootI !== rootJ) clusterId[rootJ] = rootI;
            }
        }
    }

    // Group by cluster
    const clusters = new Map<number, number[]>();
    for (let i = 0; i < articles.length; i++) {
        const root = find(i);
        if (!clusters.has(root)) clusters.set(root, []);
        clusters.get(root)!.push(i);
    }

    // Log clusters with >1 article
    let consolidatedCount = 0;
    const result: EpaperArticle[] = [];
    const importanceOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

    for (const entry of Array.from(clusters.entries())) {
        const indices = entry[1];
        // Sort by importance within cluster
        indices.sort((a: number, b: number) => importanceOrder[articles[a].importance] - importanceOrder[articles[b].importance]);

        if (indices.length > maxPerTopic) {
            const kept = indices.slice(0, maxPerTopic);
            const dropped = indices.slice(maxPerTopic);
            consolidatedCount += dropped.length;
            console.log(
                `[epaper-gen] 📦 Topic cluster (${indices.length} articles → ${maxPerTopic}): kept "${articles[kept[0]].headline.slice(0, 60)}..." | dropped ${dropped.length}: ${dropped.map((i: number) => `"${articles[i].headline.slice(0, 40)}..."`).join(', ')}`
            );
            kept.forEach((i: number) => result.push(articles[i]));
        } else {
            indices.forEach((i: number) => result.push(articles[i]));
        }
    }

    if (consolidatedCount > 0) {
        console.log(`[epaper-gen] Topic consolidation: removed ${consolidatedCount} duplicate-topic articles, ${result.length} remain`);
    }

    // Re-sort by importance
    result.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);
    return result;
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
 * Generates UPSC Mocks based on today's finalized articles.
 */
async function generateMocks(
    articles: EpaperArticle[],
    apiKey: string
): Promise<{ prelimsMocks: MockQuestion[]; mainsMocks: MainsMockQuestion[] }> {
    console.log(`[epaper-gen] Generating PYQ-calibrated Mocks from ${articles.length} articles...`);

    const contextTexts = articles
        .slice(0, 12)
        .map((a) => `- ${a.headline} [${a.gsPaper}, ${a.category}] Tags: ${a.tags.slice(0, 3).join(', ')}`)
        .join('\n');

    // Load PYQ samples for reference style
    let pyqSamples = '';
    try {
        const fs = require('fs');
        const pyqPath = require('path').join(process.cwd(), 'src/data/pyq/pyq-database.json');
        if (fs.existsSync(pyqPath)) {
            const pyqDb = JSON.parse(fs.readFileSync(pyqPath, 'utf-8'));
            const prelims = pyqDb.questions
                .filter((q: any) => q.paper?.includes('Prelims') && q.year >= 2020)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);
            if (prelims.length > 0) {
                pyqSamples = `\nREFERENCE STYLE — Here are 3 actual UPSC PYQs. MATCH this difficulty level and question format:\n${prelims.map((q: any, i: number) => `Sample ${i+1} (${q.year}, ${q.topic}):\nQ: ${q.question.substring(0, 300)}\nOptions: ${(q.options || []).slice(0, 4).join(' | ')}\nAnswer: ${q.answer}`).join('\n\n')}`;
                console.log(`[epaper-gen] Injected ${prelims.length} PYQ samples for calibration`);
            }
        }
    } catch { /* PYQ loading is optional */ }

    const prompt = `You are an expert UPSC Civil Services Prelims & Mains paper setter. Generate 5 Prelims Mock Questions and 5 Mains Mock Questions calibrated to actual UPSC examination standards.

HEADLINES TODAY:
${contextTexts}
${pyqSamples}

═══ PRELIMS MOCK (5 questions) ═══
MANDATORY QUESTION FORMATS (use this mix):
- 2 questions: STATEMENT-BASED — "Consider the following statements: 1. ... 2. ... 3. ... Which of the statements given above is/are correct?" with options like "(a) 1 only (b) 1 and 2 only (c) 2 and 3 only (d) 1, 2 and 3"
- 1 question: MATCH-THE-PAIR — "Match List I with List II" or "Which of the following pairs is/are correctly matched?"
- 1 question: DIRECT FACTUAL — "With reference to X, which of the following is correct?"
- 1 question: ASSERTION-REASON or NEGATIVE — "Which of the following is/are NOT correct?"

DIFFICULTY CALIBRATION:
- Questions should be 150-300 characters long (avg 228 chars, matching real UPSC)
- Include specific facts, names, numbers — NOT vague generalities
- 2 questions should be linked to today's headlines
- 3 questions should be static GK related to headline themes (background facts)
- At least 3 different GS topics covered
- Correct answers should be distributed (not all same option)

═══ MAINS MOCK (5 questions) ═══
- 2 questions: 10-marker (150 words) — specific, focused
- 3 questions: 15-marker (250 words) — analytical, multi-dimensional
- MUST link to today's headlines with specific current affairs reference
- Include the exact UPSC syllabus topic (e.g., "GS2: Parliament and State legislatures—structure, functioning")
- Approach hint: 3-4 sentences outlining intro, body structure, and conclusion direction

Return ONLY valid JSON matching this structure:
{
  "prelimsMocks": [
    { "question": "The question text", "options": ["(a) ...", "(b) ...", "(c) ...", "(d) ..."], "answer": "The correct option text exactly", "explanation": "Detailed 2-3 sentence explanation with factual basis." }
  ],
  "mainsMocks": [
    { "question": "The mains question (10m/15m)...", "syllabusMatch": "GS2: Specific syllabus topic...", "approach": "3-4 sentence approach hint covering intro, body, conclusion..." }
  ]
}`;

    const requestBody = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.3,
            topP: 0.85,
            responseMimeType: 'application/json',
        },
    };

    let lastError: Error | null = null;

    for (const model of GEMINI_MODELS) {
        const MAX_RETRIES = 3;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`[epaper-gen] Generating Mocks with ${model} (attempt ${attempt}/${MAX_RETRIES})...`);

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
                    const retryDelaySec = retryMatch ? parseFloat(retryMatch[1]) : 10 * attempt;

                    if (errBody.includes('limit: 0')) {
                        console.warn(`[epaper-gen] ${model} daily quota exhausted, trying next model...`);
                        lastError = new Error(`${model} daily quota exhausted`);
                        break;
                    }

                    console.warn(`[epaper-gen] Rate limited on ${model}. Retrying in ${retryDelaySec}s...`);
                    await sleep(retryDelaySec * 1000);
                    continue;
                }

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Gemini API error ${response.status}: ${errText.slice(0, 300)}`);
                }

                const data = await response.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error("No text returned for mocks");

                const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                const parsed = JSON.parse(cleaned);

                return {
                    prelimsMocks: parsed.prelimsMocks || [],
                    mainsMocks: parsed.mainsMocks || []
                };
            } catch (err: any) {
                lastError = err;
                if (attempt < MAX_RETRIES && !err.message.includes('quota exhausted')) {
                    const backoff = Math.pow(2, attempt) * 5000;
                    console.warn(`[epaper-gen] Mock gen error on ${model}, retrying in ${backoff / 1000}s: ${err.message}`);
                    await sleep(backoff);
                }
            }
        }
        console.warn(`[epaper-gen] All mock retries failed for ${model}, trying next model...`);
    }

    console.error('[epaper-gen] Mocks generation ultimately failed:', lastError?.message);
    return { prelimsMocks: [], mainsMocks: [] };
}

/**
 * Generates CSAT (Paper II) mock questions:
 * - Comprehension: editorial-style passages with MCQs (news-themed)
 * - Logical Reasoning: content-neutral, pure aptitude MCQs (authentic UPSC pattern)
 */
async function generateCsatMocks(
    articles: EpaperArticle[],
    apiKey: string
): Promise<{ comprehension: CsatComprehension[]; reasoning: CsatReasoning[] }> {
    console.log(`[epaper-gen] Generating CSAT mocks from ${articles.length} articles...`);

    const editorialThemes = articles
        .slice(0, 8)
        .map((a) => `- Theme: ${a.headline}\n  Context: ${typeof a.explainer === 'string' ? a.explainer.slice(0, 200) : ''}`)
        .join('\n');

    // Day-based rotation for Q3 and Q4 to provide variety
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const q3Types = [
        { type: 'coding_decoding', label: 'Coding-Decoding', instruction: 'Create a coding-decoding question where letters/words are encoded using a specific rule (e.g., letter shifts, position-based values, or symbol substitution). The examinee must decode a new word/number using the same rule. Example: "If APPLE is coded as ELPPA, how is MANGO coded?"' },
        { type: 'blood_relation', label: 'Blood Relations', instruction: 'Create a blood relation puzzle involving 4-6 family members. Use indirect descriptions (e.g., "A is the son of B\'s mother\'s husband"). Ask how two people are related. The answer must be logically derivable, not ambiguous.' },
        { type: 'direction_sense', label: 'Direction & Distance', instruction: 'Create a direction sense problem. A person walks in different compass directions (N/S/E/W) with specific turns and distances. Ask for the final distance from the starting point or the direction faced. Example: "Ram walks 10km north, turns right, walks 6km, turns right again and walks 10km. How far is he from the starting point?"' },
    ];
    const q4Types = [
        { type: 'series_sequence', label: 'Series & Sequence', instruction: 'Create a number series or letter series completion question. The series should follow a clear logical pattern (e.g., differences doubling, alternating operations, prime number patterns). Example: "What comes next in the series: 2, 6, 14, 30, 62, ?"' },
        { type: 'seating_arrangement', label: 'Seating Arrangement', instruction: 'Create a linear or circular seating arrangement puzzle. Give 5-6 people with constraints about who sits next to whom, who is at which end, etc. Ask a specific question about the arrangement. Keep it solvable with the given clues. Example: "Six friends A, B, C, D, E, and F sit in a row facing north. B sits to the immediate left of D. A sits at one end..."' },
        { type: 'puzzle', label: 'Logic Puzzle', instruction: 'Create a logic grid puzzle matching 4-5 people to attributes (e.g., profession, city, age). Give 3-4 clues and ask which combination is correct. Example: "Four friends have different professions — doctor, teacher, engineer, artist. Using the clues: (i) A is not a doctor (ii) B lives in the same city as the teacher (iii)... Determine who is the engineer."' },
    ];
    const q3Pick = q3Types[dayOfYear % q3Types.length];
    const q4Pick = q4Types[dayOfYear % q4Types.length];

    console.log(`[epaper-gen] Today's CSAT rotation: Q3=${q3Pick.label}, Q4=${q4Pick.label}`);

    // Day-rotating entity pools for Syllogism (prevent pens/pencils every day)
    const syllogismPools = [
        { entities: 'animals, birds, and insects', example: '"All sparrows are birds. Some birds are parrots. No parrot is a crow."' },
        { entities: 'professions and workplaces', example: '"All doctors are graduates. Some graduates are teachers. No teacher is a lawyer."' },
        { entities: 'fruits, vegetables, and foods', example: '"All mangoes are fruits. Some fruits are vegetables. No vegetable is a grain."' },
        { entities: 'vehicles and transport', example: '"All buses are vehicles. Some vehicles are trucks. No truck is a bicycle."' },
        { entities: 'metals, stones, and minerals', example: '"All diamonds are gems. Some gems are minerals. No mineral is a fossil."' },
        { entities: 'flowers, trees, and plants', example: '"All roses are flowers. Some flowers are herbs. No herb is a shrub."' },
        { entities: 'rivers, lakes, and mountains', example: '"All rivers are water bodies. Some water bodies are lakes. No lake is an ocean."' },
    ];
    const syllogismPick = syllogismPools[dayOfYear % syllogismPools.length];

    // Day-rotating scenarios for Statement & Assumption
    const assumptionScenarios = [
        'agriculture or farming (e.g., crop insurance, irrigation, MSP policy)',
        'public transport or traffic management (e.g., metro expansion, congestion tax)',
        'primary education or school policy (e.g., mid-day meals, teacher training)',
        'public health or hospital policy (e.g., vaccination drives, rural clinics)',
        'urban planning or housing (e.g., affordable housing, smart cities)',
        'environmental conservation (e.g., waste management, river cleaning)',
        'disaster management (e.g., flood relief, earthquake preparedness)',
    ];
    const assumptionPick = assumptionScenarios[dayOfYear % assumptionScenarios.length];

    // Day-rotating Decision Making scenarios (prevent "project manager + deadlines")
    const decisionScenarios = [
        { role: 'principal of a school', scenario: 'During the annual examination, a teacher reports that a group of students was found sharing answers. The exam is still in progress.' },
        { role: 'district magistrate', scenario: 'A major religious festival is approaching and two community groups claim the right to use the same public ground for their events on the same date.' },
        { role: 'doctor at a rural primary health centre', scenario: 'A critically ill patient needs immediate surgery, but the nearest surgical facility is 200 km away and the ambulance has broken down.' },
        { role: 'forest ranger in a national park', scenario: 'Villagers from the buffer zone report that a tiger has killed their livestock. They are angry and threatening to poison the water source used by wild animals.' },
        { role: 'police inspector at a town station', scenario: 'During a peaceful protest rally, a small group begins vandalizing public property. The main organizers request that you allow the peaceful protesters to continue.' },
        { role: 'municipal commissioner of a small city', scenario: 'Residents of a low-income neighborhood complain that a new waste processing plant approved near their area will cause health hazards, though the facility meets environmental norms.' },
        { role: 'bank branch manager', scenario: 'An elderly widow comes to withdraw her entire life savings. You suspect she may be a victim of a phone scam because she mentions needing to transfer money urgently to an unknown account.' },
        { role: 'railway station master', scenario: 'During heavy monsoon rains, the track ahead is reported flooded. An express train with 800 passengers is approaching in 20 minutes. Diverting it adds 6 hours to the journey.' },
        { role: 'headmaster of a government school', scenario: 'A talented but extremely poor student has been offered admission to a prestigious boarding school, but the student\'s parents refuse because they need the child\'s help at their roadside shop.' },
        { role: 'panchayat sarpanch', scenario: 'The only drinking water well in the village has been contaminated. A private company offers to install a purification plant for free, but demands exclusive naming rights and advertising on the village water tank.' },
        { role: 'junior IAS officer posted as SDM', scenario: 'Your senior (district collector) asks you to approve a mining lease that clearly violates environmental clearance norms. Refusing could jeopardize your career prospects.' },
        { role: 'director of a public hospital', scenario: 'Your hospital has received only 500 doses of a life-saving vaccine but 2,000 eligible patients are waiting. Local politicians are pressuring you to prioritize their constituents.' },
        { role: 'customs officer at an international airport', scenario: 'A diplomat claims diplomatic immunity after suspicious items are found in their luggage during a routine scan. Protocol forbids you from opening the bag, but you strongly suspect smuggling.' },
        { role: 'coast guard officer', scenario: 'A fishing boat with 12 fishermen from your country has accidentally crossed the maritime border. The neighboring country\'s navy is approaching. The fishermen are requesting your help.' },
    ];
    const decisionPick = decisionScenarios[dayOfYear % decisionScenarios.length];

    // Load past CSAT questions to prevent repetition
    let pastCsatWarning = '';
    try {
        const fs = require('fs');
        const epaperDir = require('path').join(process.cwd(), 'src', 'data', 'epaper');
        const pastFiles = fs.readdirSync(epaperDir)
            .filter((f: string) => f.startsWith('epaper-') && f.endsWith('.json') && f !== 'epaper-index.json')
            .sort().reverse().slice(0, 3);

        const pastQuestions: string[] = [];
        for (const f of pastFiles) {
            try {
                const d = JSON.parse(fs.readFileSync(require('path').join(epaperDir, f), 'utf-8'));
                const reasoning = d.csatMocks?.reasoning || [];
                for (const q of reasoning) {
                    pastQuestions.push(q.question?.substring(0, 150) || '');
                }
            } catch { continue; }
        }

        if (pastQuestions.length > 0) {
            pastCsatWarning = `\n\n⛔ DO NOT REPEAT — Here are reasoning questions from the past 3 days. You MUST create COMPLETELY DIFFERENT questions with different entities, numbers, names, and scenarios:\n${pastQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}\n`;
            console.log(`[epaper-gen] Injected ${pastQuestions.length} past CSAT questions as negative examples`);
        }
    } catch { /* past loading is optional */ }

    const prompt = `You are a UPSC CSAT (Civil Services Aptitude Test — Paper II) question setter.

You must generate questions in TWO categories. CATEGORY 1 uses news themes. CATEGORY 2 must be CONTENT-NEUTRAL (pure logic/aptitude — no current affairs knowledge required).

EDITORIAL THEMES (used ONLY for Category 1 Comprehension):
${editorialThemes}

═══════════════════════════════════════════
CATEGORY 1 — COMPREHENSION (2 passages)
═══════════════════════════════════════════
For each passage:
- Write an editorial-style passage of 200-250 words on a theme from today's news.
- The passage should be analytical, opinion-based prose (like editorials from The Hindu or The Economist).
- Create original analytical text — do NOT copy exact quotes.
- Each passage must have 3-4 MCQ questions testing: main idea, inference, author's attitude, logical conclusion, meaning in context.
- Questions must test reading comprehension skills, NOT factual recall.
- The 2 passages MUST cover DIFFERENT topics — do not write both passages on the same theme.

═══════════════════════════════════════════
CATEGORY 2 — LOGICAL REASONING (5 questions)
═══════════════════════════════════════════

⚠️ CRITICAL: These 5 questions must be COMPLETELY INDEPENDENT of any news content. They test pure logical/analytical aptitude using abstract or everyday scenarios. Do NOT reference any current events, policies, government schemes, or news headlines.
${pastCsatWarning}

Generate exactly 5 questions as follows:

**Q1 — SYLLOGISM (category: "syllogism")**
TODAY'S ENTITY THEME: Use ${syllogismPools[dayOfYear % syllogismPools.length].entities} as entities (NOT pens, pencils, books, papers, erasers, or stationery — those are BANNED today).
Give 2-3 statements using "All", "Some", "No" format and ask which conclusion(s) logically follow.
Example using today's theme: ${syllogismPick.example}
Options should be: "Only I", "Only II", "Both I and II", "Neither I nor II"

**Q2 — STATEMENT & ASSUMPTION or STATEMENT & CONCLUSION (category: "statement_assumption" or "statement_conclusion")**
TODAY'S SCENARIO DOMAIN: Create a statement about ${assumptionPick}.
Do NOT use scenarios about water supply, coaching institutes, or park closures — those have been used recently.
Give a general statement and ask which assumption is implicit or which conclusion follows.
Options: "Only I", "Only II", "Both I and II", "Neither I nor II"

**Q3 — ${q3Pick.label.toUpperCase()} (category: "${q3Pick.type}")**
${q3Pick.instruction}

**Q4 — ${q4Pick.label.toUpperCase()} (category: "${q4Pick.type}")**
${q4Pick.instruction}

**Q5 — DECISION MAKING (category: "decision_making")**
TODAY'S SCENARIO: You are a ${decisionPick.role}. ${decisionPick.scenario}
Present this scenario with necessary context. Give 4 possible courses of action. Ask which is the MOST appropriate course of action.
Do NOT use project manager / software team / missed deadlines scenarios — those are BANNED.

═══════════════════════════════════════════

Return ONLY valid JSON matching this exact structure:
{
  "comprehension": [
    {
      "passage": "The editorial passage text here...",
      "source": "Theme-based editorial",
      "questions": [
        { "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "The correct option text exactly", "explanation": "Why this is correct..." }
      ]
    }
  ],
  "reasoning": [
    { "question": "Full question text with all statements/data...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "The correct option text exactly", "explanation": "Step-by-step solution...", "category": "syllogism" }
  ]
}

IMPORTANT:
- Each reasoning question MUST include the "category" field with one of: "syllogism", "statement_assumption", "statement_conclusion", "coding_decoding", "blood_relation", "direction_sense", "series_sequence", "seating_arrangement", "puzzle", "decision_making"
- Reasoning questions must be SELF-CONTAINED — all information needed to solve the question must be in the question text itself.
- Ensure all questions have exactly 4 options, one correct answer, and a clear step-by-step explanation.`;

    const requestBody = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.75,
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
                console.log(`[epaper-gen] Generating CSAT with ${model} (attempt ${attempt}/${MAX_RETRIES})...`);

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
                    const retryDelaySec = retryMatch ? parseFloat(retryMatch[1]) : 10 * attempt;

                    if (errBody.includes('limit: 0')) {
                        console.warn(`[epaper-gen] ${model} daily quota exhausted for CSAT, trying next model...`);
                        lastError = new Error(`${model} daily quota exhausted`);
                        break;
                    }

                    console.warn(`[epaper-gen] Rate limited on ${model} for CSAT. Retrying in ${retryDelaySec}s...`);
                    await sleep(retryDelaySec * 1000);
                    continue;
                }

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Gemini API error ${response.status}: ${errText.slice(0, 300)}`);
                }

                const data = await response.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error('No text returned for CSAT mocks');

                const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                const parsed = JSON.parse(cleaned);

                console.log(`[epaper-gen] ✅ CSAT generated: ${parsed.comprehension?.length || 0} passages, ${parsed.reasoning?.length || 0} reasoning Qs`);

                return {
                    comprehension: parsed.comprehension || [],
                    reasoning: parsed.reasoning || [],
                };
            } catch (err: any) {
                lastError = err;
                if (attempt < MAX_RETRIES && !err.message.includes('quota exhausted')) {
                    const backoff = Math.pow(2, attempt) * 5000;
                    console.warn(`[epaper-gen] CSAT gen error on ${model}, retrying in ${backoff / 1000}s: ${err.message}`);
                    await sleep(backoff);
                }
            }
        }
        console.warn(`[epaper-gen] All CSAT retries failed for ${model}, trying next model...`);
    }

    console.error('[epaper-gen] CSAT generation ultimately failed:', lastError?.message);
    return { comprehension: [], reasoning: [] };
}

/**
 * Generate Quick Bytes — UPSC one-liners for static GK + "This Day in History"
 */
async function generateQuickBytes(
    selectedArticles: EpaperArticle[],
    allRawArticles: RawEpaperArticle[],
    apiKey: string
): Promise<QuickByte[]> {
    const headlines = [
        ...selectedArticles.map(a => `${a.headline}: ${a.tags.join(', ')}`),
        ...allRawArticles.slice(0, 15).map(a => a.title),
    ].slice(0, 30);

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const headlineBlock = headlines.join('\n');
    const prompt = [
        `You are a UPSC Static GK expert. Given today's date (${dateStr}) and the news headlines below, generate EXACTLY 10 crisp one-liner facts for the "Quick Bytes" section of a UPSC ePaper.`,
        '',
        'MANDATORY DISTRIBUTION (follow strictly):',
        '- 2 items: ART & CULTURE (GI tags, UNESCO sites, dances, textile, literature, temples, festivals)',
        `- 2 items: HISTORY / THIS DAY IN HISTORY (at least 1 must be an event on ${dateStr})`,
        '- 1 item: GEOGRAPHY (national parks, rivers, mountains, biosphere reserves)',
        '- 1 item: SCIENCE & TECHNOLOGY (ISRO, discoveries, Indian milestones)',
        '- 1 item: ENVIRONMENT (Ramsar sites, wildlife, endangered species)',
        '- 1 item: POLITY (constitutional facts, landmark judgments, statutory bodies)',
        '- 1 item: ECONOMY (schemes, indices, institutions)',
        '- 1 item: INTERNATIONAL (organizations, treaties, conventions)',
        '',
        'STRICT RULES:',
        '- Each Quick Byte must be 1-2 lines MAX (under 150 characters)',
        '- Must be a testable, factual statement — NOT opinion or analysis',
        '- Include specific names, dates, locations, numbers',
        '- NO TWO facts may cover the same topic or entity. Each must be distinct.',
        '- Prefer surprising/less-known facts over obvious ones',
        '- News-linked facts are preferred when relevant, but static GK is fine',
        '',
        'HEADLINES FOR CONTEXT:',
        headlineBlock,
        '',
        'Return ONLY a JSON array where each element has:',
        '- "text": The one-liner fact (concise, factual, testable)',
        '- "category": One of: art_culture, history, anniversary, geography, science, environment, polity, economy, international, general',
        '- "gsPaper": Primary GS paper (GS1, GS2, GS3, GS4)',
        '- "tags": Array of 2-3 keyword tags',
    ].join('\n');

    const requestBody = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, topP: 0.9, maxOutputTokens: 4096, responseMimeType: 'application/json' },
    };

    for (const model of GEMINI_MODELS) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                console.log(`[epaper-gen] Generating Quick Bytes with ${model} (attempt ${attempt})...`);
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
                );
                if (!response.ok) {
                    if (response.status === 429) { await sleep(5000); continue; }
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();
                const candidate = data?.candidates?.[0];
                const finishReason = candidate?.finishReason;
                if (finishReason === 'MAX_TOKENS' || finishReason === 'SAFETY') {
                    console.warn(`[epaper-gen] Quick Bytes truncated (${finishReason}), retrying...`);
                    continue;
                }
                const text = candidate?.content?.parts?.[0]?.text || '[]';
                const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                const parsed: QuickByte[] = JSON.parse(cleaned);
                console.log(`[epaper-gen] ✅ Generated ${parsed.length} Quick Bytes`);
                return parsed.slice(0, 12);
            } catch (err: any) {
                console.warn(`[epaper-gen] Quick Bytes failed on ${model} (attempt ${attempt}): ${err.message}`);
                if (attempt < 2) await sleep(3000);
            }
        }
    }
    console.warn('[epaper-gen] Quick Bytes generation failed');
    return [];
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

    // Generate mocks based on today's selected articles
    const mocks = await generateMocks(articles, apiKey);

    // Generate CSAT mocks (comprehension + reasoning)
    const csatMocks = await generateCsatMocks(articles, apiKey);

    // Generate Quick Bytes (static GK + this day in history)
    const quickBytes = await generateQuickBytes(articles, rawArticles, apiKey);

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
        prelimsMocks: mocks.prelimsMocks,
        mainsMocks: mocks.mainsMocks,
        csatMocks,
        quickBytes,
    };
}
