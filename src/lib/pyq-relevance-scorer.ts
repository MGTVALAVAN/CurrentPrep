/**
 * PYQ-Powered UPSC Relevance Scorer — Phase 3
 *
 * Multi-layer scoring engine that uses the UPSC DNA Profile (upsc-dna.json)
 * to score and rank news articles by their UPSC exam relevance.
 *
 * Layers:
 *   L1 — Topic Weight Match (35%): Maps article's GS/category to expert topic weights
 *   L2 — Entity & Keyword Match (25%): Matches against PYQ entity dictionary & hot keywords
 *   L3 — Prelims Potential Boost (15%): Boosts articles with high Prelims potential rating
 *   L4 — Source Quality (10%): Premium for editorial/explained articles from top sources
 *   L5 — Diversity Rebalancing (15%): Ensures the final 25 articles cover all UPSC topics
 *
 * Usage:
 *   import { scoreArticles, selectBest25 } from './pyq-relevance-scorer';
 *   const scored = scoreArticles(articles);
 *   const final25 = selectBest25(scored);
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';
import type { EpaperArticle } from './epaper-generator';

// ---------------------------------------------------------------------------
// Load UPSC DNA Profile
// ---------------------------------------------------------------------------

interface UPSCDna {
    expertPrelimsWeights: Record<string, number>;
    topicWeights: Record<string, number>;
    entityDictionary: Record<string, { count: number; topics: string[] }>;
    hotKeywords: Array<{ word: string; count: number }>;
    diversityTargets: {
        minTopicsPerEpaper: number;
        idealDistribution: Record<string, number>;
    };
    yearWiseWeights?: Record<number, Record<string, number>>;
}

let _dna: UPSCDna | null = null;

function loadDNA(): UPSCDna {
    if (_dna) return _dna;

    const dnaPath = path.join(process.cwd(), 'src', 'data', 'pyq', 'upsc-dna.json');
    if (!existsSync(dnaPath)) {
        console.warn('[relevance-scorer] upsc-dna.json not found, using fallback weights');
        return getFallbackDNA();
    }

    _dna = JSON.parse(readFileSync(dnaPath, 'utf-8'));
    console.log(`[relevance-scorer] Loaded DNA profile (${Object.keys(_dna!.topicWeights).length} topics, ${Object.keys(_dna!.entityDictionary).length} entities, ${_dna!.hotKeywords.length} keywords)`);
    return _dna!;
}

function getFallbackDNA(): UPSCDna {
    return {
        expertPrelimsWeights: {
            'Economy': 21, 'Environment': 18, 'Polity': 15,
            'Geography': 11, 'Science & Technology': 11, 'Current Affairs & GK': 8,
            'Modern History': 7, 'Ancient History': 6, 'Art & Culture': 2, 'Medieval History': 2,
        },
        topicWeights: {
            'Economy': 100, 'Environment': 86, 'Polity': 71,
            'Geography': 62, 'Science & Technology': 52, 'Current Affairs & GK': 48,
            'Ancient History': 39, 'Society': 35, 'Modern History': 33,
            'International Relations': 30, 'Social Justice': 25, 'Internal Security': 25,
        },
        entityDictionary: {},
        hotKeywords: [],
        diversityTargets: {
            minTopicsPerEpaper: 6,
            idealDistribution: { 'Economy': 5, 'Environment': 4, 'Polity': 4, 'Geography': 3, 'Science & Technology': 3, 'Current Affairs & GK': 2 },
        },
    };
}

// ---------------------------------------------------------------------------
// Category → Topic Mapping
// ---------------------------------------------------------------------------

// Map ePaper categories (from Gemini) to UPSC DNA topic names
const CATEGORY_TO_TOPIC: Record<string, string[]> = {
    'polity': ['Polity'],
    'governance': ['Governance', 'Polity'],
    'economy': ['Economy'],
    'ir': ['International Relations', 'Current Affairs & GK'],
    'environment': ['Environment'],
    'science': ['Science & Technology'],
    'social': ['Society', 'Social Justice'],
    'history': ['Modern History', 'Ancient History'],
    'geography': ['Geography'],
    'security': ['Internal Security'],
    'agriculture': ['Economy', 'Geography'],
    'disaster': ['Disaster Management', 'Environment'],
    'ethics': ['Ethics'],
};

// Map GS papers to primary topic
const GSPAPER_TO_TOPICS: Record<string, string[]> = {
    'GS1': ['Geography', 'Modern History', 'Society', 'Art & Culture', 'Ancient History'],
    'GS2': ['Polity', 'Governance', 'International Relations', 'Social Justice'],
    'GS3': ['Economy', 'Science & Technology', 'Environment', 'Internal Security', 'Disaster Management'],
    'GS4': ['Ethics'],
};

// ---------------------------------------------------------------------------
// Scoring Functions
// ---------------------------------------------------------------------------

export interface ScoredArticle extends EpaperArticle {
    relevanceScore: number;
    scoreBreakdown: {
        topicWeight: number;      // L1: 0-35
        entityKeyword: number;    // L2: 0-25
        prelimsPotentialScore: number; // L3: 0-15
        sourceQuality: number;    // L4: 0-10
        diversityBonus: number;   // L5: 0-15
        total: number;            // 0-100
    };
    matchedEntities: string[];
    matchedKeywords: string[];
    primaryTopic: string;
}

/**
 * Layer 1: Topic Weight Match (max 35 points)
 * Uses expert-verified UPSC Prelims weightage to score based on category/GS paper
 */
