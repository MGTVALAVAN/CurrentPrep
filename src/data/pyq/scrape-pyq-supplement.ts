/**
 * Supplemental PYQ Scraper — Uses subject-level pages to fill gaps
 * from topics that returned 404 on subtopic pages.
 * 
 * Usage: npx tsx src/data/pyq/scrape-pyq-supplement.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'src', 'data', 'pyq', 'pyq-database.json');

interface PYQuestion {
    id: string; year: number; paper: string; question: string;
    options: string[]; answer?: string; topic: string; subtopic: string;
    gsPaper: string; entities: string[]; keywords: string[];
    sourceUrl: string;
}

const TOPIC_TO_GS: Record<string, string> = {
    'Art & Culture': 'GS1', 'Ancient History': 'GS1', 'Medieval History': 'GS1',
    'Modern History': 'GS1', 'Polity': 'GS2', 'Economy': 'GS3',
    'Geography': 'GS1', 'Environment': 'GS3', 'Science & Technology': 'GS3',
    'Current Affairs & GK': 'GS2',
};

// Subject-level pages that contain ALL subtopics
const SUBJECT_PAGES: Array<{ topic: string; url: string }> = [
    { topic: 'Modern History', url: 'https://educationprovince.com/3-modern-indian-history-previous-year-questions-upsc-prelims/' },
    { topic: 'Polity', url: 'https://educationprovince.com/4-indian-polity-previous-year-questions-upsc-prelims/' },
    { topic: 'Economy', url: 'https://educationprovince.com/5-indian-economy-previous-year-questions-upsc-prelims/' },
    { topic: 'Environment', url: 'https://educationprovince.com/7-environment-previous-year-questions-upsc-prelims/' },
    { topic: 'Current Affairs & GK', url: 'https://educationprovince.com/9-current-affairs-general-knowledge-previous-year-questions-upsc-prelims/' },
];

function parseSubjectPage(html: string, topic: string, sourceUrl: string): PYQuestion[] {
    const questions: PYQuestion[] = [];
    const gsPaper = TOPIC_TO_GS[topic] || 'GS1';

    let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');

    const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) text = articleMatch[1];

    text = text
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
        .replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"').replace(/&ldquo;/g, '"')
        .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
        .replace(/&nbsp;/g, ' ');

    // Find subtopic headers (like "3a. Establishment of British Rule" or "4a. Political Theory")
    const subtopicRegex = /\d+[a-z][\.\)]\s*([^\n]+)/gi;
    const subtopicSections: { subtopic: string; start: number }[] = [];
    let stm;
    while ((stm = subtopicRegex.exec(text)) !== null) {
        subtopicSections.push({ subtopic: stm[1].trim(), start: stm.index });
    }

    // Find year sections
    const yearRegex = /((?:\d{4}[-–]\d{4}|\d{4}))\s*Prelims\s*PYQs?/gi;
    const yearSections: { year: number; isRange: boolean; start: number }[] = [];
    let ym;
    while ((ym = yearRegex.exec(text)) !== null) {
        const raw = ym[1];
        const isRange = /\d{4}[-–]\d{4}/.test(raw);
        const year = parseInt(raw.match(/\d{4}/)![0]);
        yearSections.push({ year, isRange, start: ym.index });
    }

    for (let si = 0; si < yearSections.length; si++) {
        const { year, isRange, start } = yearSections[si];
        const end = si < yearSections.length - 1 ? yearSections[si + 1].start : text.length;
        const section = text.substring(start, end);

        // Determine subtopic from nearest header before this section
        let subtopic = 'General';
        for (const st of subtopicSections) {
            if (st.start < start) subtopic = st.subtopic;
        }

        const qRegex = /(\d{1,3})\]\s+([\s\S]*?)(?=\d{1,3}\]\s|$)/g;
        let qm;

        while ((qm = qRegex.exec(section)) !== null) {
            const qNum = parseInt(qm[1]);
            let qBlock = qm[2].trim();

            const yearTag = qBlock.match(/\[(\d{4})(?:\/[A-Z]-?\d+)?\]/);
            let questionYear: number;
            if (yearTag) {
                questionYear = parseInt(yearTag[1]);
            } else if (isRange) {
                questionYear = 0;
            } else {
                questionYear = year;
            }
            qBlock = qBlock.replace(/\[\d{4}(?:\/[A-Z]-?\d+)?\]/, '').trim();

            const ansMatch = qBlock.match(/Ans(?:wer)?[:\s]*\(?([a-dA-D])\)?/i);
            const answer = ansMatch ? ansMatch[1].toLowerCase() : undefined;
            if (ansMatch) qBlock = qBlock.substring(0, qBlock.indexOf(ansMatch[0])).trim();

            qBlock = qBlock
                .replace(/The explanations.*$/gm, '')
                .replace(/Click here.*$/gm, '')
                .replace(/Already logged.*$/gm, '')
                .replace(/Get Hard Copy.*$/gm, '')
                .replace(/Purchase Soft.*$/gm, '')
                .trim();

            const optRegex = /\b([a-d])\)\s*([^a-d\n]*(?:\n(?![a-d]\))[^\n]*)*)/gi;
            const options: string[] = [];
            const optStarts: number[] = [];
            let om;
            while ((om = optRegex.exec(qBlock)) !== null) {
                options.push(om[2].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());
                optStarts.push(om.index);
            }

            let questionText = optStarts.length > 0 ? qBlock.substring(0, optStarts[0]).trim() : qBlock;
            questionText = questionText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

            if (questionText.length < 15 || options.length < 2) continue;

            const id = `PS${questionYear}-${topic.replace(/[^a-zA-Z]/g, '').substring(0, 4)}-Q${qNum}-${subtopic.replace(/[^a-zA-Z]/g, '').substring(0, 8)}`;

            questions.push({
                id, year: questionYear, paper: 'Prelims GS1',
                question: questionText, options: options.slice(0, 4),
                answer, topic, subtopic, gsPaper,
                entities: [], keywords: [],
                sourceUrl,
            });
        }
    }

    return questions;
}

async function main() {
    console.log('🌐 Supplemental PYQ Scraper — Subject-level pages');
    console.log('='.repeat(60));

    // Load existing DB
    const db = existsSync(OUTPUT_FILE)
        ? JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8'))
        : { questions: [] };

    const existingKeys = new Set(
        db.questions.map((q: any) => q.question.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 80))
    );
    console.log(`📂 Existing DB: ${db.questions.length} questions`);

    let totalNew = 0;

    for (const page of SUBJECT_PAGES) {
        process.stdout.write(`📖 ${page.topic}... `);
        try {
            const res = await fetch(page.url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const html = await res.text();
            const questions = parseSubjectPage(html, page.topic, page.url);

            // Only add questions not already in the DB
            const newQs = questions.filter(q => {
                const key = q.question.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 80);
                return !existingKeys.has(key);
            });

            for (const q of newQs) {
                db.questions.push(q);
                existingKeys.add(q.question.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 80));
            }
            totalNew += newQs.length;
            console.log(`✅ ${questions.length} parsed, ${newQs.length} new`);
        } catch (err: any) {
            console.log(`❌ ${err.message}`);
        }
        await new Promise(r => setTimeout(r, 500));
    }

    // Sort and save
    db.questions.sort((a: any, b: any) => b.year - a.year || a.topic.localeCompare(b.topic));

    const years = Array.from(new Set(db.questions.map((q: any) => q.year))).sort() as number[];
    const prelimsCount = db.questions.filter((q: any) => q.paper?.includes('Prelims')).length;
    const mainsCount = db.questions.filter((q: any) => q.paper?.includes('Mains')).length;

    db.metadata = {
        totalQuestions: db.questions.length,
        prelimsQuestions: prelimsCount,
        mainsQuestions: mainsCount,
        yearRange: `${years[0]}-${years[years.length - 1]}`,
        lastUpdated: new Date().toISOString(),
        source: 'educationprovince.com',
    };

    writeFileSync(OUTPUT_FILE, JSON.stringify(db, null, 2));

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 SUPPLEMENT COMPLETE`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Added ${totalNew} new questions`);
    console.log(`📚 Total: ${db.questions.length} (${prelimsCount} Prelims + ${mainsCount} Mains)`);
    console.log(`💾 Saved: ${OUTPUT_FILE}`);
}

main().catch(console.error);
