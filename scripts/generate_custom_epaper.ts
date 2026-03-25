import { writeFileSync } from 'fs';
import { generateDailyEpaper } from '../src/lib/epaper-generator';
import { scrapeEpaperSources, type RawEpaperArticle, fetchArticleFullText } from '../src/lib/epaper-scraper';
import { saveEpaper } from '../src/lib/epaper-store';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("No API key found in environment variables.");
        process.exit(1);
    }

    // 1. Actually Scrape the News Dynamically
    console.log("Fetching fresh headlines from RSS sources...");
    let rawScrapedArticles = await scrapeEpaperSources();
    console.log(`Successfully scraped ${rawScrapedArticles.length} raw articles.`);

    if (rawScrapedArticles.length === 0) {
        console.error("No articles scraped. Exiting.");
        process.exit(1);
    }

    // 2. Dynamic Clustering to find the Master Lead "Critical Mass"
    const majorThemes = [
        { name: 'Iran-Israel / Middle East Conflict', keywords: ['iran', 'israel', 'lebanon', 'hezbollah', 'gaza', 'middle east', 'arab', 'west asia', 'hamas', 'war', 'missile', 'strike'] },
        { name: 'Supreme Court & Judiciary', keywords: ['supreme court', 'sc', 'cji', 'chief justice', 'verdict', 'judiciary', 'bench', 'high court'] },
        { name: 'Reserve Bank & Economy', keywords: ['rbi', 'repo', 'inflation', 'gdp', 'economy', 'shaktikanta', 'monetary', 'banks', 'rupee'] },
        { name: 'Space & ISRO', keywords: ['isro', 'space', 'satellite', 'gaganyaan', 'chandrayaan', 'orbit', 'nasa'] },
        { name: 'Elections & Polity', keywords: ['election', 'poll', 'parliament', 'lok sabha', 'assembly', 'eci', 'voter'] },
        { name: 'Environment & Climate', keywords: ['climate', 'environment', 'pollution', 'emissions', 'cop', 'warming', 'wildlife', 'conservation', 'forest'] },
        { name: 'International Diplomacy (India)', keywords: ['jaishankar', 'modi', 'diplomacy', 'bilateral', 'multilateral', 'border', 'china', 'us', 'usa', 'russia'] }
    ];

    let themeCounts = majorThemes.map(t => ({ ...t, count: 0, articles: [] as RawEpaperArticle[] }));

    for (let article of rawScrapedArticles) {
        let textLowerCase = (article.title + " " + article.description).toLowerCase();
        for (let theme of themeCounts) {
            // Count if any keyword from the theme is mentioned
            if (theme.keywords.some(kw => textLowerCase.includes(kw))) {
                theme.count++;
                theme.articles.push(article);
                // A headline usually belongs predominantly to one major theme for lead purposes
                break;
            }
        }
    }

    // Sort themes by frequency to find the "critical mass" story
    themeCounts.sort((a, b) => b.count - a.count);
    const dominantTheme = themeCounts[0];

    let leadArticles: RawEpaperArticle[] = [];
    let otherArticles: RawEpaperArticle[] = [];

    if (dominantTheme.count > 2) { // Need at least a few articles to be a "trend"
        console.log(`Determined Master Lead Theme: ${dominantTheme.name} with ${dominantTheme.count} articles.`);
        leadArticles = dominantTheme.articles.slice(0, 15); // limit the context size for the prompt

        // Everything else goes to 'other'
        let leadUrls = new Set(leadArticles.map(a => a.link));
        otherArticles = rawScrapedArticles.filter(a => !leadUrls.has(a.link));
    } else {
        console.log("No single dominant theme reached critical mass. Resorting to Top Priority News as Lead.");
        leadArticles = rawScrapedArticles.slice(0, 5);
        otherArticles = rawScrapedArticles.slice(5);
    }

    console.log(`Generating Master Lead Story via Gemini for ${leadArticles.length} combined headlines...`);
    const leadPrompt = `
You are an expert news editor. Below are several headlines and brief descriptions related to a highly dominant current event: ${dominantTheme.count > 2 ? dominantTheme.name : 'Top Global News'}.
Synthesize this into a cohesive, highly informative 300-word Master Lead Story summary for a UPSC current affairs ePaper. Provide JUST the text of the story. No markdown formatting or headers, just prose. Focus on facts, macroeconomic implications, and geopolitical or national relevance.

Headlines:
${leadArticles.map(a => `- ${a.title}: ${a.description.substring(0, 150)}...`).join('\n')}
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
        leadDescription = "Critical developments are occurring rapidly. Please refer to individual reports for detailed analysis as the situation evolves.";
    }

    // 3. Heuristically select the top 25 from the remaining scraped articles
    const upscKeywords = [
        'environment', 'climate', 'coral', 'species', 'biodiversity', 'conservation', 'wildlife', 'pollution', 'solar', 'energy', 'emission', 'carbon', 'forest', 'green', 'water', 'river', 'lake', 'national park', 'sanctuary', 'tiger', 'elephant', 'glacier', 'warming', 'hurricane', 'cyclone', 'earthquake', 'disaster',
        'gdp', 'fdi', 'rbi', 'inflation', 'export', 'import', 'infrastructure', 'investment', 'tax', 'gst', 'wto', 'imf', 'world bank', 'bank', 'rupee', 'forex', 'deficit', 'budget', 'finance', 'subsidy', 'agriculture', 'manufacturing', 'industry', 'msme', 'trade', 'startup', 'debt', 'growth',
        'isro', 'nasa', 'space', 'satellite', 'ai', 'artificial intelligence', 'disease', 'vaccine', 'quantum', 'gene', 'cyber', 'technology', 'drdo', 'rocket', 'mission', 'research', 'scientific', 'internet', 'data', 'health', 'medicine', 'robotics', 'semiconductor', 'defence', 'missile',
        'supreme court', 'high court', 'sc ', 'constitution', 'bill', 'act', 'parliament', 'scheme', 'yojana', 'governance', 'fundamental', 'rights', 'election commission', 'judiciary', 'legislation', 'ordinance', 'amendment', 'policy', 'ministry', 'cabinet', 'pm ', 'president', 'democracy', 'federal', 'state', 'centre',
        'un ', 'united nations', 'g20', 'asean', 'quad', 'brics', 'treaty', 'jaishankar', 'foreign', 'diplomacy', 'ambassador', 'summit', 'border', 'bilateral', 'multilateral', 'war', 'conflict', 'peace', 'agreement', 'mou', 'international', 'global', 'scheme', 'yojana'
    ];

    let items = [];
    for (let article of otherArticles) {
        let textLowerCase = (article.title + " " + article.description).toLowerCase();
        let score = 0;

        // Base score from source priority
        if (article.section === 'Editorial' || article.section === 'Explained' || article.section === 'Lead Opinion') score += 5;
        if (article.sourceShort === 'PIB' || article.sourceShort === 'PRS') score += 10;

        // Deduct points for irrelevant local news
        if (textLowerCase.includes('ed attaches') || textLowerCase.includes('arrested') || textLowerCase.includes('murder') || textLowerCase.includes('bribe') || textLowerCase.includes('rape') || textLowerCase.includes('killed') || textLowerCase.includes('suicide')) score -= 50;

        for (let kw of upscKeywords) {
            if (textLowerCase.includes(kw)) {
                score += 8;
            }
        }

        items.push({ article, score });
    }

    items.sort((a, b) => b.score - a.score);
    const top25 = items.slice(0, 50).map(i => i.article);

    // Fetch full article text for the top 25 articles to improve AI quality
    console.log(`Fetching full article text for ${top25.length} selected articles...`);
    const fullTextResults = await Promise.allSettled(
        top25.map(article => fetchArticleFullText(article.link))
    );
    let enrichedCount = 0;
    for (let i = 0; i < top25.length; i++) {
        const result = fullTextResults[i];
        if (result.status === 'fulfilled' && result.value) {
            top25[i].fullText = result.value;
            enrichedCount++;
        }
    }
    console.log(`Enriched ${enrichedCount}/${top25.length} articles with full text.`);

    const organizedArticles: RawEpaperArticle[] = [];

    // 1. Add Master Lead as priority 0 to ensure it gets the top spot
    organizedArticles.push({
        title: `Master Lead: ${dominantTheme.count > 2 ? dominantTheme.name : 'Top Developments of the Day'}`,
        description: leadDescription,
        link: leadArticles[0]?.link || "https://currentprep.in",
        pubDate: new Date().toISOString(),
        source: "CurrentPrep Special Coverage",
        sourceShort: "CurrentPrep",
        section: "Lead Opinion",
        priority: 0
    });

    // 2. Add Top 25
    organizedArticles.push(...top25);

    console.log(`Starting epaper generation pipeline with ${organizedArticles.length} raw articles...`);

    const epaper = await generateDailyEpaper(organizedArticles, apiKey);

    // Save to Data Store
    await saveEpaper(epaper);
    console.log(`✅ ePaper successfully created and saved for today (${epaper.date})! Included ${epaper.articles.length} fully structured explainers.`);

    // Also save a small manifest
    writeFileSync('generation_manifest.json', JSON.stringify({
        masterLeadTheme: dominantTheme.name,
        masterLeadArticleCount: leadArticles.length,
        selectedHeadlineCount: top25.length,
        selectedHeadlines: top25.map(i => i.title)
    }, null, 2));
}

// Ensure the tsconfig path aliasing is set up correctly for tsx to resolve "@/lib/*"
// This environment variable trick helps tsx resolve Next.js paths.
process.env.TS_NODE_PROJECT = 'tsconfig.json';
main().catch(console.error);
