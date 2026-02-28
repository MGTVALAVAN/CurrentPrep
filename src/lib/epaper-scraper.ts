/**
 * ePaper Scraper — Enhanced RSS scraper for the UPSC Daily ePaper.
 *
 * Fetches and parses RSS feeds from all configured ePaper sources.
 * Uses the same lightweight XML parser as the current-affairs scraper
 * but with expanded support for more feed formats and sources.
 */

import { EPAPER_SOURCES, type EpaperSource } from './epaper-sources';

export interface RawEpaperArticle {
    title: string;
    description: string;
    link: string;
    pubDate: string;
    source: string;
    sourceShort: string;
    section: string;
    priority: number;
}

// ---------------------------------------------------------------------------
// Minimal XML → items extractor (no external dependency)
// ---------------------------------------------------------------------------

function extractCDATA(text: string): string {
    return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getTagContent(xml: string, tag: string): string {
    const patterns = [
        new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i'),
        new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'),
    ];
    for (const p of patterns) {
        const m = xml.match(p);
        if (m) return extractCDATA(m[1]).trim();
    }
    return '';
}

function parseRSSItems(
    xml: string
): Array<{ title: string; description: string; link: string; pubDate: string }> {
    const items: Array<{
        title: string;
        description: string;
        link: string;
        pubDate: string;
    }> = [];

    const itemRegex =
        /<item[\s>]([\s\S]*?)<\/item>|<entry[\s>]([\s\S]*?)<\/entry>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1] || match[2] || '';
        const title = stripHtml(getTagContent(block, 'title'));
        let description = stripHtml(
            getTagContent(block, 'description') ||
            getTagContent(block, 'content:encoded') ||
            getTagContent(block, 'summary') ||
            getTagContent(block, 'content')
        );

        if (description.length > 600) {
            description = description.slice(0, 600) + '…';
        }

        const link =
            getTagContent(block, 'link') ||
            (block.match(/<link[^>]+href="([^"]+)"/)?.[1] ?? '');

        const pubDate =
            getTagContent(block, 'pubDate') ||
            getTagContent(block, 'published') ||
            getTagContent(block, 'dc:date') ||
            getTagContent(block, 'updated') ||
            '';

        if (title) {
            items.push({ title, description, link, pubDate });
        }
    }

    return items;
}

// ---------------------------------------------------------------------------
// Fetch a single RSS feed
// ---------------------------------------------------------------------------

async function fetchFeed(
    url: string,
    source: EpaperSource,
    section: string,
    priority: number,
    timeoutMs = 15000
): Promise<RawEpaperArticle[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (compatible; CurrentPrep-ePaper/1.0; +https://currentprep.in)',
                Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
                'Accept-Encoding': 'gzip, deflate',
            },
            next: { revalidate: 0 },
        });

        if (!res.ok) {
            console.warn(`[epaper-scraper] Feed returned ${res.status}: ${source.shortName} (${section})`);
            return [];
        }

        const xml = await res.text();
        const items = parseRSSItems(xml);

        if (items.length > 0) {
            console.log(`[epaper-scraper] ✅ ${source.shortName} — ${section}: ${items.length} items`);
        }

        return items.map((item) => ({
            title: item.title,
            description: item.description,
            link: item.link,
            pubDate: item.pubDate,
            source: source.name,
            sourceShort: source.shortName,
            section,
            priority,
        }));
    } catch (err: any) {
        if (err.name === 'AbortError') {
            console.warn(`[epaper-scraper] Timeout: ${source.shortName} (${section})`);
        } else {
            console.warn(`[epaper-scraper] Error: ${source.shortName} (${section}): ${err.message}`);
        }
        return [];
    } finally {
        clearTimeout(timer);
    }
}

// ---------------------------------------------------------------------------
// Filtering & Deduplication
// ---------------------------------------------------------------------------

function isWithin24Hours(dateStr: string): boolean {
    if (!dateStr) return true;
    try {
        const d = new Date(dateStr);
        const now = new Date();
        return now.getTime() - d.getTime() < 24 * 60 * 60 * 1000;
    } catch {
        return true;
    }
}

