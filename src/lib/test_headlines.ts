import { EPAPER_SOURCES } from './epaper-sources';

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

function isWithin24Hours(dateStr: string): boolean {
    if (!dateStr) return false;
    try {
        const d = new Date(dateStr);
        const now = new Date();
        return now.getTime() - d.getTime() < 24 * 60 * 60 * 1000 && now.getTime() - d.getTime() > - (24 * 60 * 60 * 1000);
    } catch {
        return false;
    }
}

async function fetchFeed(url: string, sourceName: string, section: string) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Current IAS Prep-ePaper/1.0; +https://currentprep.in)',
                Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
                'Accept-Encoding': 'gzip, deflate',
            },
        });

        if (!res.ok) {
            return [];
        }

        const xml = await res.text();
        const items = parseRSSItems(xml);

        return items.map(item => ({
            ...item,
            source: sourceName,
            section
        })).filter(item => isWithin24Hours(item.pubDate));
    } catch (err: any) {
        return [];
    } finally {
        clearTimeout(timer);
    }
}

async function main() {
    console.log("Fetching headlines from all sources...");
    const allPromises = [];

    for (const source of EPAPER_SOURCES) {
        for (const feed of source.rssFeeds) {
            allPromises.push(fetchFeed(feed.url, source.name, feed.section));
        }
    }

    const results = await Promise.allSettled(allPromises);
    let allItems: any[] = [];

    for (const res of results) {
        if (res.status === 'fulfilled') {
            allItems = allItems.concat(res.value);
        }
    }

    const seen = new Set<string>();
    const deduplicated = allItems.filter(item => {
        const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const grouped: Record<string, any[]> = {};
    for (const item of deduplicated) {
        if (!grouped[item.source]) {
            grouped[item.source] = [];
        }
        grouped[item.source].push(item);
    }

    let output = '';
    for (const [source, items] of Object.entries(grouped)) {
        output += `\n### ${source} (${items.length} items)\n`;
        for (const item of items) {
            output += `- [${item.section}] ${item.title}\n`;
        }
    }

    const fs = require('fs');
    fs.writeFileSync('/tmp/headlines.txt', output);
    console.log(`Saved ${deduplicated.length} total items to /tmp/headlines.txt`);
}

main().catch(console.error);
