import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import { generateDailyEpaper } from '../src/lib/epaper-generator';
import { scrapeEpaperSources, type RawEpaperArticle, fetchArticleFullText } from '../src/lib/epaper-scraper';
import { saveEpaper } from '../src/lib/epaper-store';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// ---------------------------------------------------------------------------
// Cross-day dedup helpers
// ---------------------------------------------------------------------------

interface YesterdayData {
    urls: Set<string>;
    headlines: string[];
    leadTheme: string;
}

function loadYesterdayEpaper(): YesterdayData | null {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yDate = yesterday.toISOString().split('T')[0];

        const filePath = path.join(process.cwd(), 'src', 'data', 'epaper', `epaper-${yDate}.json`);
        if (!existsSync(filePath)) return null;

        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        const urls = new Set<string>(
            (data.articles || []).map((a: any) => a.sourceUrl).filter(Boolean)
        );
        const headlines: string[] = (data.articles || []).map((a: any) => a.headline || '');

        // Try to determine yesterday's lead theme from the manifest
        let leadTheme = '';
        try {
            const manifestPath = path.join(process.cwd(), 'generation_manifest.json');
            if (existsSync(manifestPath)) {
                const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
                leadTheme = manifest.masterLeadTheme || '';
            }
        } catch { /* ignore */ }

        // Also infer lead theme from first article's category/tags
        if (!leadTheme && data.articles?.length > 0) {
            leadTheme = data.articles[0].headline || '';
        }

        console.log(`[cross-day] Loaded yesterday's ePaper (${yDate}): ${urls.size} URLs, ${headlines.length} articles, lead="${leadTheme.slice(0, 50)}"`);
        return { urls, headlines, leadTheme };
    } catch (err: any) {
        console.log(`[cross-day] Could not load yesterday's ePaper: ${err.message}`);
        return null;
    }
}

const CROSS_DAY_STOPWORDS = new Set([
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is',
    'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'it', 'its',
    'by', 'from', 'with', 'as', 'that', 'this', 'not', 'but', 'will', 'can',
    'may', 'over', 'says', 'said', 'new', 'after', 'amid', 'amidst', 'under',
    'into', 'about', 'between', 'more', 'also', 'how', 'why', 'what', 'who',
    'india', 'indian', 'government', 'centre', 'state', 'country', 'national',
]);

function getWords(text: string): Set<string> {
    return new Set(
        text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
            .filter(w => w.length > 2 && !CROSS_DAY_STOPWORDS.has(w))
    );
}

function wordOverlap(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) return 0;
    let inter = 0;
    for (const w of a) { if (b.has(w)) inter++; }
    return inter / Math.min(a.size, b.size);
}

function filterCrossDayDuplicates(
    articles: RawEpaperArticle[],
    yesterday: YesterdayData
): RawEpaperArticle[] {
    const yesterdayWordSets = yesterday.headlines.map(h => getWords(h));
    let urlDropped = 0;
    let semanticDropped = 0;

    const result = articles.filter(a => {
        // Exact URL match → remove
        if (yesterday.urls.has(a.link)) {
            urlDropped++;
            return false;
        }

        // Semantic headline similarity → remove if >65% overlap with any yesterday headline
        const titleWords = getWords(a.title);
        for (const yWords of yesterdayWordSets) {
            if (wordOverlap(titleWords, yWords) > 0.65) {
                semanticDropped++;
                console.log(`[cross-day] Dropping "${a.title.slice(0, 70)}" (similar to yesterday)`);
                return false;
            }
        }

        return true;
    });

    if (urlDropped > 0 || semanticDropped > 0) {
        console.log(`[cross-day] Removed ${urlDropped} exact URL matches + ${semanticDropped} semantically similar articles`);
        console.log(`[cross-day] ${result.length} articles remain after cross-day dedup`);
    }
    return result;
}

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

    // 1b. Cross-day deduplication — remove articles already in yesterday's ePaper
    const yesterday = loadYesterdayEpaper();
    if (yesterday) {
        rawScrapedArticles = filterCrossDayDuplicates(rawScrapedArticles, yesterday);
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
    let dominantTheme = themeCounts[0];

    // Cross-day lead prevention: if the dominant theme is the same as yesterday's,
    // try to use the second-most-frequent theme instead
    if (yesterday && dominantTheme.count > 2) {
        const yesterdayLeadWords = getWords(yesterday.leadTheme);
        const dominantWords = getWords(dominantTheme.name);
        if (wordOverlap(dominantWords, yesterdayLeadWords) > 0.5 && themeCounts.length > 1 && themeCounts[1].count > 2) {
            console.log(`[cross-day] Lead theme "${dominantTheme.name}" is same as yesterday — switching to "${themeCounts[1].name}"`);
            dominantTheme = themeCounts[1];
        }
    }

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
