/**
 * PYQ Web Scraper v2 — Corrected URLs from Education Province
 * Usage: npx tsx src/data/pyq/scrape-pyq.ts
 */

import { writeFileSync } from 'fs';
import path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'src', 'data', 'pyq', 'pyq-database.json');

interface PYQuestion {
    id: string;
    year: number;
    paper: string;
    question: string;
    options: string[];
    answer?: string;
    topic: string;
    subtopic: string;
    gsPaper: string;
    entities: string[];
    keywords: string[];
    sourceUrl: string;
}

const TOPIC_TO_GS: Record<string, string> = {
    'Art & Culture': 'GS1', 'Ancient History': 'GS1', 'Medieval History': 'GS1',
    'Modern History': 'GS1', 'Polity': 'GS2', 'Economy': 'GS3',
    'Geography': 'GS1', 'Environment': 'GS3', 'Science & Technology': 'GS3',
    'Current Affairs & GK': 'GS2',
};

// Corrected URLs from browser navigation (all verified)
const SUBTOPICS: Array<{ topic: string; subtopic: string; url: string }> = [
    // Ancient History
    { topic: 'Ancient History', subtopic: 'Politics and Society', url: 'https://educationprovince.com/1a-ancient-history-political-and-social-life-prelims-pyqs/' },
    { topic: 'Ancient History', subtopic: 'Architecture', url: 'https://educationprovince.com/1b-ancient-history-architecture-prelims-pyqs/' },
    { topic: 'Ancient History', subtopic: 'Literature', url: 'https://educationprovince.com/1c-ancient-history-literature-prelims-pyqs/' },
    { topic: 'Ancient History', subtopic: 'Religion and Philosophy', url: 'https://educationprovince.com/1d-ancient-history-religion-and-philosophy-prelims-pyqs/' },
    // Art & Culture
    { topic: 'Art & Culture', subtopic: 'Art and Craft', url: 'https://educationprovince.com/1e-art-and-craft-prelims-pyqs/' },
    { topic: 'Art & Culture', subtopic: 'Indian Culture and Heritage', url: 'https://educationprovince.com/1f-indian-culture-and-heritage-prelims-pyqs/' },
    // Medieval History
    { topic: 'Medieval History', subtopic: 'Important Rulers and Kingdoms', url: 'https://educationprovince.com/2a-medieval-indian-history-kingdoms-and-rulers-prelims-pyqs/' },
    { topic: 'Medieval History', subtopic: 'Advent of Europeans', url: 'https://educationprovince.com/2b-advent-of-europeans-in-medieval-india-prelims-pyqs/' },
    { topic: 'Medieval History', subtopic: 'Art, Architecture & Literature', url: 'https://educationprovince.com/2c-mediieval-indian-history-art-architecture-and-literature-prelims-pyqs/' },
    { topic: 'Medieval History', subtopic: 'Religion and Philosophy', url: 'https://educationprovince.com/2d-medieval-indian-history-religion-and-philosophy-prelims-pyqs/' },
    // Modern History
    { topic: 'Modern History', subtopic: 'Establishment of British Rule', url: 'https://educationprovince.com/3a-establishment-of-british-rule-in-india-prelims-pyqs/' },
    { topic: 'Modern History', subtopic: 'Popular Resistance Movements', url: 'https://educationprovince.com/3b-tribal-and-peasant-movements-prelims-pyqs/' },
    { topic: 'Modern History', subtopic: 'Socio-Religious Reforms', url: 'https://educationprovince.com/3c-socio-religious-reform-movements-prelims-pyqs/' },
    { topic: 'Modern History', subtopic: 'National Movement 1857-1905', url: 'https://educationprovince.com/3d-indian-national-movement-1858-1905-prelims-pyqs/' },
    { topic: 'Modern History', subtopic: 'National Movement 1905-1918', url: 'https://educationprovince.com/3e-indian-national-movement-1905-1918-prelims-pyqs/' },
    { topic: 'Modern History', subtopic: 'National Movement 1919-1939', url: 'https://educationprovince.com/3f-indian-national-movement-1919-1939-prelims-pyqs/' },
    { topic: 'Modern History', subtopic: 'National Movement 1939-1947', url: 'https://educationprovince.com/3g-indian-national-movement-1939-1947-prelims-pyqs/' },
    { topic: 'Modern History', subtopic: 'Governors General and Viceroys', url: 'https://educationprovince.com/3h-governors-general-and-viceroys-of-india-prelims-pyqs/' },
    { topic: 'Modern History', subtopic: 'Constitutional Developments', url: 'https://educationprovince.com/3i-constitutional-development-in-british-india-prelims-pyqs/' },
    { topic: 'Modern History', subtopic: 'Modern History Miscellany', url: 'https://educationprovince.com/3j-special-topics-personalities-modern-history-prelims-pyqs/' },
    // Polity
    { topic: 'Polity', subtopic: 'Political Theory', url: 'https://educationprovince.com/4a-political-theory-prelims-pyqs/' },
    { topic: 'Polity', subtopic: 'Indian Political System', url: 'https://educationprovince.com/4b-indian-political-system-prelims-pyqs/' },
    { topic: 'Polity', subtopic: 'Indian Constitution', url: 'https://educationprovince.com/4c-indian-constitution-prelims-pyqs/' },
    { topic: 'Polity', subtopic: 'Fundamental Rights', url: 'https://educationprovince.com/4d-fundamental-rights-prelims-pyqs/' },
    { topic: 'Polity', subtopic: 'DPSPs and Fundamental Duties', url: 'https://educationprovince.com/4e-dpsps-and-fundamental-duties-prelims-pyqs/' },
    { topic: 'Polity', subtopic: 'Ministers and Ministries', url: 'https://educationprovince.com/4f-ministers-ministries-and-secretariat-prelims-pyqs/' },
    { topic: 'Polity', subtopic: 'President/VP/Governor', url: 'https://educationprovince.com/4g-president-vice-president-and-governor-prelims-pyqs/' },
    { topic: 'Polity', subtopic: 'Union & State Legislature', url: 'https://educationprovince.com/4h-union-and-state-legislature-prelims-pyqs/' },
    { topic: 'Polity', subtopic: 'Judiciary & Judicial System', url: 'https://educationprovince.com/4i-judiciary-and-judicial-system-prelims-pyqs/' },
    { topic: 'Polity', subtopic: 'Elections & RPA Act', url: 'https://educationprovince.com/4j-elections-election-commission-and-rpa-act-prelims-pyqs/' },
    { topic: 'Polity', subtopic: 'Federalism & Center-State', url: 'https://educationprovince.com/4k-federalism-and-center-state-relations-prelims-pyqs/' },
    { topic: 'Polity', subtopic: 'Panchayati Raj & Local Government', url: 'https://educationprovince.com/4l-panchayati-raj-and-local-government-prelims-pyqs/' },
    { topic: 'Polity', subtopic: 'Constitutional Bodies', url: 'https://educationprovince.com/4m-constitutional-and-non-constitutional-bodies-prelims-pyqs/' },
    { topic: 'Polity', subtopic: 'Governance & Public Policy', url: 'https://educationprovince.com/4n-governance-and-public-policy-prelims-pyqs/' },
    { topic: 'Polity', subtopic: 'Polity Miscellany', url: 'https://educationprovince.com/4o-miscellaneous-topics-in-indian-polity-prelims-pyqs/' },
    // Economy
    { topic: 'Economy', subtopic: 'Macroeconomy', url: 'https://educationprovince.com/5a-macroeconomy-prelims-pyqs/' },
    { topic: 'Economy', subtopic: 'Money and Banking', url: 'https://educationprovince.com/5b-money-banking-and-financial-market-prelims-pyqs/' },
    { topic: 'Economy', subtopic: 'Taxation System', url: 'https://educationprovince.com/5c-taxation-system-in-india-prelims-pyqs/' },
    { topic: 'Economy', subtopic: 'External Sector & BoP', url: 'https://educationprovince.com/5d-external-sector-and-balance-of-payment-prelims-pyqs/' },
    { topic: 'Economy', subtopic: 'International Economic Organizations', url: 'https://educationprovince.com/5e-international-economic-organizations-prelims-pyqs/' },
    { topic: 'Economy', subtopic: 'Inclusive Growth & Poverty', url: 'https://educationprovince.com/5f-inclusive-growths-poverty-demographics-social-sector-initiatives-prelims-pyqs/' },
    { topic: 'Economy', subtopic: 'Five Year Planning', url: 'https://educationprovince.com/5g-five-year-planning-in-india-prelims-pyqs/' },
    { topic: 'Economy', subtopic: 'Infrastructure & Services', url: 'https://educationprovince.com/5h-infrastructure-and-services-sector-prelims-pyqs/' },
    // Geography
    { topic: 'Geography', subtopic: 'Physical Geography', url: 'https://educationprovince.com/6a-physical-geography-prelims-pyqs/' },
    { topic: 'Geography', subtopic: 'Climatology', url: 'https://educationprovince.com/6b-climatology-prelims-pyqs/' },
    { topic: 'Geography', subtopic: 'Oceanography', url: 'https://educationprovince.com/6c-oceanography-prelims-pyqs/' },
    { topic: 'Geography', subtopic: 'Map-Based India', url: 'https://educationprovince.com/6d-indian-geography-map-based-questions-prelims-pyqs/' },
    { topic: 'Geography', subtopic: 'Mountains and Glaciers', url: 'https://educationprovince.com/6e-indian-geography-mountains-glaciers-and-associated-landforms-prelims-pyqs/' },
    { topic: 'Geography', subtopic: 'Rocks, Soil and Minerals', url: 'https://educationprovince.com/6f-indian-geography-rocks-soil-minerals-and-other-natural-resources-prelims-pyqs/' },
    { topic: 'Geography', subtopic: 'Rivers and Lakes', url: 'https://educationprovince.com/6g-indian-geography-rivers-lakes-and-lagoons-prelims-pyqs/' },
    { topic: 'Geography', subtopic: 'Location and Climate', url: 'https://educationprovince.com/6h-indian-geography-location-climate-forests-etc-prelims-pyqs/' },
    { topic: 'Geography', subtopic: 'Agriculture', url: 'https://educationprovince.com/6i-agriculture-and-geography-prelims-pyqs/' },
    { topic: 'Geography', subtopic: 'Roads, Railways and Ports', url: 'https://educationprovince.com/6j-indian-geography-roads-railways-ports-and-airports-prelims-pyqs/' },
    { topic: 'Geography', subtopic: 'Industries and Projects', url: 'https://educationprovince.com/7k-indian-geography-industries-and-other-major-projects-prelims-pyqs/' },
    { topic: 'Geography', subtopic: 'World Regional Geography', url: 'https://educationprovince.com/6l-world-geography-geographical-features-and-natural-resources-prelims-pyqs/' },
    { topic: 'Geography', subtopic: 'Map-Based World', url: 'https://educationprovince.com/6m-world-geography-map-based-questions-prelims-pyqs/' },
    // Environment
    { topic: 'Environment', subtopic: 'Ecology and Ecosystem', url: 'https://educationprovince.com/7a-ecology-and-ecosystem-prelims-pyqs/' },
    { topic: 'Environment', subtopic: 'Biodiversity', url: 'https://educationprovince.com/7b-biodiversity-prelims-pyqs/' },
    { topic: 'Environment', subtopic: 'Pollution and Degradation', url: 'https://educationprovince.com/7c-pollution-and-degradation-prelims-pyqs/' },
    { topic: 'Environment', subtopic: 'Climate Change', url: 'https://educationprovince.com/7d-climate-change-prelims-pyqs/' },
    { topic: 'Environment', subtopic: 'Environmental Governance', url: 'https://educationprovince.com/7e-environmental-governance-prelims-pyqs/' },
    { topic: 'Environment', subtopic: 'Agriculture and Environment', url: 'https://educationprovince.com/7f-agriculture-and-environment-prelims-pyqs/' },
    // Science & Technology
    { topic: 'Science & Technology', subtopic: 'Electronics and IT', url: 'https://educationprovince.com/8a-electronics-and-it-prelims-pyqs/' },
    { topic: 'Science & Technology', subtopic: 'Space Technology', url: 'https://educationprovince.com/8b-astrophysics-and-space-technology-prelims-pyqs/' },
    { topic: 'Science & Technology', subtopic: 'Biotechnology', url: 'https://educationprovince.com/8c-biotechnology-prelims-pyqs/' },
    { topic: 'Science & Technology', subtopic: 'Physics', url: 'https://educationprovince.com/8d-physics-prelims-pyqs/' },
    { topic: 'Science & Technology', subtopic: 'Chemistry', url: 'https://educationprovince.com/8e-chemistry-prelims-pyqs/' },
    { topic: 'Science & Technology', subtopic: 'Biology', url: 'https://educationprovince.com/8f-biology-prelims-pyqs/' },
    { topic: 'Science & Technology', subtopic: 'Diseases', url: 'https://educationprovince.com/8g-diseases-prelims-pyqs/' },
    { topic: 'Science & Technology', subtopic: 'S&T Miscellany', url: 'https://educationprovince.com/8h-miscellaneous-science-and-technology-prelims-pyqs/' },
    // Current Affairs & GK
    { topic: 'Current Affairs & GK', subtopic: 'Defence', url: 'https://educationprovince.com/9a-defence-prelims-pyqs/' },
    { topic: 'Current Affairs & GK', subtopic: 'Nuclear Weapons and Treaties', url: 'https://educationprovince.com/9b-nuclear-weapons-and-treaties-prelims-pyqs/' },
    { topic: 'Current Affairs & GK', subtopic: 'International Organizations', url: 'https://educationprovince.com/9c-international-organizations-and-treaties-prelims-pyqs/' },
    { topic: 'Current Affairs & GK', subtopic: 'General Knowledge', url: 'https://educationprovince.com/9d-general-knowledge-miscellany-prelims-pyqs/' },
];

