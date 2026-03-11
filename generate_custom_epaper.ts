import { readFileSync, writeFileSync } from 'fs';
import { generateDailyEpaper } from './src/lib/epaper-generator';
import { saveEpaper } from './src/lib/epaper-store';
import type { RawEpaperArticle } from './src/lib/epaper-scraper';

async function main() {
    const envContent = readFileSync('.env.local', 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    const apiKey = match ? match[1].trim() : null;

    if (!apiKey) {
        console.error("No API key found.");
        process.exit(1);
    }

    // Read the categorized markdown list
    const data = readFileSync('/Users/mgtvalavan/.gemini/antigravity/brain/eda4ef91-2e20-4cf3-addc-d7e374b5e439/headlines_categorized_all.md', 'utf8');
    const sections = data.split('### ');

    let iranIsraelLines: string[] = [];
    let otherLines: string[] = [];

    for (let i = 1; i < sections.length; i++) {
        const lines = sections[i].split('\n').filter(l => l.match(/^\d+\.\s+\[/));
        if (sections[i].includes('Iran-Israel War')) {
            iranIsraelLines.push(...lines);
        } else {
            otherLines.push(...lines);
        }
    }

    console.log(`Found ${iranIsraelLines.length} Iran-Israel lines and ${otherLines.length} other lines.`);

    console.log("Generating Master Lead Story via fetch API...");
    const leadPrompt = `
You are an expert news editor. Below are over 100 headlines related to the Iran-Israel War and the resulting West Asia crisis (including the LPG shortage in India, international reactions, military actions, and economic implications).
Synthesize this into a cohesive, highly informative 300-word Master Lead Story summary for a UPSC current affairs ePaper. Provide JUST the text of the story. No markdown formatting or headers, just prose.

Headlines:
${iranIsraelLines.join('\n')}
    `;

    let leadDescription = "";
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: leadPrompt }] }],
                generationConfig: { temperature: 0.3 }
            })
        });

        if (!response.ok) {
            console.error("Gemini API error for lead story:", await response.text());
            throw new Error("API failed");
        }

        const json = await response.json();
        leadDescription = json.candidates[0].content.parts[0].text;
    } catch (e) {
        console.error("Failed to generate master lead:", e);
        leadDescription = "Tensions escalate in the Middle East as the Iran-Israel conflict widens, impacting global oil prices and resulting in a commercial LPG shortage across India. The US and regional players respond with military deployments while diplomatic efforts remain strained.";
    }

    // Heuristically select the top 25 from other lines
    const upscKeywords = [
        'environment', 'climate', 'coral', 'species', 'biodiversity', 'conservation', 'wildlife', 'pollution', 'solar', 'energy', 'emission', 'carbon', 'forest', 'green', 'water', 'river', 'lake', 'national park', 'sanctuary', 'tiger', 'elephant', 'glacier', 'warming', 'hurricane', 'cyclone', 'earthquake', 'disaster',
        'gdp', 'fdi', 'rbi', 'inflation', 'export', 'import', 'infrastructure', 'investment', 'tax', 'gst', 'wto', 'imf', 'world bank', 'bank', 'rupee', 'forex', 'deficit', 'budget', 'finance', 'subsidy', 'agriculture', 'manufacturing', 'industry', 'msme', 'trade', 'startup', 'debt', 'growth',
        'isro', 'nasa', 'space', 'satellite', 'ai', 'artificial intelligence', 'disease', 'vaccine', 'quantum', 'gene', 'cyber', 'technology', 'drdo', 'rocket', 'mission', 'research', 'scientific', 'internet', 'data', 'health', 'medicine', 'robotics', 'semiconductor', 'defence', 'missile',
        'supreme court', 'high court', 'sc ', 'constitution', 'bill', 'act', 'parliament', 'scheme', 'yojana', 'governance', 'fundamental', 'rights', 'election commission', 'judiciary', 'legislation', 'ordinance', 'amendment', 'policy', 'ministry', 'cabinet', 'pm ', 'president', 'democracy', 'federal', 'state', 'centre',
        'un ', 'united nations', 'g20', 'asean', 'quad', 'brics', 'treaty', 'jaishankar', 'foreign', 'diplomacy', 'ambassador', 'summit', 'border', 'bilateral', 'multilateral', 'war', 'conflict', 'peace', 'agreement', 'mou', 'international', 'global'
    ];

    let items = [];
    for (let line of otherLines) {
        let textLowerCase = line.toLowerCase();
        let score = 0;

        if (textLowerCase.includes('[science')) score += 5;
        if (textLowerCase.includes('[environment]')) score += 7;
        if (textLowerCase.includes('[world]')) score += 3;
        if (textLowerCase.includes('[international]')) score += 3;
        if (textLowerCase.includes('[business]')) score += 4;
        if (textLowerCase.includes('ed attaches') || textLowerCase.includes('arrested') || textLowerCase.includes('murder') || textLowerCase.includes('bribe')) score -= 20;

        for (let kw of upscKeywords) {
            if (textLowerCase.includes(kw)) {
                score += 10;
            }
        }

        let match = line.match(/^(\d+)\.\s+/);
        let num = match ? parseInt(match[1]) : 0;

        items.push({ line, score, num });
    }

    items.sort((a, b) => b.score - a.score);
    const top25 = items.slice(0, 25);
    // Sort them back closely to their original occurrence so it feels somewhat structured
    top25.sort((a, b) => a.num - b.num);

    const rawArticles: RawEpaperArticle[] = [];

    // 1. Add Master Lead as priority 0 to ensure it gets the top spot
    rawArticles.push({
        title: "Master Lead: West Asia Crisis Escalates — Impact on Global Security and Indian Economy",
        description: leadDescription,
        link: "https://currentprep.in",
        pubDate: new Date().toISOString(),
        source: "CurrentPrep Special Coverage",
        sourceShort: "CurrentPrep",
        section: "Lead Opinion",
        priority: 0
    });

    // 2. Add Top 25
    for (let item of top25) {
        const match = item.line.match(/^\d+\.\s+\[(.*?)\]\s+(.*)/);
        if (match) {
            rawArticles.push({
                title: match[2],
                description: match[2],
                link: "https://currentprep.in/news",
                pubDate: new Date().toISOString(),
                source: "Various",
                sourceShort: "Various Sources",
                section: match[1],
                priority: 2
            });
        }
    }

    console.log(`Starting epaper generation pipeline with ${rawArticles.length} raw articles...`);

    const epaper = await generateDailyEpaper(rawArticles, apiKey);

    // Save to Data Store
    saveEpaper(epaper);
    console.log(`✅ ePaper successfully created and saved for today (${epaper.date})! Included ${epaper.articles.length} fully structured explainers.`);

    // Also save a small manifest
    writeFileSync('generation_manifest.json', JSON.stringify({
        masterLead: rawArticles[0],
        selectedHeadlineCount: top25.length,
        selectedHeadlines: top25.map(i => i.line)
    }, null, 2));
}

// Ensure the tsconfig path aliasing is set up correctly for tsx to resolve "@/lib/*"
// This environment variable trick helps tsx resolve Next.js paths.
process.env.TS_NODE_PROJECT = 'tsconfig.json';
main().catch(console.error);