function scoreTopicWeight(article: EpaperArticle, dna: UPSCDna): { score: number; primaryTopic: string } {
    // Prioritize category-based mapping (more specific) over GS paper (too broad)
    const catTopics = CATEGORY_TO_TOPIC[article.category] || [];

    // Only use GS paper mapping as fallback if category doesn't give us topics
    const topics = catTopics.length > 0
        ? catTopics
        : (GSPAPER_TO_TOPICS[article.gsPaper] || ['Current Affairs & GK']);

    // Find highest weighted matching topic
    let maxWeight = 0;
    let primaryTopic = topics[0] || 'Current Affairs & GK';

    for (const topic of topics) {
        const weight = dna.topicWeights[topic] || 0;
        if (weight > maxWeight) {
            maxWeight = weight;
            primaryTopic = topic;
        }
    }

    // Normalize: topicWeights are 0-100, scale to 0-35
    const score = Math.round((maxWeight / 100) * 35);
    return { score, primaryTopic };
}

/**
 * Layer 2: Entity & Keyword Match (max 25 points)
 * Matches article text against PYQ entity dictionary and hot keywords
 */
function scoreEntityKeyword(article: EpaperArticle, dna: UPSCDna): { score: number; matchedEntities: string[]; matchedKeywords: string[] } {
    const searchText = `${article.headline} ${article.explainer} ${article.tags.join(' ')} ${article.keyTerms.join(' ')}`.toLowerCase();

    // Entity matching (max 15 points)
    const matchedEntities: string[] = [];
    let entityScore = 0;

    for (const [entity, data] of Object.entries(dna.entityDictionary)) {
        if (entity.length < 3) continue;
        if (searchText.includes(entity)) {
            matchedEntities.push(entity);
            // Score based on frequency in PYQs (more frequent = more important)
            entityScore += Math.min(3, Math.ceil(data.count / 5));
        }
    }
    entityScore = Math.min(15, entityScore);

    // Keyword matching (max 10 points)
    const matchedKeywords: string[] = [];
    let keywordScore = 0;

    const articleWords = new Set(searchText.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length > 3));

    for (const { word, count } of dna.hotKeywords) {
        if (articleWords.has(word)) {
            matchedKeywords.push(word);
            keywordScore += Math.min(2, Math.ceil(count / 20));
            if (matchedKeywords.length >= 15) break; // Cap
        }
    }
    keywordScore = Math.min(10, keywordScore);

    return { score: entityScore + keywordScore, matchedEntities, matchedKeywords };
}

/**
 * Layer 3: Prelims Potential Boost (max 15 points)
 * Uses the AI-assigned prelimsPotential star rating
 */
function scorePrelimsPotential(article: EpaperArticle): number {
    const potential = article.prelimsPotential || 3;
    // 1 star = 3pt, 2 star = 6pt, 3 star = 9pt, 4 star = 12pt, 5 star = 15pt
    return potential * 3;
}

/**
 * Layer 4: Source Quality (max 10 points)
 * Premium sources and editorial/explained sections get higher scores
 */
function scoreSourceQuality(article: EpaperArticle): number {
    let score = 5; // Base score

    // Premium sources
    const premiumSources = ['The Hindu', 'Indian Express', 'Livemint', 'PIB', 'News on AIR', 'Down to Earth'];
    if (premiumSources.some(s => article.source.includes(s))) score += 2;

    // Section bonus
    const premiumSections = ['editorial', 'explained', 'opinion', 'lead', 'national'];
    const sectionLower = (article.section || '').toLowerCase();
    if (premiumSections.some(s => sectionLower.includes(s))) score += 2;

    // Importance bonus
    if (article.importance === 'high') score += 1;

    return Math.min(10, score);
}

/**
 * Score a single article using all layers (except L5 diversity which is applied during selection)
 */
function scoreArticle(article: EpaperArticle, dna: UPSCDna): ScoredArticle {
    const { score: topicWeight, primaryTopic } = scoreTopicWeight(article, dna);
    const { score: entityKeyword, matchedEntities, matchedKeywords } = scoreEntityKeyword(article, dna);
    const prelimsPotentialScore = scorePrelimsPotential(article);
    const sourceQuality = scoreSourceQuality(article);

    const total = topicWeight + entityKeyword + prelimsPotentialScore + sourceQuality;

    return {
        ...article,
        relevanceScore: total,
        scoreBreakdown: {
            topicWeight,
            entityKeyword,
            prelimsPotentialScore,
            sourceQuality,
            diversityBonus: 0, // Applied during selection
            total,
        },
        matchedEntities: matchedEntities.slice(0, 5),
        matchedKeywords: matchedKeywords.slice(0, 10),
        primaryTopic,
    };
}

