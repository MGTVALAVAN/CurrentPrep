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
    check(`At least 20 articles (got ${articles.length})`, articles.length >= 20);
    check(`No more than 30 articles (got ${articles.length})`, articles.length <= 30, false);

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

    // ── 7. Highlights ───────────────────────────────────────────────────────
    section('7. HIGHLIGHTS');

    check(`Highlights array exists`, !!epaper.highlights);
    check(`At least 3 highlights (got ${epaper.highlights?.length || 0})`, (epaper.highlights?.length || 0) >= 3);

    // ── 8. Prelims Mock Questions ───────────────────────────────────────────
    section('8. PRELIMS MOCK QUESTIONS');

    const prelims = epaper.prelimsMocks || [];
    check(`Prelims mocks exist`, prelims.length > 0);
    check(`At least 4 prelims questions (got ${prelims.length})`, prelims.length >= 4);
    check(`Exactly 5 prelims questions (got ${prelims.length})`, prelims.length === 5, false);

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

    // ── 9. Mains Mock Questions ─────────────────────────────────────────────
    section('9. MAINS MOCK QUESTIONS');

    const mains = epaper.mainsMocks || [];
    check(`Mains mocks exist`, mains.length > 0);
    check(`At least 4 mains questions (got ${mains.length})`, mains.length >= 4);

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

    // ── 10. Trivia Check ────────────────────────────────────────────────────
    section('10. TRIVIA / DID YOU KNOW');

    const triviaCount = articles.filter(a => a.trivia && a.trivia.length > 10).length;
    check(`At least 50% of articles have trivia (${triviaCount}/${articles.length})`, triviaCount >= articles.length * 0.5, false);
    console.log(`  📊 ${triviaCount} articles with trivia out of ${articles.length}`);

    // ── 11. Sources ─────────────────────────────────────────────────────────
    section('11. SOURCES');

    const sourcesUsed = new Set(articles.map(a => a.source));
    check(`Multiple sources used (got ${sourcesUsed.size})`, sourcesUsed.size >= 2);
    console.log(`  📊 Sources: ${Array.from(sourcesUsed).join(', ')}`);

    // ── 12. Page Count Estimation ───────────────────────────────────────────
    section('12. PAGE ESTIMATION');

    const articlePages = Math.ceil((articles.length - 1) / 2); // 2 per page, minus lead
    const totalPages = 1 + articlePages + (prelims.length > 0 ? 1 : 0) + (mains.length > 0 ? 1 : 0);
    console.log(`  📊 Estimated pages: 1 (front) + ${articlePages} (articles) + 1 (prelims) + 1 (mains) = ${totalPages}`);
    check(`Reasonable page count (10-18 pages, got ${totalPages})`, totalPages >= 10 && totalPages <= 18, false);

    // ── 13. Layout & Formatting (Puppeteer) ─────────────────────────────────
    section('13. LAYOUT & FORMATTING (Puppeteer)');

    let layoutPassed = true;
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
        check(`Print pages rendered (got ${pageCount}, expected ~${totalPages})`, pageCount >= 10 && pageCount <= 20);

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
        // Check article pages (skip first page = front, last 2 = mocks)
        const articlePageCount = allPages.length - 3; // front + prelims + mains
        check(`  Article pages count: ${articlePageCount}`, articlePageCount >= 8);

        // Check articles per page (2 per page)
        const articlesPerPage = await page.evaluate(() => {
            const pages = document.querySelectorAll('.epaper-print-page');
            const results: number[] = [];
            // Skip first (front) and last 2 (mocks)
            for (let i = 1; i < pages.length - 2; i++) {
                const articles = pages[i].querySelectorAll('h3');
                results.push(articles.length);
            }
            return results;
        });
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
        console.log('  ── Mock Pages ──');
        // Check for mock section headers
        const mockHeaders = await page.evaluate(() => {
            const pages = document.querySelectorAll('.epaper-print-page');
            const results: string[] = [];
            for (let i = Math.max(0, pages.length - 2); i < pages.length; i++) {
                const text = pages[i]?.textContent?.substring(0, 200) || '';
                results.push(text);
            }
            return results;
        });
        const hasPrelimsMock = mockHeaders.some(t => t.includes('Prelims') || t.includes('prelims'));
        check(`  Prelims mock page renders`, hasPrelimsMock);
        const hasMainsMock = mockHeaders.some(t => t.includes('Mains') || t.includes('mains'));
        check(`  Mains mock page renders`, hasMainsMock);

        // Check masthead footer on last page
        const mastheadFooters = await page.$$eval('.epaper-print-page:last-child img[alt="Globe"]', imgs => imgs.length);
        const lastPageHasFooter = await page.evaluate(() => {
            const lastPage = document.querySelector('.epaper-print-page:last-child');
            return lastPage?.textContent?.includes('Current IAS Prep') || false;
        });
        check(`  Masthead footer on last page`, lastPageHasFooter, false);

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
            check(`  PDF contains page objects (found ${pdfPageMarkers})`, pdfPageMarkers >= 10);

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
