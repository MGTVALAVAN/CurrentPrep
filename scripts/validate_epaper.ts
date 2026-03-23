/**
 * ePaper Pre-Send Validation Script
 * 
 * Runs automated checks on the generated ePaper data before sending email.
 * Exit code 0 = all checks passed, 1 = critical failures found.
 * 
 * Usage: npx tsx validate_epaper.ts [date]
 *   date defaults to today (YYYY-MM-DD)
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

// ── Types (mirrored from epaper-generator) ──────────────────────────────────

interface EpaperArticle {
    id: string;
    headline: string;
    explainer: string;
    category: string;
    gsPaper: string;
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

interface MockQuestion {
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
}

interface MainsMockQuestion {
    question: string;
    syllabusMatch: string;
    approach: string;
}

interface CsatComprehension {
    passage: string;
    questions: {
        question: string;
        options: string[];
        answer: string;
        explanation: string;
    }[];
}

interface CsatReasoning {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    category?: string;
}

interface QuickByte {
    text: string;
    category: string;
    gsPaper: string;
    tags: string[];
}

interface DailyEpaper {
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

// ── Helpers ─────────────────────────────────────────────────────────────────

const PASS = '✅';
const FAIL = '❌';
const WARN = '⚠️';

let criticalFailures = 0;
let warnings = 0;
let passes = 0;

function check(label: string, condition: boolean, critical: boolean = true): void {
    if (condition) {
        console.log(`  ${PASS} ${label}`);
        passes++;
    } else if (critical) {
        console.log(`  ${FAIL} ${label}`);
        criticalFailures++;
    } else {
        console.log(`  ${WARN} ${label}`);
        warnings++;
    }
}

function section(title: string): void {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  ${title}`);
    console.log(`${'─'.repeat(60)}`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const today = new Date();
    const dateArg = process.argv[2] || today.toISOString().split('T')[0];

    console.log(`\n📰 ePaper Pre-Send Validation — ${dateArg}`);
    console.log(`   Run at: ${today.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

    // ── 1. File Existence ───────────────────────────────────────────────────
    section('1. DATA FILE');

    const dataDir = path.join(process.cwd(), 'src', 'data', 'epaper');
    const filePath = path.join(dataDir, `epaper-${dateArg}.json`);

    check(`ePaper JSON file exists: epaper-${dateArg}.json`, existsSync(filePath));

    if (!existsSync(filePath)) {
        console.log(`\n${FAIL} FATAL: No ePaper data file found. Cannot proceed.\n`);
        process.exit(1);
    }

    let epaper: DailyEpaper;
    try {
        epaper = JSON.parse(readFileSync(filePath, 'utf-8'));
        check('JSON is valid and parseable', true);
    } catch (e) {
        check('JSON is valid and parseable', false);
        console.log(`\n${FAIL} FATAL: Corrupted JSON file. Cannot proceed.\n`);
        process.exit(1);
    }

    // ── 2. Date & Metadata ──────────────────────────────────────────────────
    section('2. DATE & METADATA');

    check(`Date matches: ${epaper.date} === ${dateArg}`, epaper.date === dateArg);
    check(`dateFormatted is set: "${epaper.dateFormatted}"`, !!epaper.dateFormatted);
    check(`lastUpdated is set`, !!epaper.lastUpdated);
    check(`edition number is set: ${epaper.edition}`, epaper.edition > 0);

    // ── 3. Articles Count & Structure ───────────────────────────────────────
    section('3. ARTICLES');

    const articles = epaper.articles;
    check(`At least 15 articles (got ${articles.length})`, articles.length >= 15);
    check(`No more than 20 articles (got ${articles.length})`, articles.length <= 20, false);

    // Check for duplicates
    const headlines = articles.map(a => a.headline);
    const uniqueHeadlines = new Set(headlines);
    check(`No duplicate headlines (${uniqueHeadlines.size}/${headlines.length})`, uniqueHeadlines.size === headlines.length);

    const ids = articles.map(a => a.id);
    const uniqueIds = new Set(ids);
    check(`No duplicate IDs`, uniqueIds.size === ids.length);

    // ── 4. GS Paper Coverage ────────────────────────────────────────────────
    section('4. GS PAPER COVERAGE');

    const gsPapers = new Set(articles.map(a => a.gsPaper));
    check(`GS1 covered`, gsPapers.has('GS1'), false);
    check(`GS2 covered`, gsPapers.has('GS2'));
    check(`GS3 covered`, gsPapers.has('GS3'));
    check(`GS4 covered`, gsPapers.has('GS4'), false);

    const gsCount: Record<string, number> = {};
    articles.forEach(a => { gsCount[a.gsPaper] = (gsCount[a.gsPaper] || 0) + 1; });
    console.log(`  📊 Distribution: ${Object.entries(gsCount).map(([k, v]) => `${k}=${v}`).join(', ')}`);

    const maxGS = Math.max(...Object.values(gsCount));
    check(`No single GS paper dominates (max ${maxGS}/${articles.length}, <60%)`, maxGS / articles.length < 0.6, false);

    // ── 5. Category Coverage ────────────────────────────────────────────────
    section('5. CATEGORY COVERAGE');

    const categories = new Set(articles.map(a => a.category));
    check(`At least 4 categories covered (got ${categories.size})`, categories.size >= 4);
    console.log(`  📊 Categories: ${Array.from(categories).join(', ')}`);

    // ── 6. Per-Article Quality ──────────────────────────────────────────────
    section('6. PER-ARTICLE QUALITY');

    let articleIssues = 0;

    articles.forEach((a, i) => {
        const issues: string[] = [];

        // Headline
        if (!a.headline || a.headline.length < 10) issues.push('headline too short');
        if (a.headline && a.headline.length > 120) issues.push('headline too long');

        // Explainer
        if (!a.explainer) issues.push('missing explainer');
        if (typeof a.explainer === 'string' && a.explainer.length < 50) issues.push('explainer too short');

        // Category & GS
        if (!a.category) issues.push('missing category');
        if (!a.gsPaper) issues.push('missing gsPaper');

        // Source
        if (!a.source) issues.push('missing source');

        // Key Terms
        if (!a.keyTerms || a.keyTerms.length === 0) issues.push('no keyTerms');

        // Importance
        if (!['high', 'medium', 'low'].includes(a.importance)) issues.push('invalid importance');

        // Prelims
        if (a.prelims && (!a.prelimsPoints || a.prelimsPoints.length === 0)) issues.push('prelims=true but no points');

        // Mains
        if (a.mains && (!a.mainsPoints || a.mainsPoints.length === 0)) issues.push('mains=true but no points');

        if (issues.length > 0) {
            console.log(`  ${WARN} Article ${i + 1}: "${a.headline?.substring(0, 50)}..." → ${issues.join(', ')}`);
            articleIssues++;
        }
    });

    if (articleIssues === 0) {
        console.log(`  ${PASS} All ${articles.length} articles pass structure checks`);
    } else {
        check(`Article structure issues: ${articleIssues} articles have warnings`, articleIssues < 5, false);
    }

    // Lead article
    const lead = articles[0];
    check(`Lead article importance is "high" (got "${lead?.importance}")`, lead?.importance === 'high', false);
    check(`Lead article has trivia/Did You Know`, !!lead?.trivia, false);

    // ── 6b. Explainer Format (Bullet Parsing) ───────────────────────────────
    section('6b. EXPLAINER FORMAT (BULLET PARSING)');

    let bulletFormatIssues = 0;
    articles.forEach((a, i) => {
        if (typeof a.explainer !== 'string') return;
        const raw = a.explainer;
        // Check if explainer has recognizable bullets (•, *, or PART 1/PART 2 structure)
        const hasBullets = raw.includes('•');
        const hasMarkdownBullets = /^\*\s{1,}/m.test(raw);
        const hasPartStructure = /PART\s*1/i.test(raw) && /PART\s*2/i.test(raw);
        const hasBulletFormat = hasBullets || hasMarkdownBullets || hasPartStructure;

        if (!hasBulletFormat) {
            // Raw paragraph-only explainer — still acceptable but flag it
            console.log(`  ${WARN} Article ${i + 1}: "${a.headline?.substring(0, 50)}..." — no bullet/fact format detected`);
            bulletFormatIssues++;
        }
    });
    if (bulletFormatIssues === 0) {
        console.log(`  ${PASS} All ${articles.length} articles have parseable bullet format`);
    } else {
        check(`Explainer format issues: ${bulletFormatIssues} articles lack bullet format`, bulletFormatIssues <= 3, false);
    }

    // ── 6c. Analysis Passage Completeness ────────────────────────────────
    section('6c. ANALYSIS PASSAGE COMPLETENESS');

    let missingPassageCount = 0;
    const MIN_PASSAGE_CHARS = 500;
    articles.forEach((a, i) => {
        if (typeof a.explainer !== 'string') return;
        const lines = a.explainer.split('\n').filter((l: string) => l.trim());
        const bullets = lines.filter((l: string) => l.trim().startsWith('•'));
        const passageLines = lines.filter((l: string) => !l.trim().startsWith('•'));
        const passageText = passageLines.join(' ').trim();

        if (bullets.length === 0) {
            console.log(`  ${WARN} Article ${i + 1}: "${a.headline?.substring(0, 50)}..." — no bullet points`);
            missingPassageCount++;
        } else if (passageText.length < MIN_PASSAGE_CHARS) {
            console.log(`  ${FAIL} Article ${i + 1}: "${a.headline?.substring(0, 50)}..." — analysis passage too short (${passageText.length} chars, need ≥${MIN_PASSAGE_CHARS})`);
            missingPassageCount++;
        }
    });
    if (missingPassageCount === 0) {
        console.log(`  ${PASS} All ${articles.length} articles have bullet points + substantive analysis passage`);
    }
    check(`All articles have complete analysis passages (${missingPassageCount} incomplete)`, missingPassageCount === 0);

    // ── 7. Highlights ───────────────────────────────────────────────────────
    section('7. HIGHLIGHTS');

    check(`Highlights array exists`, !!epaper.highlights);
    check(`At least 3 highlights (got ${epaper.highlights?.length || 0})`, (epaper.highlights?.length || 0) >= 3);

    // ── 8. Prelims Mock Questions ───────────────────────────────────────────
    section('8. PRELIMS MOCK QUESTIONS');

    const prelims = epaper.prelimsMocks || [];
    check(`Prelims mocks exist`, prelims.length > 0);
    check(`At least 4 prelims questions (got ${prelims.length})`, prelims.length >= 4);
    check(`Ideally 5 prelims questions (got ${prelims.length})`, prelims.length >= 5, false);

    prelims.forEach((q, i) => {
        const issues: string[] = [];
        if (!q.question || q.question.length < 20) issues.push('question too short');
        if (!q.options || q.options.length !== 4) issues.push(`expected 4 options, got ${q.options?.length || 0}`);
        if (!q.answer) issues.push('missing answer');
        if (!q.explanation) issues.push('missing explanation');

        if (issues.length > 0) {
            console.log(`  ${WARN} Q${i + 1}: ${issues.join(', ')}`);
        }
    });

    if (prelims.every(q => q.question && q.options?.length === 4 && q.answer && q.explanation)) {
        console.log(`  ${PASS} All prelims questions have complete structure`);
    }

    // Deduplication check against past ePapers
    const normQ = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    const pastPrelims: string[] = [];
    const pastMains: string[] = [];
    try {
        const epaperDir = path.join(process.cwd(), 'src', 'data', 'epaper');
        const pastFiles = require('fs').readdirSync(epaperDir)
            .filter((f: string) => f.startsWith('epaper-') && f.endsWith('.json') && f !== 'epaper-index.json' && !f.includes(dateArg))
            .sort().reverse().slice(0, 14);
        for (const f of pastFiles) {
            try {
                const d = JSON.parse(readFileSync(path.join(epaperDir, f), 'utf-8'));
                if (d.prelimsMocks) d.prelimsMocks.forEach((q: any) => { if (q.question) pastPrelims.push(q.question); });
                if (d.mainsMocks) d.mainsMocks.forEach((q: any) => { if (q.question) pastMains.push(q.question); });
            } catch { continue; }
        }
    } catch { /* ignore */ }

    const prelimsDups = prelims.filter(q => {
        const norm = normQ(q.question).substring(0, 60);
        return pastPrelims.some(p => normQ(p).substring(0, 60) === norm && norm.length > 20);
    });
    if (prelimsDups.length > 0) {
        console.log(`  ${WARN} ${prelimsDups.length} prelims question(s) repeated from past ePapers:`);
        prelimsDups.forEach(q => console.log(`    → ${q.question.substring(0, 80)}...`));
    }
    check(`No duplicate prelims questions (${prelimsDups.length} repeated)`, prelimsDups.length === 0, false);

    // ── 9. Mains Mock Questions ─────────────────────────────────────────────
    section('9. MAINS MOCK QUESTIONS');

    const mains = epaper.mainsMocks || [];
    check(`Mains mocks exist`, mains.length > 0);
    check(`At least 4 mains questions (got ${mains.length})`, mains.length >= 4);
    check(`Ideally 5 mains questions (got ${mains.length})`, mains.length >= 5, false);

    mains.forEach((q, i) => {
        const issues: string[] = [];
        if (!q.question || q.question.length < 20) issues.push('question too short');
        if (!q.syllabusMatch) issues.push('missing syllabusMatch');
        if (!q.approach) issues.push('missing approach');

        if (issues.length > 0) {
            console.log(`  ${WARN} Q${i + 1}: ${issues.join(', ')}`);
        }
    });

    if (mains.every(q => q.question && q.syllabusMatch && q.approach)) {
        console.log(`  ${PASS} All mains questions have complete structure`);
    }

    // Check approach text is substantive enough to be visible in print
    const shortApproaches = mains.filter(q => q.approach && q.approach.length < 30);
    if (shortApproaches.length > 0) {
        check(`Mains approach text substantive (${shortApproaches.length} too short)`, false, false);
    } else {
        check(`All mains approach texts are substantive (>30 chars)`, true);
    }

    // Check approach text won't overflow when rendered on print page
    const MAX_APPROACH_CHARS = 400;
    const longApproaches = mains.filter(q => q.approach && q.approach.length > MAX_APPROACH_CHARS);
    if (longApproaches.length > 0) {
        console.log(`  ${WARN} ${longApproaches.length} mains approach(es) exceed ${MAX_APPROACH_CHARS} chars — may clip on print page:`);
        longApproaches.forEach((q, _i) => {
            const qIdx = mains.indexOf(q) + 1;
            console.log(`    → Q${qIdx}: ${q.approach.length} chars`);
        });
    }
    check(`Mains approach texts fit print page (≤${MAX_APPROACH_CHARS} chars each)`, longApproaches.length === 0, false);

    // Deduplication check for Mains
    const mainsDups = mains.filter(q => {
        const norm = normQ(q.question).substring(0, 60);
        return pastMains.some(p => normQ(p).substring(0, 60) === norm && norm.length > 20);
    });
    if (mainsDups.length > 0) {
        console.log(`  ${WARN} ${mainsDups.length} mains question(s) repeated from past ePapers:`);
        mainsDups.forEach(q => console.log(`    → ${q.question.substring(0, 80)}...`));
    }
    check(`No duplicate mains questions (${mainsDups.length} repeated)`, mainsDups.length === 0, false);

    // ── 9b. CSAT Mock Questions ─────────────────────────────────────────────
    section('9b. CSAT MOCK QUESTIONS');

    const csatMocks = epaper.csatMocks;
    check(`CSAT mocks object exists`, !!csatMocks);

    if (csatMocks) {
        // Comprehension
        const comprehension = csatMocks.comprehension || [];
        check(`CSAT comprehension passages exist (got ${comprehension.length})`, comprehension.length > 0);
        check(`At least 1 comprehension passage`, comprehension.length >= 1);

        comprehension.forEach((passage, i) => {
            const issues: string[] = [];
            if (!passage.passage || passage.passage.length < 50) issues.push('passage text too short or missing');
            if (!passage.questions || passage.questions.length === 0) issues.push('no questions');
            passage.questions?.forEach((q, qi) => {
                if (!q.question || q.question.length < 10) issues.push(`Q${qi + 1}: question too short`);
                if (!q.options || q.options.length !== 4) issues.push(`Q${qi + 1}: expected 4 options, got ${q.options?.length || 0}`);
                if (!q.answer) issues.push(`Q${qi + 1}: missing answer`);
                if (!q.explanation) issues.push(`Q${qi + 1}: missing explanation`);
            });

            if (issues.length > 0) {
                console.log(`  ${WARN} Passage ${i + 1}: ${issues.join(', ')}`);
            }
        });

        if (comprehension.length > 0 && comprehension.every(p => p.passage && p.questions?.length > 0)) {
            console.log(`  ${PASS} All comprehension passages have complete structure`);
        }

        // Reasoning
        const reasoning = csatMocks.reasoning || [];
        check(`CSAT reasoning questions exist (got ${reasoning.length})`, reasoning.length > 0);
        check(`At least 4 reasoning questions (got ${reasoning.length})`, reasoning.length >= 4);

        reasoning.forEach((q, i) => {
            const issues: string[] = [];
            if (!q.question || q.question.length < 10) issues.push('question too short');
            if (!q.options || q.options.length !== 4) issues.push(`expected 4 options, got ${q.options?.length || 0}`);
            if (!q.answer) issues.push('missing answer');
            if (!q.explanation) issues.push('missing explanation');

            if (issues.length > 0) {
                console.log(`  ${WARN} Reasoning Q${i + 1}: ${issues.join(', ')}`);
            }
        });

        if (reasoning.every(q => q.question && q.options?.length === 4 && q.answer && q.explanation)) {
            console.log(`  ${PASS} All reasoning questions have complete structure`);
        }

        // Check category diversity
        const validCategories = ['syllogism', 'statement_assumption', 'statement_conclusion', 'coding_decoding', 'blood_relation', 'direction_sense', 'series_sequence', 'seating_arrangement', 'puzzle', 'data_sufficiency', 'decision_making', 'cause_effect'];
        const categories = reasoning.map(q => q.category).filter(Boolean);
        const uniqueCategories = Array.from(new Set(categories));
        if (categories.length > 0) {
            console.log(`  📊 Reasoning categories: ${uniqueCategories.join(', ')}`);
            const invalidCats = categories.filter(c => !validCategories.includes(c!));
            if (invalidCats.length > 0) {
                console.log(`  ${WARN} Unknown categories: ${invalidCats.join(', ')}`);
            }
            check(`At least 3 distinct reasoning categories`, uniqueCategories.length >= 3, false);
        }

        // Total CSAT questions count
        const totalCsatQs = comprehension.reduce((sum, p) => sum + (p.questions?.length || 0), 0) + reasoning.length;
        console.log(`  📊 Total CSAT questions: ${totalCsatQs} (${comprehension.reduce((s, p) => s + (p.questions?.length || 0), 0)} comprehension + ${reasoning.length} reasoning)`);
    } else {
        check(`CSAT mocks data present`, false);
    }

    // ── 10. Quick Bytes ─────────────────────────────────────────────────
    section('10. QUICK BYTES');

    const quickBytes = epaper.quickBytes || [];
    check(`Quick Bytes exist`, quickBytes.length > 0);
    check(`At least 8 Quick Bytes (got ${quickBytes.length})`, quickBytes.length >= 8);
    check(`Exactly 10 Quick Bytes (got ${quickBytes.length})`, quickBytes.length === 10, false);

    if (quickBytes.length > 0) {
        // Category diversity
        const qbCategories = new Set(quickBytes.map(qb => qb.category));
        console.log(`  📊 Categories: ${Array.from(qbCategories).join(', ')}`);
        check(`At least 5 distinct QB categories (got ${qbCategories.size})`, qbCategories.size >= 5);

        // Mandatory categories
        const hasArtCulture = quickBytes.some(qb => qb.category === 'art_culture');
        const hasHistory = quickBytes.some(qb => ['history', 'anniversary'].includes(qb.category));
        check(`Art & Culture represented`, hasArtCulture, false);
        check(`History / This Day represented`, hasHistory, false);

        // GS paper distribution
        const qbGS = new Set(quickBytes.map(qb => qb.gsPaper));
        console.log(`  📊 GS Papers: ${Array.from(qbGS).join(', ')}`);
        check(`At least 2 GS papers in Quick Bytes`, qbGS.size >= 2, false);

        // Check for duplicate content
        const qbTexts = quickBytes.map(qb => qb.text.toLowerCase().substring(0, 60));
        const uniqueQbTexts = new Set(qbTexts);
        check(`No duplicate Quick Bytes (${uniqueQbTexts.size}/${qbTexts.length})`, uniqueQbTexts.size === qbTexts.length);

        // Text quality
        const shortQbs = quickBytes.filter(qb => qb.text.length < 30);
        check(`All Quick Bytes substantive (${shortQbs.length} too short)`, shortQbs.length === 0, false);

        const longQbs = quickBytes.filter(qb => qb.text.length > 200);
        check(`No excessively long Quick Bytes (${longQbs.length} over 200 chars)`, longQbs.length === 0, false);

        // Tags check
        const qbsWithoutTags = quickBytes.filter(qb => !qb.tags || qb.tags.length === 0);
        check(`All Quick Bytes have tags (${qbsWithoutTags.length} missing)`, qbsWithoutTags.length === 0, false);

        // Max 2 per category check
        const catCounts: Record<string, number> = {};
        quickBytes.forEach(qb => { catCounts[qb.category] = (catCounts[qb.category] || 0) + 1; });
        const overRepresented = Object.entries(catCounts).filter(([_, v]) => v > 3);
        if (overRepresented.length > 0) {
            console.log(`  ${WARN} Over-represented: ${overRepresented.map(([k, v]) => `${k}=${v}`).join(', ')}`);
        }
        check(`No category over-represented (max 3)`, overRepresented.length === 0, false);
    }

    // ── 10b. Front Page Extras ──────────────────────────────────────
    section('10b. FRONT PAGE EXTRAS');

    if (epaper.quoteOfTheDay) {
        check(`Quote of the Day present`, true);
        check(`Quote text is substantive (${epaper.quoteOfTheDay.text.length} chars)`, epaper.quoteOfTheDay.text.length >= 20, false);
        check(`Quote author is set: "${epaper.quoteOfTheDay.author}"`, !!epaper.quoteOfTheDay.author, false);
    } else {
        check(`Quote of the Day present`, false, false);
    }

    if (epaper.onThisDay) {
        check(`On This Day present`, true);
        check(`On This Day year is valid (${epaper.onThisDay.year})`, epaper.onThisDay.year > 1000 && epaper.onThisDay.year <= new Date().getFullYear(), false);
        check(`On This Day event is substantive (${epaper.onThisDay.event.length} chars)`, epaper.onThisDay.event.length >= 20, false);
    } else {
        check(`On This Day present`, false, false);
    }

    if (epaper.dataSnapshot) {
        check(`Data Snapshot present`, true);
        check(`Data Snapshot label set: "${epaper.dataSnapshot.label}"`, !!epaper.dataSnapshot.label, false);
        check(`Data Snapshot value set: "${epaper.dataSnapshot.value}"`, !!epaper.dataSnapshot.value, false);
        check(`Data Snapshot context set`, !!epaper.dataSnapshot.context && epaper.dataSnapshot.context.length >= 10, false);
    } else {
        check(`Data Snapshot present`, false, false);
    }

    // ── 11. Trivia / Did You Know ────────────────────────────────────────
    section('11. TRIVIA / DID YOU KNOW');

    const triviaCount = articles.filter(a => a.trivia && a.trivia.length > 10).length;
    check(`At least 50% of articles have trivia (${triviaCount}/${articles.length})`, triviaCount >= articles.length * 0.5, false);
    console.log(`  📊 ${triviaCount} articles with trivia out of ${articles.length}`);

    // ── 12. Sources ─────────────────────────────────────────────────────
    section('12. SOURCES');

    const sourcesUsed = new Set(articles.map(a => a.source));
    check(`Multiple sources used (got ${sourcesUsed.size})`, sourcesUsed.size >= 2);
    console.log(`  📊 Sources: ${Array.from(sourcesUsed).join(', ')}`);

    // ── 13. Page Count Estimation ───────────────────────────────────────
    section('13. PAGE ESTIMATION');

    const articlePages = Math.ceil((articles.length - 1) / 2); // 2 per page, minus lead
    const hasCsat = epaper.csatMocks && (epaper.csatMocks.comprehension?.length > 0 || epaper.csatMocks.reasoning?.length > 0);
    const hasQuickBytesPage = quickBytes.length > 0 ? 1 : 0;
    const mockPages = (prelims.length > 0 ? 1 : 0) + (hasCsat ? 1 : 0) + (mains.length > 0 ? 1 : 0);
    const totalPages = 1 + articlePages + hasQuickBytesPage + mockPages;
    console.log(`  📊 Estimated pages: 1 (front) + ${articlePages} (articles) + ${hasQuickBytesPage} (quick bytes) + ${mockPages} (mocks: prelims/csat/mains) = ${totalPages}`);
    check(`Reasonable page count (8-22 pages, got ${totalPages})`, totalPages >= 8 && totalPages <= 22, false);

    // ── 14. Server Availability ──────────────────────────────────────────────
    section('14. SERVER AVAILABILITY');

    let serverUp = false;
    try {
        const pingResponse = await fetch('http://localhost:3000', { signal: AbortSignal.timeout(5000) });
        serverUp = pingResponse.ok;
        check(`Next.js server is running on localhost:3000`, serverUp);
    } catch {
        check(`Next.js server is running on localhost:3000`, false, false);
        console.log(`  ${WARN} Server not running — Puppeteer layout/PDF checks will be skipped`);
    }

    // ── 15. Layout & Formatting (Puppeteer) ─────────────────────────────────
    section('15. LAYOUT & FORMATTING (Puppeteer)');

    let layoutPassed = true;
    if (!serverUp) {
        console.log(`  ${WARN} Skipped — server not available`);
        warnings++;
    } else {
    try {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });

        const url = `http://localhost:3000/daily-epaper/print/${dateArg}`;
        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        check(`Print page loads (HTTP ${response?.status()})`, response?.status() === 200);

        // Wait for content to render
        await new Promise(r => setTimeout(r, 2000));

        // Count total print pages
        const pageCount = await page.$$eval('.epaper-print-page', els => els.length);
        check(`Print pages rendered (got ${pageCount}, expected ~${totalPages})`, pageCount >= 8 && pageCount <= 20);

        // ── Front Page checks ──
        console.log('  ── Front Page ──');
        const hasMasthead = await page.$('.epaper-print-masthead') !== null;
        check(`  Masthead renders`, hasMasthead);

        const hasHighlightsBar = await page.$('.epaper-print-headlines-bar') !== null;
        check(`  Highlights bar renders`, hasHighlightsBar);

        const hasLeadHeadline = await page.$('.epaper-print-lead-headline') !== null;
        check(`  Lead headline renders`, hasLeadHeadline);

        const hasLeadBody = await page.$('.epaper-print-lead-body') !== null;
        check(`  Lead explainer body renders`, hasLeadBody);

        const hasGlobeImg = await page.$('img[alt="Globe Icon"]') !== null;
        check(`  Globe logo image loads`, hasGlobeImg, false);

        const hasTextLogo = await page.$('img[alt="Current IAS Prep"]') !== null;
        check(`  Text logo image loads`, hasTextLogo, false);

        // Check for grey bullet box on front page (right column)
        const greyBoxCount = await page.$$eval('.epaper-print-lead-body div', divs =>
            divs.filter(d => {
                const bg = window.getComputedStyle(d).backgroundColor;
                return bg.includes('204') || bg.includes('cccccc') || bg.includes('CCCCCC');
            }).length
        );
        check(`  Grey bullet box on front page (found ${greyBoxCount})`, greyBoxCount >= 1, false);

        // Check pointer boxes
        const pointerBoxes = await page.$$('.epaper-print-pointer-box');
        check(`  Prelims/Mains pointer boxes render (found ${pointerBoxes.length})`, pointerBoxes.length >= 2);

        // ── Article Pages checks ──
        console.log('  ── Article Pages (2-13) ──');
        const allPages = await page.$$('.epaper-print-page');
        // Check article pages (skip first page = front, Quick Bytes page, and last N = mocks)
        const quickBytesPageCount = quickBytes.length > 0 ? 1 : 0;
        const mockPageCount = quickBytesPageCount + (prelims.length > 0 ? 1 : 0) + (hasCsat ? 1 : 0) + (mains.length > 0 ? 1 : 0);
        const articlePageCount = allPages.length - 1 - mockPageCount; // front + quick bytes + mock pages
        check(`  Article pages count: ${articlePageCount}`, articlePageCount >= 6);

        // Check articles per page (2 per page)
        const articlesPerPage = await page.evaluate((mc: number) => {
            const pages = document.querySelectorAll('.epaper-print-page');
            const results: number[] = [];
            // Skip first (front) and last N (mocks)
            for (let i = 1; i < pages.length - mc; i++) {
                const articles = pages[i].querySelectorAll('h3');
                results.push(articles.length);
            }
            return results;
        }, mockPageCount);
        const allHave2 = articlesPerPage.every(c => c === 2 || c === 1);
        check(`  Each article page has 1-2 articles`, allHave2);
        const pagesWithIssues = articlesPerPage.filter(c => c === 0).length;
        check(`  No empty article pages (${pagesWithIssues} empty)`, pagesWithIssues === 0);

        // Check font sizes on article pages
        const articleFonts = await page.evaluate(() => {
            const firstArticlePage = document.querySelectorAll('.epaper-print-page')[1];
            if (!firstArticlePage) return null;
            const h3 = firstArticlePage.querySelector('h3');
            const headline = h3 ? window.getComputedStyle(h3).fontSize : 'N/A';
            return { headline };
        });
        if (articleFonts) {
            const headlineSize = parseFloat(articleFonts.headline);
            check(`  Article headline font ~17px (got ${articleFonts.headline})`, headlineSize >= 16 && headlineSize <= 18, false);
        }

        // ── Mock Pages checks ──
        // Identify mock/special pages by scanning content, not by position.
        console.log('  ── Mock Pages ──');
        const mockPageInfo = await page.evaluate(() => {
            const pages = document.querySelectorAll('.epaper-print-page');
            const info: { index: number; type: string; text: string }[] = [];
            for (let i = 0; i < pages.length; i++) {
                const text = pages[i]?.textContent || '';
                const first500 = text.substring(0, 500);
                if (first500.includes('Prelims') && (first500.includes('Mock') || first500.includes('MOCK') || first500.includes('Q1'))) {
                    info.push({ index: i, type: 'prelims', text: first500 });
                } else if (first500.includes('CSAT') || first500.includes('Paper II')) {
                    info.push({ index: i, type: 'csat', text: first500 });
                } else if (first500.includes('Mains') && (first500.includes('Mock') || first500.includes('MOCK') || first500.includes('Q1'))) {
                    info.push({ index: i, type: 'mains', text: first500 });
                } else if (first500.includes('Quick Bytes') || first500.includes('QUICK BYTES')) {
                    info.push({ index: i, type: 'quickbytes', text: first500 });
                }
            }
            return info;
        });

        const hasPrelimsMock = mockPageInfo.some(p => p.type === 'prelims');
        check(`  Prelims mock page renders`, hasPrelimsMock);
        const hasCsatMock = mockPageInfo.some(p => p.type === 'csat');
        check(`  CSAT mock page renders`, hasCsatMock);
        const hasMainsMock = mockPageInfo.some(p => p.type === 'mains');
        check(`  Mains mock page renders`, hasMainsMock);
        const hasQuickBytesPage = mockPageInfo.some(p => p.type === 'quickbytes');
        check(`  Quick Bytes page renders`, hasQuickBytesPage, false);
        console.log(`  📊 Special pages found: ${mockPageInfo.map(p => `${p.type}(pg${p.index + 1})`).join(', ')}`);

        // ── Rendered question count verification ──
        console.log('  ── Question Count Verification ──');
        const renderedCounts = await page.evaluate(() => {
            const pages = document.querySelectorAll('.epaper-print-page');
            let prelimsQs = 0;
            let mainsQs = 0;
            let csatQs = 0;
            let qbItems = 0;

            for (let i = 0; i < pages.length; i++) {
                const text = pages[i]?.textContent || '';
                const first500 = text.substring(0, 500);

                if (first500.includes('Prelims') && (first500.includes('Mock') || first500.includes('MOCK') || first500.includes('Q1'))) {
                    // Count Q labels: Q1, Q2, Q3... on this page
                    const qLabels = text.match(/Q\d+\./g);
                    prelimsQs = qLabels ? qLabels.length : 0;
                } else if (first500.includes('CSAT') || first500.includes('Paper II')) {
                    // Count option labels as proxy for questions
                    const qLabels = text.match(/Q\d+[\.:]/g);
                    const passageMarkers = text.match(/Passage/gi);
                    csatQs = (qLabels ? qLabels.length : 0) + (passageMarkers ? passageMarkers.length : 0);
                } else if (first500.includes('Mains') && (first500.includes('Mock') || first500.includes('MOCK') || first500.includes('Q1'))) {
                    const qLabels = text.match(/Q\d+\./g);
                    mainsQs = qLabels ? qLabels.length : 0;
                } else if (first500.includes('Quick Bytes') || first500.includes('QUICK BYTES')) {
                    // Count list items (• or numbered items)
                    const bullets = text.match(/[•●]\s/g);
                    const numbered = text.match(/^\d+\.\s/gm);
                    qbItems = Math.max(bullets ? bullets.length : 0, numbered ? numbered.length : 0);
                    // Fallback: count by line breaks if no markers found
                    if (qbItems === 0) {
                        const lines = text.split('\n').filter(l => l.trim().length > 20);
                        qbItems = lines.length;
                    }
                }
            }
            return { prelimsQs, mainsQs, csatQs, qbItems };
        });

        check(`  Prelims questions rendered (expect ${prelims.length}, found ${renderedCounts.prelimsQs})`,
            renderedCounts.prelimsQs >= prelims.length, false);
        check(`  Mains questions rendered (expect ${mains.length}, found ${renderedCounts.mainsQs})`,
            renderedCounts.mainsQs >= mains.length, false);
        if (hasCsat) {
            const expectedCsatMin = (epaper.csatMocks?.comprehension?.length || 0) + (epaper.csatMocks?.reasoning?.length || 0);
            check(`  CSAT content rendered (expect ≥${expectedCsatMin} markers, found ${renderedCounts.csatQs})`,
                renderedCounts.csatQs >= Math.max(1, expectedCsatMin - 2), false);
        }
        if (quickBytes.length > 0) {
            check(`  Quick Bytes items rendered (expect ${quickBytes.length}, found ${renderedCounts.qbItems})`,
                renderedCounts.qbItems >= Math.max(1, quickBytes.length - 2), false);
        }

        // Check masthead footer on last page
        const lastPageHasFooter = await page.evaluate(() => {
            const lastPage = document.querySelector('.epaper-print-page:last-child');
            return lastPage?.textContent?.includes('Current IAS Prep') || false;
        });
        check(`  Masthead footer on last page`, lastPageHasFooter, false);

        // Check mains mock page: last question's approach must be visible (not clipped)
        const mainsApproachVisible = await page.evaluate(() => {
            const pages = document.querySelectorAll('.epaper-print-page');
            const lastPage = pages[pages.length - 1] as HTMLElement;
            if (!lastPage) return true;
            const allText = lastPage.querySelectorAll('div');
            let lastApproachEl: HTMLElement | null = null;
            allText.forEach((el) => {
                if (el.textContent?.startsWith('Approach:')) {
                    lastApproachEl = el as HTMLElement;
                }
            });
            if (!lastApproachEl) return true;
            const pageRect = lastPage.getBoundingClientRect();
            const approachRect = (lastApproachEl as HTMLElement).getBoundingClientRect();
            return approachRect.bottom <= pageRect.bottom + 5;
        });
        check(`  Mains last question approach visible (not clipped)`, mainsApproachVisible, false);

        // ── Content clipping check on mock pages ──
        // NOTE: This is a WARNING (not critical) because browser rendering can differ
        // from actual PDF output generated by Puppeteer's page.pdf().
        console.log('  ── Mock Box Content Clipping ──');
        const actualMockCount = (prelims.length > 0 ? 1 : 0) + (hasCsat ? 1 : 0) + (mains.length > 0 ? 1 : 0);
        const mockClipResults = await page.evaluate((amc: number) => {
            const pages = document.querySelectorAll('.epaper-print-page');
            const mockPageNames = ['Prelims', 'CSAT', 'Mains'];
            const issues: string[] = [];
            const CLIP_TOLERANCE = 5; // px — relaxed to avoid false positives

            for (let m = 0; m < amc; m++) {
                const pageIdx = pages.length - amc + m;
                const mockPage = pages[pageIdx] as HTMLElement;
                if (!mockPage) continue;
                const pageName = mockPageNames[m] || `Mock-${m + 1}`;

                const allDivs = mockPage.querySelectorAll<HTMLElement>('div');
                let boxIndex = 0;

                allDivs.forEach((el) => {
                    const computed = window.getComputedStyle(el);
                    const borderStyle = computed.borderTopStyle || computed.borderStyle;
                    if (borderStyle === 'none' || borderStyle === '' || !borderStyle) return;

                    const rect = el.getBoundingClientRect();
                    if (rect.height < 40 || rect.width < 150) return;
                    if (el === mockPage) return;
                    if (el.tagName === 'HEADER' || el.querySelector('h2')) return;
                    // Skip outer containers that wrap the entire question grid
                    if (computed.overflow === 'visible' && computed.display === 'flex') return;

                    boxIndex++;
                    const children = el.children;
                    if (children.length === 0) return;

                    const firstChild = children[0] as HTMLElement;
                    const firstRect = firstChild.getBoundingClientRect();
                    if (firstRect.top < rect.top - CLIP_TOLERANCE) {
                        const preview = firstChild.textContent?.substring(0, 50) || '(empty)';
                        issues.push(`${pageName} box ${boxIndex}: TOP clipped — "${preview}…"`);
                    }

                    const lastChild = children[children.length - 1] as HTMLElement;
                    const lastRect = lastChild.getBoundingClientRect();
                    if (lastRect.bottom > rect.bottom + CLIP_TOLERANCE) {
                        const preview = lastChild.textContent?.substring(0, 50) || '(empty)';
                        issues.push(`${pageName} box ${boxIndex}: BOTTOM clipped — "${preview}…"`);
                    }

                    if (el.scrollHeight > el.clientHeight + CLIP_TOLERANCE * 2) {
                        const overflowPx = el.scrollHeight - el.clientHeight;
                        const preview = el.textContent?.substring(0, 40) || '(empty)';
                        issues.push(`${pageName} box ${boxIndex}: overflow by ${overflowPx}px — "${preview}…"`);
                    }
                });
            }
            return issues;
        }, actualMockCount);

        if (mockClipResults.length > 0) {
            mockClipResults.forEach(issue => console.log(`    ${WARN} ${issue}`));
        }
        // Clipping is a WARNING, not critical — browser rendering can differ from PDF
        check(`  No clipped content in mock page boxes (${mockClipResults.length} clipped)`, mockClipResults.length === 0, false);

        // ── Overflow check ──
        console.log('  ── Overflow Check ──');
        const overflowIssues = await page.evaluate(() => {
            const pages = document.querySelectorAll('.epaper-print-page');
            let issues = 0;
            pages.forEach((p, i) => {
                const el = p as HTMLElement;
                if (el.scrollHeight > el.clientHeight + 5) {
                    issues++;
                }
            });
            return issues;
        });
        check(`  No pages with content overflow (${overflowIssues} overflowing)`, overflowIssues === 0, false);

        // ── Generate test PDF and check size ──
        console.log('  ── PDF Generation ──');
        await page.emulateMediaType('print');
        const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
        const pdfSizeMB = (pdf.length / 1024 / 1024).toFixed(2);
        check(`  PDF generates successfully (${pdfSizeMB} MB)`, pdf.length > 100000);
        check(`  PDF size reasonable (<3 MB)`, pdf.length < 3 * 1024 * 1024, false);

        // ── Downloadability checks ──
        console.log('  ── Downloadability ──');
        const { writeFileSync: writeFS, readFileSync: readFS, unlinkSync } = require('fs');
        const pdfPath = `/tmp/CurrentIAS_ePaper_${dateArg}_validate.pdf`;

        // Save to disk
        writeFS(pdfPath, pdf);
        const savedExists = existsSync(pdfPath);
        check(`  PDF saved to disk`, savedExists);

        if (savedExists) {
            // Verify file size matches buffer
            const savedFile = readFS(pdfPath);
            check(`  Saved file size matches (${savedFile.length} bytes)`, savedFile.length === pdf.length);

            // Verify PDF header — valid PDF starts with %PDF
            const header = savedFile.slice(0, 5).toString('ascii');
            check(`  Valid PDF header (%PDF): "${header}"`, header.startsWith('%PDF'));

            // Verify PDF trailer — valid PDF ends with %%EOF
            const tail = savedFile.slice(-20).toString('ascii');
            check(`  Valid PDF trailer (%%EOF)`, tail.includes('%%EOF'));

            // Verify PDF is not corrupted by checking it has multiple pages
            const pdfContent = savedFile.toString('ascii');
            const pdfPageMarkers = (pdfContent.match(/\/Type\s*\/Page[^s]/g) || []).length;
            check(`  PDF contains page objects (found ${pdfPageMarkers})`, pdfPageMarkers >= 8);

            // Clean up
            try { unlinkSync(pdfPath); } catch { }
        }

        await browser.close();
        console.log(`  ${PASS} Puppeteer layout & downloadability checks complete`);

    } catch (err: any) {
        console.log(`  ${WARN} Puppeteer layout check failed: ${err.message}`);
        console.log(`  ${WARN} (Server may not be running — layout checks skipped)`);
        warnings++;
        layoutPassed = false;
    }
    } // close the serverUp if-block

    // ── 16. EMAIL & PDF READINESS ─────────────────────────────────────────
    section('16. EMAIL & PDF READINESS');

    // Check SMTP credentials are configured
    const dotenvPath = path.join(process.cwd(), '.env.local');
    let smtpConfigured = false;
    if (existsSync(dotenvPath)) {
        const envContent = readFileSync(dotenvPath, 'utf-8');
        const hasUser = /SMTP_USER=.+/.test(envContent);
        const hasPass = /SMTP_PASS=.+/.test(envContent);
        smtpConfigured = hasUser && hasPass;
        check(`SMTP_USER configured in .env.local`, hasUser, false);
        check(`SMTP_PASS configured in .env.local`, hasPass, false);
    } else {
        check(`.env.local file exists`, false, false);
    }

    // Check that PDF was generated in today's validation run
    const todayPdfPath = path.join('/tmp', `CurrentIAS_ePaper_${dateArg}_validate.pdf`);
    // (PDF is already cleaned up during layout check, so we just note if layout passed)
    check(`Layout & PDF pipeline healthy`, layoutPassed || !serverUp, false);

    // ── Summary ─────────────────────────────────────────────────────────────
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  VALIDATION SUMMARY`);
    console.log(`${'═'.repeat(60)}`);
    console.log(`  ${PASS} Passed:   ${passes}`);
    console.log(`  ${WARN} Warnings: ${warnings}`);
    console.log(`  ${FAIL} Critical: ${criticalFailures}`);
    console.log(`${'═'.repeat(60)}`);

    if (criticalFailures > 0) {
        console.log(`\n${FAIL} VALIDATION FAILED — ${criticalFailures} critical issue(s). Email will NOT be sent.\n`);
        process.exit(1);
    } else if (warnings > 0) {
        console.log(`\n${WARN} VALIDATION PASSED with ${warnings} warning(s). Proceeding with email.\n`);
        process.exit(0);
    } else {
        console.log(`\n${PASS} ALL CHECKS PASSED. Proceeding with email.\n`);
        process.exit(0);
    }
}

main();
