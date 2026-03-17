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
   PART 1 — KEY FACTS: 5-6 bullet points, each starting with the bullet character. Each bullet must state a concrete, verifiable fact covering: what happened, who/which institution was involved, where/when, specific provisions/data/Acts cited, and consequences or reactions. No vague or generic statements.
   After the bullets, leave one blank line, then write:
   PART 2 — ANALYSIS: A 150-word analytical paragraph covering the policy/governance significance, institutional implications, and connections to constitutional principles, development challenges, or international dimensions. Do NOT use structural headers like "Context:", "Significance:", or "Way Forward:". The analysis must read as premium newspaper prose, naturally weaving in Civil Services syllabus keywords (e.g., federal structure, constitutionalism, fiscal deficit, inclusive growth, biodiversity hotspots, cooperative federalism, SDGs, Article 21). NEVER explicitly mention "UPSC", "syllabus", or "aspirants".

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

RULES:
- NEVER include party-political news, even if it involves a policy topic — skip it
- The KEY FACTS bullets must contain concrete, verifiable facts — never vague statements like "This is significant" or "Experts say"
- The ANALYSIS paragraph must be factual and analytical — NO opinions, NO editorializing
- Every analysis paragraph MUST naturally embed syllabus keywords without explicitly pointing them out
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

    // Limit to exactly 25 articles for optimal printing layout and reading experience
    return allResults.slice(0, 25);
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
    console.log(`[epaper-gen] Generating Mocks from ${articles.length} articles...`);

    const contextTexts = articles
        .slice(0, 10) // taking top 10 to keep within token limits
        .map((a) => `- ${a.headline} (GS: ${a.gsPaper})`)
        .join('\n');

    const prompt = `You are a UPSC mock paper setter. Based strictly on the themes in today's top 10 news headlines below, generate 4 Prelims Mock Questions and 4 Mains Mock Questions.

HEADLINES TODAY:
${contextTexts}

REQUIREMENTS:
1. Prelims Mock: Return EXACTLY 4 actual UPSC Previous Year Prelims Questions from the last 15 years whose themes loosely intersect with the headlines if possible. If no match, provide random robust standard PYQs. No hallucinations in PYQs! Include 4 options per question, mark the exact answer, and provide a 2-3 sentence explanation.
2. Mains Mock: Generate EXACTLY 4 Mains questions (10 or 15 markers) purely based on the specific current affairs provided in the headlines and linking them strictly with the UPSC syllabus. Provide the specific syllabus relevance, and a brief 2-3 sentence approach hint.

Return ONLY valid JSON matching this structure:
{
  "prelimsMocks": [
    { "question": "The question text", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "The correct option text exactly", "explanation": "Detailed explanation..." }
  ],
  "mainsMocks": [
    { "question": "The mains question...", "syllabusMatch": "GS2: Specific topic...", "approach": "Briefly introduce..." }
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

═══════════════════════════════════════════
CATEGORY 2 — LOGICAL REASONING (5 questions)
═══════════════════════════════════════════

⚠️ CRITICAL: These 5 questions must be COMPLETELY INDEPENDENT of any news content. They test pure logical/analytical aptitude using abstract or everyday scenarios. Do NOT reference any current events, policies, government schemes, or news headlines.

Generate exactly 5 questions as follows:

**Q1 — SYLLOGISM (category: "syllogism")**
Give 2-3 statements using "All", "Some", "No" format and ask which conclusion(s) logically follow.
Example style:
"Statements: 1. All managers are leaders. 2. Some leaders are teachers. 3. No teacher is a doctor.
Conclusions: I. Some managers are teachers. II. No manager is a doctor.
Which of the above conclusions logically follows?"
Options should be: "Only I", "Only II", "Both I and II", "Neither I nor II"

**Q2 — STATEMENT & ASSUMPTION or STATEMENT & CONCLUSION (category: "statement_assumption" or "statement_conclusion")**
Give a general statement (about education, traffic, workplace, health, etc. — NOT about today's news) and ask which assumption is implicit or which conclusion follows.
Example style:
"Statement: 'The municipal corporation has decided to increase water supply timings by 2 hours in residential areas during summer.'
Assumptions: I. Residents need more water during summer. II. The municipal corporation has enough water reserves.
Which assumption is implicit?"
Options: "Only I", "Only II", "Both I and II", "Neither I nor II"

**Q3 — ${q3Pick.label.toUpperCase()} (category: "${q3Pick.type}")**
${q3Pick.instruction}

**Q4 — ${q4Pick.label.toUpperCase()} (category: "${q4Pick.type}")**
${q4Pick.instruction}

**Q5 — DECISION MAKING (category: "decision_making")**
Present a scenario where a person (a manager, teacher, officer, etc.) faces a dilemma in everyday professional life. Give 4 possible courses of action. Ask which is the MOST appropriate course of action.
Example style:
"You are the principal of a school. During the annual examination, a teacher reports that a student was found with a cheat sheet. What is the most appropriate course of action?"
Do NOT use politically charged or news-related scenarios.

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
            temperature: 0.6,
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
    };
}
