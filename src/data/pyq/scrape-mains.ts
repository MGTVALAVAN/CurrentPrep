/**
 * Mains PYQ Scraper v3 — Extracts from <li> elements
 * Usage: npx tsx src/data/pyq/scrape-mains.ts
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'src', 'data', 'pyq', 'pyq-database.json');

interface PYQuestion {
    id: string; year: number; paper: string; question: string;
    options: string[]; answer?: string; topic: string; subtopic: string;
    gsPaper: string; entities: string[]; keywords: string[];
    sourceUrl: string; marks?: number; wordLimit?: number;
}

const MAINS_PAGES: Array<{ topic: string; gsPaper: string; url: string }> = [
    { topic: 'Art & Culture', gsPaper: 'GS1', url: 'https://educationprovince.com/upsc-mains-art-and-culture-previous-year-questions/' },
    { topic: 'Modern History', gsPaper: 'GS1', url: 'https://educationprovince.com/upsc-mains-modern-indian-history-previous-year-questions/' },
    { topic: 'Post-Independence', gsPaper: 'GS1', url: 'https://educationprovince.com/upsc-mains-post-independence-history-previous-year-questions/' },
    { topic: 'World History', gsPaper: 'GS1', url: 'https://educationprovince.com/upsc-mains-world-history-previous-year-questions/' },
    { topic: 'Society', gsPaper: 'GS1', url: 'https://educationprovince.com/upsc-mains-society-and-social-issues-previous-year-questions/' },
    { topic: 'Geography', gsPaper: 'GS1', url: 'https://educationprovince.com/upsc-mains-geography-previous-year-questions/' },
    { topic: 'Polity', gsPaper: 'GS2', url: 'https://educationprovince.com/upsc-mains-polity-previous-year-questions/' },
    { topic: 'Social Justice', gsPaper: 'GS2', url: 'https://educationprovince.com/upsc-mains-social-justice-previous-year-questions/' },
    { topic: 'Governance', gsPaper: 'GS2', url: 'https://educationprovince.com/upsc-mains-governance-previous-year-questions/' },
    { topic: 'International Relations', gsPaper: 'GS2', url: 'https://educationprovince.com/upsc-mains-international-relations-previous-year-questions/' },
    { topic: 'Economy', gsPaper: 'GS3', url: 'https://educationprovince.com/upsc-mains-indian-economy-previous-year-questions/' },
    { topic: 'Science & Technology', gsPaper: 'GS3', url: 'https://educationprovince.com/upsc-mains-science-and-technology-previous-year-questions/' },
    { topic: 'Environment', gsPaper: 'GS3', url: 'https://educationprovince.com/upsc-mains-environment-previous-year-questions/' },
    { topic: 'Disaster Management', gsPaper: 'GS3', url: 'https://educationprovince.com/upsc-mains-disaster-management-previous-year-questions/' },
    { topic: 'Internal Security', gsPaper: 'GS3', url: 'https://educationprovince.com/upsc-mains-internal-security-previous-year-questions/' },
    { topic: 'Ethics', gsPaper: 'GS4', url: 'https://educationprovince.com/gs-4-1-ethics-and-human-interface/' },
    { topic: 'Ethics', gsPaper: 'GS4', url: 'https://educationprovince.com/gs-4-2-attitude/' },
    { topic: 'Ethics', gsPaper: 'GS4', url: 'https://educationprovince.com/gs-4-3-aptitude-and-foundational-values-for-civil-service/' },
    { topic: 'Ethics', gsPaper: 'GS4', url: 'https://educationprovince.com/gs-4-4-emotional-intelligence/' },
    { topic: 'Ethics', gsPaper: 'GS4', url: 'https://educationprovince.com/gs-4-5-contribution-of-moral-thinkers-and-philosophers-from-india-and-world-upsc-mains-pyqs/' },
    { topic: 'Ethics', gsPaper: 'GS4', url: 'https://educationprovince.com/gs-4-6-public-civil-service-values-and-ethics-in-public-administration-upsc-mains-pyqs/' },
    { topic: 'Ethics', gsPaper: 'GS4', url: 'https://educationprovince.com/gs-4-7-probity-in-governance-upsc-mains-pyqs/' },
    { topic: 'Essay', gsPaper: 'Essay', url: 'https://educationprovince.com/upsc-mains-essay-previous-year-questions/' },
];

function stripHtml(s: string): string {
    return s.replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
        .replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"').replace(/&ldquo;/g, '"')
        .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ').trim();
}

function parseMainsQuestions(html: string, topic: string, gsPaper: string, sourceUrl: string): PYQuestion[] {
    const questions: PYQuestion[] = [];

    // Strategy: Find all <h3> sections for subtopics, then extract <li> items under them
    // First, find subtopic headers
    const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
    const sections: { subtopic: string; start: number; end: number }[] = [];
    let h3m;
    while ((h3m = h3Regex.exec(html)) !== null) {
        const subtopic = stripHtml(h3m[1]);
        if (subtopic.length > 5) {
            sections.push({ subtopic, start: h3m.index + h3m[0].length, end: html.length });
        }
    }
    // Set end boundaries
    for (let i = 0; i < sections.length - 1; i++) {
        sections[i].end = sections[i + 1].start;
    }
    // If no sections, use full page
    if (sections.length === 0) {
        sections.push({ subtopic: topic, start: 0, end: html.length });
    }

    let globalQNum = 0;

    for (const sec of sections) {
        const sectionHtml = html.substring(sec.start, sec.end);
        const subtopic = sec.subtopic.substring(0, 80);

        // Extract all <li> items
        const liRegex = /<li>([\s\S]*?)<\/li>/gi;
        let lim;

        while ((lim = liRegex.exec(sectionHtml)) !== null) {
            const liContent = lim[1];
            let qText = stripHtml(liContent);

            // Must have year metadata to be a question
            const metaMatch = qText.match(/\[(\d{4})\/Q(\d+)\/(\d+)m\/(\d+)w\]/);
            if (!metaMatch) continue;

            const year = parseInt(metaMatch[1]);
            const qNum = parseInt(metaMatch[2]);
            const marks = parseInt(metaMatch[3]);
            const wordLimit = parseInt(metaMatch[4]);

            if (year < 2015 || year > 2026) continue;

            // Clean question text
            qText = qText
                .replace(/\[\d{4}\/Q\d+\/\d+m\/\d+w\]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            // Remove leading/trailing quotes
            qText = qText.replace(/^["\u201C\u201D]/, '').replace(/["\u201C\u201D]$/, '').trim();

            if (qText.length < 20) continue;

            globalQNum++;
            const id = `M${year}-${gsPaper}-${topic.replace(/[^a-zA-Z]/g, '').substring(0, 6)}-Q${globalQNum}`;

            questions.push({
                id, year,
                paper: `Mains ${gsPaper}`,
                question: qText, options: [],
                topic, subtopic, gsPaper,
                entities: [], keywords: [],
                sourceUrl, marks, wordLimit,
            });
        }
    }

    return questions;
}

async function main() {
    console.log('🌐 Mains PYQ Scraper v3 — Education Province');
    console.log('='.repeat(60));

    // First re-run Prelims scraper's data (keep only Prelims)
    let db: any = { metadata: {}, questions: [] };
    if (existsSync(OUTPUT_FILE)) {
        db = JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8'));
        console.log(`📂 Loaded existing DB: ${db.questions.length} questions\n`);
    }

    const mainsQuestions: PYQuestion[] = [];
    let ok = 0, fail = 0;

    for (const page of MAINS_PAGES) {
        process.stdout.write(`📖 ${page.gsPaper} → ${page.topic}... `);
        try {
            const res = await fetch(page.url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const html = await res.text();
            const qs = parseMainsQuestions(html, page.topic, page.gsPaper, page.url);
            mainsQuestions.push(...qs);
            ok++;
            console.log(`✅ ${qs.length} questions`);
        } catch (err: any) {
            fail++;
            console.log(`❌ ${err.message}`);
        }
        await new Promise(r => setTimeout(r, 400));
    }

    // Deduplicate
    const seen = new Set<string>();
    const uniqueMains = mainsQuestions.filter(q => {
        const key = q.question.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 80);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Merge
    const prelimsQs = db.questions.filter((q: any) => q.paper && q.paper.includes('Prelims'));
    const allQuestions = [...prelimsQs, ...uniqueMains];
    allQuestions.sort((a: any, b: any) => b.year - a.year || a.topic.localeCompare(b.topic));

    const years = Array.from(new Set(allQuestions.map((q: any) => q.year))).sort();

    db.metadata = {
        totalQuestions: allQuestions.length,
        prelimsQuestions: prelimsQs.length,
        mainsQuestions: uniqueMains.length,
        yearRange: `${years[0]}-${years[years.length - 1]}`,
        lastUpdated: new Date().toISOString(),
        source: 'educationprovince.com',
    };
    db.questions = allQuestions;

    writeFileSync(OUTPUT_FILE, JSON.stringify(db, null, 2));

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 MAINS SCRAPING COMPLETE`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Mains: ${uniqueMains.length} unique questions`);
    console.log(`📄 Pages: ${ok} ok, ${fail} failed`);
    console.log(`📚 Combined: ${prelimsQs.length} Prelims + ${uniqueMains.length} Mains = ${allQuestions.length} total`);

    const gsCounts: Record<string, number> = {};
    for (const q of uniqueMains) gsCounts[q.gsPaper] = (gsCounts[q.gsPaper] || 0) + 1;
    console.log(`\n📑 Mains by GS Paper:`);
    Object.entries(gsCounts).sort().forEach(([gs, c]) => console.log(`  ${gs}: ${c}`));

    const tc: Record<string, number> = {};
    for (const q of uniqueMains) tc[q.topic] = (tc[q.topic] || 0) + 1;
    console.log(`\n📑 Mains by Topic:`);
    Object.entries(tc).sort(([, a], [, b]) => b - a).forEach(([t, c]) =>
        console.log(`  ${t.padEnd(25)} ${c}`));

    if (uniqueMains.length > 0) {
        console.log('\n🔍 Sample:');
        const s = uniqueMains[0];
        console.log(`  ${s.gsPaper} | ${s.topic} | ${s.year} | ${s.marks}m/${s.wordLimit}w`);
        console.log(`  "${s.question.substring(0, 150)}..."`);
    }

    console.log(`\n💾 Saved: ${OUTPUT_FILE}`);
}

main().catch(console.error);