function deduplicateArticles(articles: RawEpaperArticle[]): RawEpaperArticle[] {
    const seen = new Set<string>();
    return articles.filter((a) => {
        const key = a.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 60);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ---------------------------------------------------------------------------
// Main: scrape all ePaper sources
// ---------------------------------------------------------------------------

/**
 * Scrapes all configured ePaper RSS feeds and returns deduplicated articles
 * from the last 24 hours, sorted by priority and relevance.
 */
export async function scrapeEpaperSources(): Promise<RawEpaperArticle[]> {
    console.log('[epaper-scraper] Starting ePaper scrape of all sources…');

    const feedPromises: Promise<RawEpaperArticle[]>[] = [];

    for (const source of EPAPER_SOURCES) {
        for (const feed of source.rssFeeds) {
            feedPromises.push(
                fetchFeed(feed.url, source, feed.section, feed.priority)
            );
        }
    }

    const results = await Promise.allSettled(feedPromises);
    let allArticles: RawEpaperArticle[] = [];

    let successCount = 0;
    let failCount = 0;

    for (const result of results) {
        if (result.status === 'fulfilled') {
            allArticles = allArticles.concat(result.value);
            if (result.value.length > 0) successCount++;
        } else {
            failCount++;
        }
    }

    console.log(
        `[epaper-scraper] Feeds: ${successCount} succeeded, ${failCount} failed`
    );
    console.log(`[epaper-scraper] Fetched ${allArticles.length} total articles`);

    // Filter to last 24 hours
    const recentArticles = allArticles.filter((a) => isWithin24Hours(a.pubDate));
    console.log(
        `[epaper-scraper] ${recentArticles.length} articles from last 24 hours`
    );

    // Deduplicate
    const unique = deduplicateArticles(recentArticles);
    console.log(`[epaper-scraper] ${unique.length} unique articles after dedup`);

    // Sort by priority (editorial/explained first), then by source reliability
    const prioritySections = ['Editorial', 'Lead Opinion', 'Explained', 'Bills & Acts', 'Press Releases', 'SC Judgments', 'Parliament', 'Environment'];
    unique.sort((a, b) => {
        // Priority sections first
        const aPriority = prioritySections.includes(a.section) ? 0 : 1;
        const bPriority = prioritySections.includes(b.section) ? 0 : 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        // Then by feed priority
        return a.priority - b.priority;
    });

    // ── Source diversity: ensure non-newspaper sources get represented ──
    // Split into "core newspapers" and "diverse sources"
    const coreNewspapers = ['The Hindu', 'Indian Express', 'Frontline', 'Mint'];
    const newspaperArticles = unique.filter((a) => coreNewspapers.includes(a.sourceShort));
    const diverseArticles = unique.filter((a) => !coreNewspapers.includes(a.sourceShort));

    console.log(`[epaper-scraper] Source diversity: ${newspaperArticles.length} newspaper, ${diverseArticles.length} diverse`);

    // Log which diverse sources have articles
    const diverseSources = new Map<string, number>();
    for (const a of diverseArticles) {
        diverseSources.set(a.sourceShort, (diverseSources.get(a.sourceShort) || 0) + 1);
    }
    for (const entry of Array.from(diverseSources.entries())) {
        console.log(`[epaper-scraper]   📡 ${entry[0]}: ${entry[1]} articles`);
    }

    // Take up to 5 diverse source articles + fill rest with newspaper articles
    const TOTAL_LIMIT = 25;
    const DIVERSE_QUOTA = Math.min(5, diverseArticles.length);
    const selected: RawEpaperArticle[] = [
        ...diverseArticles.slice(0, DIVERSE_QUOTA),
        ...newspaperArticles.slice(0, TOTAL_LIMIT - DIVERSE_QUOTA),
    ];

    console.log(`[epaper-scraper] Selected ${selected.length} articles for AI (${DIVERSE_QUOTA} diverse + ${selected.length - DIVERSE_QUOTA} newspaper)`);
    return selected;
}
