/**
 * CurrentPrep Image Bank Registry — Smart Matching
 * Maps article categories → local images from /public/images/bank/
 * Uses keyword matching to find the MOST RELEVANT image for each article.
 */

import IMAGE_METADATA from './image-metadata';

// All bank categories
const BANK_CATEGORIES = [
    'polity', 'governance', 'economy', 'ir', 'environment',
    'science', 'social', 'security', 'agriculture', 'history',
    'geography', 'ethics', 'disaster',
] as const;

type BankCategory = typeof BANK_CATEGORIES[number];

// Category aliases (map various category names → bank folder)
const CATEGORY_ALIASES: Record<string, BankCategory> = {
    polity: 'polity', 'polity & constitution': 'polity', constitution: 'polity',
    governance: 'governance', 'governance & schemes': 'governance',
    economy: 'economy', 'economy & finance': 'economy', finance: 'economy',
    ir: 'ir', 'international relations': 'ir', international: 'ir', diplomacy: 'ir',
    environment: 'environment', 'environment & ecology': 'environment', ecology: 'environment',
    science: 'science', 'science & technology': 'science', technology: 'science', 's & t': 'science',
    social: 'social', 'social justice': 'social', society: 'social',
    security: 'security', 'internal security': 'security', defense: 'security', defence: 'security',
    agriculture: 'agriculture', farming: 'agriculture',
    history: 'history', 'history & culture': 'history', culture: 'history', heritage: 'history',
    geography: 'geography', 'geography & environment': 'geography',
    ethics: 'ethics', 'ethics & integrity': 'ethics', integrity: 'ethics',
    disaster: 'disaster', 'disaster management': 'disaster',
};

/**
 * Get the bank category for a given article category string
 */
function getBankCategory(articleCategory: string): BankCategory {
    const normalized = articleCategory.toLowerCase().trim();
    return CATEGORY_ALIASES[normalized] || 'polity';
}

/**
 * Tokenize a string into lowercase individual words for matching
 */
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);
}

/**
 * Compute a relevance score between article keywords and image keywords.
 * Higher score = better match.
 */
function computeScore(articleTokens: string[], imageKeywords: string[]): number {
    let score = 0;
    const imageText = imageKeywords.join(' ').toLowerCase();

    for (const token of articleTokens) {
        // Exact word match in any keyword phrase
        for (const kw of imageKeywords) {
            const kwLower = kw.toLowerCase();
            if (kwLower === token) {
                score += 10; // Exact single-word match
            } else if (kwLower.includes(token)) {
                score += 5;  // Partial match within a keyword phrase
            }
        }
        // Also check as substring of the entire keyword string
        if (imageText.includes(token)) {
            score += 2;
        }
    }

    return score;
}

/**
 * Smart Image Matcher — finds the BEST matching image for an article.
 *
 * Strategy:
 * 1. Collect keywords from article: imageDescription, headline, tags, keyTerms
 * 2. Score every image in the matching category against those keywords
 * 3. Return the highest-scoring image
 * 4. Fall back to deterministic pick if no good match found
 */
export function getBankImageUrl(
    articleId: string,
    articleCategory: string,
    articleData?: {
        headline?: string;
        tags?: string[];
        keyTerms?: string[];
        imageDescription?: string;
    }
): string {
    const category = getBankCategory(articleCategory);
    const categoryImages = IMAGE_METADATA[category];

    if (!categoryImages) {
        // Unknown category — return first polity image as fallback
        return '/images/bank/polity/polity-01.jpg';
    }

    const imageFiles = Object.keys(categoryImages);

    // If no article data for matching, use deterministic hash
    if (!articleData || (!articleData.headline && !articleData.tags?.length && !articleData.keyTerms?.length && !articleData.imageDescription)) {
        const hash = simpleHash(articleId);
        const idx = hash % imageFiles.length;
        return `/images/bank/${category}/${imageFiles[idx]}`;
    }

    // Build article token list from all available text
    const articleText = [
        articleData.imageDescription || '',
        articleData.headline || '',
        ...(articleData.tags || []),
        ...(articleData.keyTerms || []),
    ].join(' ');

    const articleTokens = tokenize(articleText);

    // Score each image
    let bestScore = -1;
    let bestFile = imageFiles[0];

    for (const file of imageFiles) {
        const keywords = categoryImages[file];
        const score = computeScore(articleTokens, keywords);

        if (score > bestScore) {
            bestScore = score;
            bestFile = file;
        }
    }

    // If very low match, add some determinism so same article → same image
    if (bestScore < 5) {
        const hash = simpleHash(articleId + articleCategory);
        const idx = hash % imageFiles.length;
        bestFile = imageFiles[idx];
    }

    return `/images/bank/${category}/${bestFile}`;
}

/**
 * Get fallback gradient for when image fails to load
 */
export function getCategoryGradient(articleCategory: string): string {
    const gradients: Record<BankCategory, string> = {
        polity: 'linear-gradient(135deg, #0D47A1, #1976D2)',
        governance: 'linear-gradient(135deg, #1565C0, #42A5F5)',
        economy: 'linear-gradient(135deg, #1B5E20, #43A047)',
        ir: 'linear-gradient(135deg, #4A148C, #7B1FA2)',
        environment: 'linear-gradient(135deg, #00695C, #26A69A)',
        science: 'linear-gradient(135deg, #E65100, #FF9800)',
        social: 'linear-gradient(135deg, #880E4F, #E91E63)',
        security: 'linear-gradient(135deg, #B71C1C, #E53935)',
        agriculture: 'linear-gradient(135deg, #33691E, #7CB342)',
        history: 'linear-gradient(135deg, #4E342E, #795548)',
        geography: 'linear-gradient(135deg, #1A237E, #3F51B5)',
        ethics: 'linear-gradient(135deg, #37474F, #607D8B)',
        disaster: 'linear-gradient(135deg, #BF360C, #FF5722)',
    };
    const category = getBankCategory(articleCategory);
    return gradients[category] || gradients.polity;
}

/**
 * Simple hash for deterministic randomness
 */
function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export { BANK_CATEGORIES, type BankCategory, getBankCategory };
