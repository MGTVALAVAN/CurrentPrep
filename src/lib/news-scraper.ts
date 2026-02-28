/**
 * News Scraper — fetches and parses RSS feeds from The Hindu,
 * The Indian Express, and News on AIR.
 *
 * Uses native fetch (Node 18+) and a lightweight XML parser to
 * extract headlines, descriptions, links and publication dates.
 */

import { NEWS_SOURCES, type NewsSource } from './news-sources';

export interface RawArticle {
    title: string;
    description: string;
    link: string;
    pubDate: string;
    source: string;
    section: string;
}

// ---------------------------------------------------------------------------
// Minimal XML -> items extractor  (no external dependency)
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

function parseRSSItems(xml: string): Array<{ title: string; description: string; link: string; pubDate: string }> {
    const items: Array<{ title: string; description: string; link: string; pubDate: string }> = [];

    // Handle both <item> (RSS 2.0) and <entry> (Atom)
    const itemRegex = /<item[\s>]([\s\S]*?)<\/item>|<entry[\s>]([\s\S]*?)<\/entry>/gi;
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

        // Truncate description to first 500 chars (we'll let LLM summarize)
        if (description.length > 500) {
            description = description.slice(0, 500) + '…';
        }

        const link =
            getTagContent(block, 'link') ||
            // Atom-style <link href="..." />
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
    source: NewsSource,
    section: string,
    timeoutMs = 15000
): Promise<RawArticle[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'CurrentPrep-NewsAgent/1.0 (UPSC Current Affairs Aggregator)',
                Accept: 'application/rss+xml, application/xml, text/xml, */*',
            },
            next: { revalidate: 0 },
        });

        if (!res.ok) {
            console.warn(`[scraper] Feed returned ${res.status}: ${url}`);
            return [];
        }

        const xml = await res.text();
        const items = parseRSSItems(xml);

        return items.map((item) => ({
            title: item.title,
            description: item.description,
            link: item.link,
            pubDate: item.pubDate,
            source: source.shortName,
            section,
        }));
    } catch (err: any) {
        if (err.name === 'AbortError') {
            console.warn(`[scraper] Timeout fetching ${url}`);
        } else {
            console.warn(`[scraper] Error fetching ${url}:`, err.message);
        }
        return [];
    } finally {
        clearTimeout(timer);
    }
}

// ---------------------------------------------------------------------------
// Main: scrape all sources
// ---------------------------------------------------------------------------

function isToday(dateStr: string): boolean {
    if (!dateStr) return true; // If no date, include the article (might be current)
    try {
        const d = new Date(dateStr);
        const now = new Date();
        // Allow articles from last 24 hours
        return now.getTime() - d.getTime() < 24 * 60 * 60 * 1000;
    } catch {
        return true;
    }
}

function deduplicateArticles(articles: RawArticle[]): RawArticle[] {
    const seen = new Set<string>();
    return articles.filter((a) => {
        // Normalize title for dedup
        const key = a.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 60);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Scrapes all configured RSS feeds and returns deduplicated articles
 * from the last 24 hours, sorted by relevance (editorials/explained first).
 */
export async function scrapeAllSources(): Promise<RawArticle[]> {
    console.log('[scraper] Starting scrape of all news sources…');

    const feedPromises: Promise<RawArticle[]>[] = [];

    for (const source of NEWS_SOURCES) {
        for (const feed of source.rssFeeds) {
            feedPromises.push(fetchFeed(feed.url, source, feed.section));
        }
    }

    const results = await Promise.allSettled(feedPromises);
    let allArticles: RawArticle[] = [];

    for (const result of results) {
        if (result.status === 'fulfilled') {
            allArticles = allArticles.concat(result.value);
        }
    }

    console.log(`[scraper] Fetched ${allArticles.length} total articles`);

    // Filter to today's articles
    const todayArticles = allArticles.filter((a) => isToday(a.pubDate));
    console.log(`[scraper] ${todayArticles.length} articles from last 24 hours`);

    // Deduplicate
    const unique = deduplicateArticles(todayArticles);
    console.log(`[scraper] ${unique.length} unique articles after dedup`);

    // Prioritize editorials and explained articles
    const prioritySections = ['Editorial', 'Explained', 'Opinion'];
    unique.sort((a, b) => {
        const aPriority = prioritySections.includes(a.section) ? 0 : 1;
        const bPriority = prioritySections.includes(b.section) ? 0 : 1;
        return aPriority - bPriority;
    });

    // Limit to top 30 articles to send to AI
    return unique.slice(0, 30);
}