// ---------------------------------------------------------------------------
// Parse questions from page HTML
// ---------------------------------------------------------------------------

function parseQuestions(html: string, topic: string, subtopic: string, sourceUrl: string): PYQuestion[] {
    const questions: PYQuestion[] = [];
    const gsPaper = TOPIC_TO_GS[topic] || 'GS1';

    // Strip scripts/styles
    let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');

    // Try to get article content
    const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) text = articleMatch[1];

    // Convert HTML to text
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

    // Find year sections — handles both "2020 Prelims PYQs" and "2010-1995 Prelims PYQs"
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

        // Find questions: "1] ...", "2] ...", etc.
        const qRegex = /(\d{1,3})\]\s+([\s\S]*?)(?=\d{1,3}\]\s|$)/g;
        let qm;

        while ((qm = qRegex.exec(section)) !== null) {
            const qNum = parseInt(qm[1]);
            let qBlock = qm[2].trim();

            // Extract year tag [2024] or [2025/A-56]
            const yearTag = qBlock.match(/\[(\d{4})(?:\/[A-Z]-?\d+)?\]/);
            let questionYear: number;
            if (yearTag) {
                questionYear = parseInt(yearTag[1]);
            } else if (isRange) {
                // In range sections, keep questions but mark year as 0 (pre-2011, exact year unknown)
                questionYear = 0;
            } else {
                questionYear = year;
            }
            qBlock = qBlock.replace(/\[\d{4}(?:\/[A-Z]-?\d+)?\]/, '').trim();

            // Extract answer
            const ansMatch = qBlock.match(/Ans(?:wer)?[:\s]*\(?([a-dA-D])\)?/i);
            const answer = ansMatch ? ansMatch[1].toLowerCase() : undefined;
            if (ansMatch) qBlock = qBlock.substring(0, qBlock.indexOf(ansMatch[0])).trim();

            // Clean junk
            qBlock = qBlock
                .replace(/The explanations.*$/gm, '')
                .replace(/Click here.*$/gm, '')
                .replace(/Already logged.*$/gm, '')
                .replace(/Get Hard Copy.*$/gm, '')
                .replace(/Purchase Soft.*$/gm, '')
                .trim();

            // Extract options
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

            // Extract entities
            const entities = new Set<string>();
            const entPatterns = [
                /Article\s+\d+[A-Z]?/gi,
                /(?:\w+\s+){0,2}Act(?:,?\s+\d{4})?/gi,
                /Schedule\s+[IVXLCDM]+/gi,
            ];
            for (const pat of entPatterns) {
                let em;
                while ((em = pat.exec(questionText)) !== null) {
                    if (em[0].length > 3 && em[0].length < 60) entities.add(em[0].trim());
                }
            }

            const id = `P${questionYear}-${topic.replace(/[^a-zA-Z]/g, '').substring(0, 4)}-Q${qNum}-${subtopic.replace(/[^a-zA-Z]/g, '').substring(0, 8)}`;

            questions.push({
                id, year: questionYear, paper: 'Prelims GS1',
                question: questionText, options: options.slice(0, 4),
                answer, topic, subtopic, gsPaper,
                entities: Array.from(entities).slice(0, 10),
                keywords: [],
                sourceUrl,
            });
        }
    }

    return questions;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    console.log('🌐 PYQ Web Scraper v2 — Education Province');
    console.log('='.repeat(60));
    console.log(`📋 ${SUBTOPICS.length} subtopic pages to scrape\n`);

    const allQuestions: PYQuestion[] = [];
    let ok = 0, fail = 0;

    for (const sub of SUBTOPICS) {
        process.stdout.write(`📖 ${sub.topic} → ${sub.subtopic}... `);
        try {
            const res = await fetch(sub.url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const html = await res.text();
            const qs = parseQuestions(html, sub.topic, sub.subtopic, sub.url);
            allQuestions.push(...qs);
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
    const unique = allQuestions.filter(q => {
        const key = q.question.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 80);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    unique.sort((a, b) => b.year - a.year || a.topic.localeCompare(b.topic));

    const years = Array.from(new Set(unique.map(q => q.year))).sort();
    const topics = Array.from(new Set(unique.map(q => q.topic)));

    const db = {
        metadata: {
            totalQuestions: unique.length,
            yearRange: `${years[0]}-${years[years.length - 1]}`,
            lastUpdated: new Date().toISOString(),
            source: 'educationprovince.com',
            subjects: topics.length,
            subtopics: new Set(unique.map(q => `${q.topic}/${q.subtopic}`)).size,
        },
        questions: unique,
    };

    writeFileSync(OUTPUT_FILE, JSON.stringify(db, null, 2));

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 SCRAPING COMPLETE`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Total: ${unique.length} unique questions (${allQuestions.length - unique.length} dupes removed)`);
    console.log(`📄 Pages: ${ok} ok, ${fail} failed`);
    console.log(`📅 Years: ${years[0]}-${years[years.length - 1]}`);

    const tc: Record<string, number> = {};
    for (const q of unique) tc[q.topic] = (tc[q.topic] || 0) + 1;
    console.log(`\n📑 Topic Distribution:`);
    Object.entries(tc).sort(([, a], [, b]) => b - a).forEach(([t, c]) => {
        console.log(`  ${t.padEnd(25)} ${String(c).padStart(4)} (${((c / unique.length) * 100).toFixed(1)}%)`);
    });

    const yc: Record<number, number> = {};
    for (const q of unique) yc[q.year] = (yc[q.year] || 0) + 1;
    console.log(`\n📅 Year Distribution (last 10):`);
    for (let y = 2025; y >= 2016; y--) console.log(`  ${y}: ${yc[y] || 0}`);

    console.log(`\n💾 Saved: ${OUTPUT_FILE}`);
}

main().catch(console.error);