/**
 * Score all articles using Layers 1-4
 */
export function scoreArticles(articles: EpaperArticle[]): ScoredArticle[] {
    const dna = loadDNA();

    return articles
        .map(a => scoreArticle(a, dna))
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Layer 5: Diversity-Aware Selection (selects final 25 articles)
 *
 * Algorithm:
 * 1. Sort all articles by relevanceScore (L1-L4)
 * 2. For each topic in the ideal distribution, reserve slots
 * 3. Fill reserved slots with highest-scoring articles from that topic
 * 4. Fill remaining slots with highest overall scores
 * 5. Apply diversity bonus to underrepresented topics
 */
export function selectBest25(scored: ScoredArticle[], targetCount: number = 25): ScoredArticle[] {
    const dna = loadDNA();
    const idealDist = dna.diversityTargets.idealDistribution;
    const minTopics = dna.diversityTargets.minTopicsPerEpaper;

    // Group articles by primary topic
    const byTopic: Record<string, ScoredArticle[]> = {};
    for (const a of scored) {
        if (!byTopic[a.primaryTopic]) byTopic[a.primaryTopic] = [];
        byTopic[a.primaryTopic].push(a);
    }

    const selected: ScoredArticle[] = [];
    const selectedIds = new Set<string>();

    // Phase 1: Fill reserved slots per topic
    console.log('[relevance-scorer] Phase 1: Filling reserved topic slots...');
    for (const [topic, idealCount] of Object.entries(idealDist)) {
        const available = (byTopic[topic] || []).filter(a => !selectedIds.has(a.id));
        const toTake = Math.min(idealCount, available.length);

        for (let i = 0; i < toTake && selected.length < targetCount; i++) {
            const article = available[i];
            // Apply diversity bonus
            article.scoreBreakdown.diversityBonus = 10;
            article.scoreBreakdown.total = article.relevanceScore + 10;
            article.relevanceScore = article.scoreBreakdown.total;
            selected.push(article);
            selectedIds.add(article.id);
        }
    }

    console.log(`[relevance-scorer] After Phase 1: ${selected.length} articles from ${new Set(selected.map(a => a.primaryTopic)).size} topics`);

    // Phase 2: Fill remaining slots with highest overall scores
    if (selected.length < targetCount) {
        const remaining = scored
            .filter(a => !selectedIds.has(a.id))
            .sort((a, b) => b.relevanceScore - a.relevanceScore);

        for (const article of remaining) {
            if (selected.length >= targetCount) break;

            // Check if this topic is already overrepresented
            const topicCount = selected.filter(s => s.primaryTopic === article.primaryTopic).length;
            const idealMax = (idealDist[article.primaryTopic] || 2) + 2; // Allow up to ideal + 2

            if (topicCount < idealMax) {
                selected.push(article);
                selectedIds.add(article.id);
            }
        }
    }

    // Phase 3: If still not enough, take any remaining by score
    if (selected.length < targetCount) {
        const remaining = scored
            .filter(a => !selectedIds.has(a.id))
            .sort((a, b) => b.relevanceScore - a.relevanceScore);

        for (const article of remaining) {
            if (selected.length >= targetCount) break;
            selected.push(article);
            selectedIds.add(article.id);
        }
    }

    // Ensure minimum topic diversity
    const topicsCovered = new Set(selected.map(a => a.primaryTopic)).size;
    if (topicsCovered < minTopics) {
        console.warn(`[relevance-scorer] ⚠️ Only ${topicsCovered} topics covered (target: ${minTopics})`);
    }

    // Final sort by the composite score
    selected.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Log distribution
    const topicDist: Record<string, number> = {};
    for (const a of selected) topicDist[a.primaryTopic] = (topicDist[a.primaryTopic] || 0) + 1;
    console.log('[relevance-scorer] Final distribution:');
    Object.entries(topicDist)
        .sort(([, a], [, b]) => b - a)
        .forEach(([topic, count]) => {
            const ideal = idealDist[topic] || '?';
            const bar = '█'.repeat(count);
            console.log(`  ${topic.padEnd(25)} ${count} (ideal: ${ideal}) ${bar}`);
        });

    console.log(`[relevance-scorer] Selected ${selected.length} articles, ${topicsCovered} topics`);
    console.log(`[relevance-scorer] Score range: ${selected[selected.length - 1]?.relevanceScore || 0} - ${selected[0]?.relevanceScore || 0}`);

    return selected.slice(0, targetCount);
}

/**
 * Full pipeline: score + select best 25 with diversity balancing
 */
export function rankAndSelect(articles: EpaperArticle[], count: number = 25): ScoredArticle[] {
    console.log(`[relevance-scorer] 🧬 Scoring ${articles.length} articles with PYQ DNA...`);
    const scored = scoreArticles(articles);
    const selected = selectBest25(scored, count);
    return selected;
}
