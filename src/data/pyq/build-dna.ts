/**
 * UPSC DNA Profile Builder — Phase 2
 * Analyzes pyq-database.json to create a comprehensive "UPSC DNA" profile
 * used by the relevance scoring engine.
 *
 * Output: src/data/pyq/upsc-dna.json
 *
 * Usage: npx tsx src/data/pyq/build-dna.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const INPUT_FILE = path.join(process.cwd(), 'src', 'data', 'pyq', 'pyq-database.json');
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'data', 'pyq', 'upsc-dna.json');

// ---------------------------------------------------------------------------
// Load PYQ Database
// ---------------------------------------------------------------------------

const db = JSON.parse(readFileSync(INPUT_FILE, 'utf-8'));
const questions: any[] = db.questions;

console.log('🧬 UPSC DNA Profile Builder');
console.log('='.repeat(60));
console.log(`📊 Input: ${questions.length} questions (${db.metadata.prelimsQuestions || 0} Prelims + ${db.metadata.mainsQuestions || 0} Mains)`);
console.log(`📅 Range: ${db.metadata.yearRange}\n`);

// ---------------------------------------------------------------------------
// 1. Topic Frequency Map
// ---------------------------------------------------------------------------

const topicFreq: Record<string, { total: number; prelims: number; mains: number; pct: number }> = {};

for (const q of questions) {
    if (!topicFreq[q.topic]) topicFreq[q.topic] = { total: 0, prelims: 0, mains: 0, pct: 0 };
    topicFreq[q.topic].total++;
    if (q.paper?.includes('Prelims')) topicFreq[q.topic].prelims++;
    if (q.paper?.includes('Mains')) topicFreq[q.topic].mains++;
}

for (const t of Object.values(topicFreq)) {
    t.pct = Math.round((t.total / questions.length) * 1000) / 10;
}

console.log('📑 Topic Frequency:');
Object.entries(topicFreq)
    .sort(([, a], [, b]) => b.total - a.total)
    .forEach(([topic, data]) => {
        const bar = '█'.repeat(Math.round(data.pct / 2));
        console.log(`  ${topic.padEnd(28)} ${String(data.total).padStart(4)} (${String(data.pct).padStart(5)}%) P:${data.prelims} M:${data.mains}  ${bar}`);
    });

// ---------------------------------------------------------------------------
// 2. Subtopic Frequency Map
// ---------------------------------------------------------------------------

const subtopicFreq: Record<string, { topic: string; total: number; pct: number }> = {};

for (const q of questions) {
    const key = `${q.topic}/${q.subtopic}`;
    if (!subtopicFreq[key]) subtopicFreq[key] = { topic: q.topic, total: 0, pct: 0 };
    subtopicFreq[key].total++;
}

for (const s of Object.values(subtopicFreq)) {
    s.pct = Math.round((s.total / questions.length) * 1000) / 10;
}

console.log('\n📁 Top 30 Subtopics:');
Object.entries(subtopicFreq)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 30)
    .forEach(([sub, data]) => {
        console.log(`  ${sub.padEnd(55)} ${String(data.total).padStart(3)} (${data.pct}%)`);
    });

// ---------------------------------------------------------------------------
// 3. Year-wise Trend Analysis (for recent 10 years)
// ---------------------------------------------------------------------------

const yearTopicMatrix: Record<number, Record<string, number>> = {};

for (const q of questions) {
    if (q.year < 2013) continue;
    if (!yearTopicMatrix[q.year]) yearTopicMatrix[q.year] = {};
    yearTopicMatrix[q.year][q.topic] = (yearTopicMatrix[q.year][q.topic] || 0) + 1;
}

// Calculate trending topics (increasing frequency in last 5 years vs prior 5)
const trendingTopics: Record<string, { recent: number; prior: number; trend: number; direction: string }> = {};
const recentYears = [2021, 2022, 2023, 2024, 2025];
const priorYears = [2016, 2017, 2018, 2019, 2020];

const allTopics = Array.from(new Set(questions.map((q: any) => q.topic)));
for (const topic of allTopics) {
    let recent = 0, prior = 0;
    for (const y of recentYears) recent += (yearTopicMatrix[y]?.[topic] || 0);
    for (const y of priorYears) prior += (yearTopicMatrix[y]?.[topic] || 0);

    const avgRecent = recent / recentYears.length;
    const avgPrior = prior / priorYears.length || 0.1;
    const trend = Math.round(((avgRecent - avgPrior) / avgPrior) * 100);
    const direction = trend > 20 ? '📈 Rising' : trend < -20 ? '📉 Declining' : '➡️ Steady';

    trendingTopics[topic] = { recent, prior, trend, direction };
}

console.log('\n📈 Topic Trends (2021-25 vs 2016-20):');
Object.entries(trendingTopics)
    .sort(([, a], [, b]) => b.trend - a.trend)
    .forEach(([topic, data]) => {
        console.log(`  ${data.direction} ${topic.padEnd(25)} ${data.prior}->${data.recent} (${data.trend > 0 ? '+' : ''}${data.trend}%)`);
    });

// ---------------------------------------------------------------------------
// 4. GS Paper Distribution
// ---------------------------------------------------------------------------

const gsPaperDist: Record<string, number> = {};
for (const q of questions) {
    gsPaperDist[q.gsPaper] = (gsPaperDist[q.gsPaper] || 0) + 1;
}

console.log('\n📋 GS Paper Distribution:');
Object.entries(gsPaperDist)
    .sort()
    .forEach(([gs, count]) => {
        const pct = ((count / questions.length) * 100).toFixed(1);
        console.log(`  ${gs}: ${count} (${pct}%)`);
    });

// ---------------------------------------------------------------------------
// 5. Entity Dictionary (from Prelims questions)
// ---------------------------------------------------------------------------

const entityFreq: Record<string, { count: number; topics: Set<string> }> = {};
const prelimsQs = questions.filter(q => q.paper?.includes('Prelims'));

for (const q of prelimsQs) {
    if (q.entities && Array.isArray(q.entities)) {
        for (const ent of q.entities) {
            const key = ent.toLowerCase().trim();
            if (key.length < 3) continue;
            if (!entityFreq[key]) entityFreq[key] = { count: 0, topics: new Set() };
            entityFreq[key].count++;
            entityFreq[key].topics.add(q.topic);
        }
    }
}

// Also extract entities from question text using patterns
const entityPatterns = [
    /Article\s+\d+[A-Z]?(?:\s*\([a-z0-9]+\))?/gi,
    /(?:the\s+)?(?:\w+\s+){0,2}Act(?:,?\s+\d{4})?/gi,
    /Schedule\s+[IVXLCDM]+(?:\s+of\s+the\s+Constitution)?/gi,
    /Part\s+[IVXLCDM]+(?:\s+of\s+the\s+Constitution)?/gi,
    /(?:UNESCO|IUCN|UNFCCC|WHO|WTO|IMF|World Bank|ASEAN|BRICS|SAARC|G20|NITI\s+Aayog|RBI|SEBI|ISRO|CAG|NHRC|NCST|NCSC|NGT)/gi,
    /(?:National\s+(?:Green|Human Rights|Commission|Board|Authority)\s+\w+)/gi,
    /(?:Sustainable\s+Development\s+Goals?|SDGs?|Paris\s+Agreement|Kyoto\s+Protocol|Montreal\s+Protocol)/gi,
    /(?:Fundamental\s+Rights?|Directive\s+Principles?|DPSPs?|Fundamental\s+Duties)/gi,
    /(?:Lok\s+Sabha|Rajya\s+Sabha|Supreme\s+Court|High\s+Court|Finance\s+Commission)/gi,
    /(?:GST|FDI|GDP|GNP|NPA|SLR|CRR|Repo\s+Rate|MGNREGA|PMAY|Ayushman\s+Bharat)/gi,
];

for (const q of questions) {
    const fullText = q.question + ' ' + (q.options?.join(' ') || '');
    for (const pattern of entityPatterns) {
        let match;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(fullText)) !== null) {
            const ent = match[0].trim().toLowerCase();
            if (ent.length < 3 || ent.length > 60) continue;
            if (!entityFreq[ent]) entityFreq[ent] = { count: 0, topics: new Set() };
            entityFreq[ent].count++;
            entityFreq[ent].topics.add(q.topic);
        }
    }
}

// Convert entities to serializable format
const entityDict: Record<string, { count: number; topics: string[] }> = {};
for (const [key, val] of Object.entries(entityFreq)) {
    if (val.count >= 2) { // Only include entities mentioned 2+ times
        entityDict[key] = { count: val.count, topics: Array.from(val.topics) };
    }
}

console.log(`\n🏛️ Entity Dictionary: ${Object.keys(entityDict).length} unique entities (freq >= 2)`);
Object.entries(entityDict)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 25)
    .forEach(([ent, data]) => {
        console.log(`  ${ent.padEnd(40)} ${String(data.count).padStart(3)} [${data.topics.join(', ')}]`);
    });

// ---------------------------------------------------------------------------
// 6. UPSC "Hot Keywords" — words that appear disproportionately in PYQs
// ---------------------------------------------------------------------------

const wordFreq: Record<string, number> = {};
const stopwords = new Set(['the', 'of', 'in', 'and', 'to', 'a', 'is', 'that', 'for', 'it', 'with', 'as', 'was', 'on', 'are', 'by', 'this', 'an', 'be', 'its', 'or', 'from', 'at', 'has', 'which', 'have', 'not', 'but', 'been', 'they', 'their', 'one', 'can', 'what', 'who', 'when', 'how', 'all', 'each', 'do', 'does', 'if', 'may', 'will', 'about', 'would', 'should', 'could', 'than', 'other', 'into', 'only', 'also', 'after', 'more', 'some', 'such', 'them', 'between', 'these', 'those', 'most', 'because', 'any', 'both', 'above', 'below', 'given', 'following', 'among', 'consider', 'correct', 'statements', 'statement', 'answer', 'select', 'code', 'respect', 'context', 'reference', 'regard', 'regarding', 'discuss', 'examine', 'explain', 'describe', 'analyze', 'comment', 'highlight', 'evaluate', 'illustrate', 'elucidate', 'none', 'known', 'called', 'made', 'used', 'using', 'under']);

for (const q of questions) {
    const words = q.question.toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length > 3 && !stopwords.has(w));

    for (const w of words) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
}

const hotKeywords = Object.entries(wordFreq)
    .filter(([, count]) => count >= 5)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 200)
    .map(([word, count]) => ({ word, count }));

console.log(`\n🔥 Top 30 UPSC Hot Keywords:`);
hotKeywords.slice(0, 30).forEach(({ word, count }) => {
    console.log(`  ${word.padEnd(25)} ${count}`);
});

// ---------------------------------------------------------------------------
// 7. Expert-Verified Topic Weights (from Education Province 2011-2024 analysis)
//    Source: UPSC Prelims Subjectwise Weightage chart
//    These are the ACTUAL average % of questions per subject (out of 100).
//    Our scraped data was skewed due to 404 gaps; these are ground truth.
// ---------------------------------------------------------------------------

// Official UPSC Prelims subject weights (2011-2024 average, from Education Province)
const EXPERT_PRELIMS_WEIGHTS: Record<string, number> = {
    'Economy': 21,                   // Highest! 11-29 questions per year
    'Environment': 18,               // 12-24 questions per year
    'Polity': 15,                    // 7-23 questions per year
    'Geography': 11,                 // 3-13 questions per year
    'Science & Technology': 11,      // 7-15 questions per year
    'Current Affairs & GK': 8,       // 0-16 questions per year
    'Modern History': 7,             // 3-13 questions per year
    'Ancient History': 6,            // 1-10 questions per year
    'Art & Culture': 2,              // 0-10 questions per year
    'Medieval History': 2,           // 0-6 questions per year
};

// Combined weights: blend Prelims weights with Mains importance
// Mains adds: Society, International Relations, Ethics, etc.
const topicWeights: Record<string, number> = {};

// Start with expert Prelims weights (normalized to 0-100)
const maxWeight = Math.max(...Object.values(EXPERT_PRELIMS_WEIGHTS));
for (const [topic, weight] of Object.entries(EXPERT_PRELIMS_WEIGHTS)) {
    topicWeights[topic] = Math.round((weight / maxWeight) * 100);
}

// Add Mains-only topics with appropriate weights
const MAINS_ONLY_WEIGHTS: Record<string, number> = {
    'Society': 35,                   // High Mains GS1 importance
    'International Relations': 30,   // High Mains GS2 importance
    'Social Justice': 25,            // Mains GS2
    'Internal Security': 25,         // Mains GS3
    'Governance': 20,                // Mains GS2
    'Disaster Management': 15,       // Mains GS3
    'Post-Independence': 15,         // Mains GS1
    'World History': 15,             // Mains GS1
    'Ethics': 10,                    // Mains GS4 (less relevant for news scoring)
    'Essay': 5,                      // Mains Essay
};

for (const [topic, weight] of Object.entries(MAINS_ONLY_WEIGHTS)) {
    if (!topicWeights[topic]) topicWeights[topic] = weight;
}

// Apply trend bonus — boost topics that are trending up
for (const [topic, trend] of Object.entries(trendingTopics)) {
    if (topicWeights[topic] && trend.trend > 30) {
        topicWeights[topic] = Math.min(100, topicWeights[topic] + 10);
    }
}

console.log('\n⚖️ Topic Importance Weights (Expert-Verified, 0-100):');
Object.entries(topicWeights)
    .sort(([, a], [, b]) => b - a)
    .forEach(([topic, weight]) => {
        const bar = '█'.repeat(Math.round(weight / 3));
        const source = EXPERT_PRELIMS_WEIGHTS[topic] ? `[P:${EXPERT_PRELIMS_WEIGHTS[topic]}%]` : '[Mains]';
        console.log(`  ${topic.padEnd(28)} ${String(weight).padStart(3)} ${source.padEnd(10)} ${bar}`);
    });

// Year-wise expert weights for recent trends (from the screenshot data)
const yearWiseWeights: Record<number, Record<string, number>> = {
    2024: { 'Economy': 16, 'Environment': 19, 'Polity': 16, 'Geography': 15, 'Science & Technology': 7, 'Current Affairs & GK': 14, 'Modern History': 3, 'Ancient History': 5, 'Art & Culture': 2, 'Medieval History': 1 },
    2023: { 'Economy': 16, 'Environment': 18, 'Polity': 15, 'Geography': 10, 'Science & Technology': 9, 'Current Affairs & GK': 14, 'Modern History': 3, 'Ancient History': 9, 'Art & Culture': 0, 'Medieval History': 2 },
    2022: { 'Economy': 20, 'Environment': 17, 'Polity': 11, 'Geography': 12, 'Science & Technology': 14, 'Current Affairs & GK': 13, 'Modern History': 8, 'Ancient History': 8, 'Art & Culture': 0, 'Medieval History': 4 },
    2021: { 'Economy': 15, 'Environment': 15, 'Polity': 17, 'Geography': 12, 'Science & Technology': 11, 'Current Affairs & GK': 7, 'Modern History': 8, 'Ancient History': 7, 'Art & Culture': 3, 'Medieval History': 5 },
    2020: { 'Economy': 20, 'Environment': 18, 'Polity': 18, 'Geography': 10, 'Science & Technology': 11, 'Current Affairs & GK': 4, 'Modern History': 8, 'Ancient History': 10, 'Art & Culture': 0, 'Medieval History': 1 },
};

// ---------------------------------------------------------------------------
// 8. Build and Save DNA Profile
// ---------------------------------------------------------------------------

const dnaProfile = {
    metadata: {
        generatedAt: new Date().toISOString(),
        sourceQuestions: questions.length,
        prelimsQuestions: prelimsQs.length,
        mainsQuestions: questions.length - prelimsQs.length,
        yearRange: db.metadata.yearRange,
        version: '2.0',
        weightSource: 'Expert-verified from Education Province UPSC Prelims Subjectwise Weightage 2011-2024',
    },

    // Expert-verified topic weights (THE ground truth for relevance scoring)
    expertPrelimsWeights: EXPERT_PRELIMS_WEIGHTS,
    yearWiseWeights,
    topicWeights,

    // Topic-level analysis from our data
    topicFrequency: topicFreq,
    gsPaperDistribution: gsPaperDist,

    // Subtopic analysis (top 100)
    subtopicFrequency: Object.fromEntries(
        Object.entries(subtopicFreq)
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, 100)
    ),

    // Trend analysis
    trendingTopics: Object.fromEntries(
        Object.entries(trendingTopics).map(([k, v]) => [k, { ...v, direction: v.direction.replace(/[📈📉➡️]/g, '').trim() }])
    ),
    yearTopicMatrix,

    // Entity dictionary (for matching against news items)
    entityDictionary: entityDict,

    // Hot keywords (for keyword matching)
    hotKeywords: hotKeywords.slice(0, 200),

    // Diversity targets (ideal distribution for a balanced 25-item ePaper)
    // Based on EXPERT Prelims weights, NOT our scraped data
    diversityTargets: {
        minTopicsPerEpaper: 6,
        // For 25 news items, distribute according to expert weights
        idealDistribution: {
            'Economy': 5,               // 21% = ~5 items (highest priority!)
            'Environment': 4,           // 18% = ~4 items
            'Polity': 4,               // 15% = ~4 items
            'Geography': 3,            // 11% = ~3 items
            'Science & Technology': 3, // 11% = ~3 items
            'Current Affairs & GK': 2, // 8% = ~2 items
            'Modern History': 1,       // 7% = ~1 item
            'International Relations': 1, // Mains relevance
            'Society': 1,              // Mains GS1
            'Internal Security': 1,    // Mains GS3
        },
    },
};

writeFileSync(OUTPUT_FILE, JSON.stringify(dnaProfile, null, 2));

console.log(`\n${'='.repeat(60)}`);
console.log('🧬 UPSC DNA PROFILE COMPLETE');
console.log(`${'='.repeat(60)}`);
console.log(`📊 Topics: ${Object.keys(topicFreq).length}`);
console.log(`📁 Subtopics: ${Object.keys(subtopicFreq).length}`);
console.log(`🏛️ Entities: ${Object.keys(entityDict).length}`);
console.log(`🔥 Hot Keywords: ${hotKeywords.length}`);
console.log(`💾 Output: ${OUTPUT_FILE}`);
