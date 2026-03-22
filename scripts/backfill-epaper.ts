/**
 * ePaper Archive Backfill Script
 * 
 * Generates historical ePaper JSON files using:
 *   1. Wikipedia "YYYY in India" events (primary backbone)
 *   2. GDELT API headlines (supplementary depth)
 *   3. Frontline CA data (cross-reference)
 *   4. Gemini AI (synthesis into ePaper format)
 *
 * Usage:
 *   npx tsx scripts/backfill-epaper.ts --phase 1
 *   npx tsx scripts/backfill-epaper.ts --date 2025-10-15
 *   npx tsx scripts/backfill-epaper.ts --month 2025-10
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Config ──────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash';
const EPAPER_DIR = path.join(__dirname, '..', 'src', 'data', 'epaper');
const FRONTLINE_PATH = path.join(__dirname, '..', 'mock-engine', 'data', 'frontline_current_affairs.json');

const PHASES: Record<string, { start: string; end: string; label: string }> = {
  '1': { start: '2026-01-01', end: '2026-03-21', label: 'Jan-Mar 2026 (Most Recent)' },
  '2': { start: '2025-10-01', end: '2025-12-31', label: 'Oct-Dec 2025' },
  '3': { start: '2025-07-01', end: '2025-09-30', label: 'Jul-Sep 2025' },
  '4': { start: '2025-01-01', end: '2025-06-30', label: 'Jan-Jun 2025' },
  '5': { start: '2024-09-01', end: '2024-12-31', label: 'Sep-Dec 2024' },
};

// ── Helpers ──────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const d = new Date(start);
  const e = new Date(end);
  while (d <= e) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function epaperExists(dateStr: string): boolean {
  return fs.existsSync(path.join(EPAPER_DIR, `epaper-${dateStr}.json`));
}

// ── Source 1: Wikipedia "YYYY in India" ─────────────────────────────

interface WikiEvent {
  date: string;     // e.g., "2025-10-01"
  rawText: string;  // wiki markup text
}

async function fetchWikipediaEvents(year: number): Promise<WikiEvent[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${year}_in_India&format=json&prop=wikitext`;
  console.log(`  [wiki] Fetching ${year} in India...`);

  const res = await fetch(url, {
    headers: { 'User-Agent': 'CurrentIASPrep/1.0 (UPSC Study App)' }
  });
  const data = await res.json();
  const text = data?.parse?.wikitext?.['*'] || '';

  const events: WikiEvent[] = [];
  const lines = text.split('\n');

  let inEvents = false;
  let currentMonth = '';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  for (const line of lines) {
    if (line.includes('== Events ==') || line.includes('==Events==')) {
      inEvents = true;
      continue;
    }
    if (inEvents && line.startsWith('== ') && !line.includes('Events')) break;

    if (inEvents && line.startsWith('===')) {
      const monthText = line.replace(/=/g, '').trim();
      const found = monthNames.find(m => monthText.includes(m));
      if (found) currentMonth = found;
      continue;
    }

    if (inEvents && line.startsWith('*') && !line.startsWith('**') && currentMonth) {
      // Extract day from line like "* 15 October – ..."
      const dayMatch = line.match(/^\*\s*(\d{1,2})\s+\w+/);
      const dashMatch = line.match(/^\*\s*(\d{1,2})\s+(\w+)\s*[–—-]\s*(.*)/);

      if (dayMatch || dashMatch) {
        const day = dayMatch?.[1] || dashMatch?.[1] || '1';
        const monthIdx = monthNames.indexOf(currentMonth) + 1;
        const dateStr = `${year}-${String(monthIdx).padStart(2, '0')}-${day.padStart(2, '0')}`;

        // Clean wiki markup
        let cleanText = line
          .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2')  // [[link|text]] -> text
          .replace(/\{\{[^}]*\}\}/g, '')  // remove templates
          .replace(/<ref[^>]*>.*?<\/ref>/g, '')  // remove refs
          .replace(/<ref[^>]*\/>/g, '')
          .replace(/^\*\s*\d{1,2}\s+\w+\s*[–—-]\s*/, '')  // remove date prefix
          .trim();

        if (cleanText.length > 10) {
          events.push({ date: dateStr, rawText: cleanText });
        }
      }
    }

    // Handle sub-items (** lines) — attach to previous date
    if (inEvents && line.startsWith('**') && !line.startsWith('***') && events.length > 0) {
      let cleanText = line.replace(/^\*+\s*/, '')
        .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2')
        .replace(/\{\{[^}]*\}\}/g, '')
        .replace(/<ref[^>]*>.*?<\/ref>/g, '')
        .replace(/<ref[^>]*\/>/g, '')
        .trim();
      if (cleanText.length > 10) {
        events.push({ date: events[events.length - 1].date, rawText: cleanText });
      }
    }
  }

  console.log(`  [wiki] Found ${events.length} events for ${year}`);
  return events;
}

// ── Source 2: GDELT API ─────────────────────────────────────────────

interface GdeltArticle {
  title: string;
  url: string;
  source: string;
  date: string;
}

async function fetchGdeltForDate(dateStr: string): Promise<GdeltArticle[]> {
  const d = dateStr.replace(/-/g, '');
  const nextDay = new Date(dateStr + 'T00:00:00');
  nextDay.setDate(nextDay.getDate() + 1);
  const nd = nextDay.toISOString().split('T')[0].replace(/-/g, '');

  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=india+sourcelang%3Aenglish&mode=artlist&maxrecords=30&format=json&startdatetime=${d}000000&enddatetime=${nd}235959`;

  try {
    await sleep(6000); // GDELT rate limit: 1 req per 5 sec
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CurrentIASPrep/1.0' }
    });
    const text = await res.text();
    if (text.includes('Please limit')) {
      console.log(`  [gdelt] Rate limited for ${dateStr}, skipping`);
      return [];
    }
    const data = JSON.parse(text);
    return (data.articles || []).map((a: any) => ({
      title: a.title || '',
      url: a.url || '',
      source: a.domain || '',
      date: dateStr,
    }));
  } catch (e) {
    console.log(`  [gdelt] Error for ${dateStr}: ${(e as Error).message}`);
    return [];
  }
}

// ── Source 3: Frontline CA Data ──────────────────────────────────────

interface FrontlineItem {
  date: string;
  text: string;
  keywords: string;
  category: string;
}

function loadFrontlineData(): FrontlineItem[] {
  if (!fs.existsSync(FRONTLINE_PATH)) return [];
  const raw = JSON.parse(fs.readFileSync(FRONTLINE_PATH, 'utf-8'));
  const items: FrontlineItem[] = [];
  for (const [category, entries] of Object.entries(raw)) {
    for (const entry of entries as any[]) {
      items.push({
        date: entry.date || '',
        text: entry.text || '',
        keywords: entry.keywords || '',
        category,
      });
    }
  }
  return items;
}

// ── Gemini AI Processing ────────────────────────────────────────────

async function generateEpaperWithGemini(
  dateStr: string,
  wikiEvents: WikiEvent[],
  gdeltArticles: GdeltArticle[],
  frontlineItems: FrontlineItem[]
): Promise<any> {
  const formattedDate = formatDate(dateStr);

  const wikiContext = wikiEvents.length > 0
    ? `WIKIPEDIA EVENTS FOR THIS DATE:\n${wikiEvents.map(e => `• ${e.rawText}`).join('\n')}`
    : 'No specific Wikipedia events found for this date.';

  const gdeltContext = gdeltArticles.length > 0
    ? `\nGDELT HEADLINES:\n${gdeltArticles.slice(0, 20).map(a => `• ${a.title} (${a.source})`).join('\n')}`
    : '';

  const frontlineContext = frontlineItems.length > 0
    ? `\nFRONTLINE CURRENT AFFAIRS:\n${frontlineItems.map(f => `• [${f.category}] ${f.text}`).join('\n')}`
    : '';

  const prompt = `You are generating a historical ePaper for UPSC aspirants for the date: ${formattedDate} (${dateStr}).

Based on the following source data AND your own knowledge of events on this date, generate a comprehensive daily current affairs ePaper.

${wikiContext}
${gdeltContext}
${frontlineContext}

IMPORTANT: You should also ADD other major India/UPSC-relevant events from this date that may not appear in the sources above, based on your training knowledge. Cover government policies, court decisions, international affairs, science/tech developments, environmental news, economic indicators, etc.

Generate a JSON object with this EXACT structure:
{
  "date": "${dateStr}",
  "dateFormatted": "${formattedDate}",
  "lastUpdated": "${new Date().toISOString()}",
  "edition": 1,
  "articles": [
    // 15-20 articles, each with:
    {
      "id": "unique-slug-id",
      "headline": "Clear, descriptive headline",
      "explainer": "• Bullet-pointed explainer (3-5 bullets starting with •)",
      "category": "one of: polity, economy, ir, security, environment, science, history, society, geography",
      "gsPaper": "GS1 or GS2 or GS3",
      "gsSubTopics": ["relevant UPSC syllabus sub-topics"],
      "date": "${dateStr}",
      "source": "Source newspaper/agency",
      "sourceUrl": "",
      "importance": "high or medium or low",
      "tags": ["relevant", "keywords"],
      "keyTerms": ["Key UPSC Terms"],
      "prelims": true or false,
      "prelimsPoints": ["Prelims-relevant factual points"],
      "mains": true or false,
      "mainsPoints": ["Mains answer writing points"],
      "imageDescription": "Brief description of a relevant image",
      "section": "Lead Opinion or National or International or Economy or Environment or Science or Editorial",
      "trivia": "An interesting fact related to this topic",
      "prelimsSyllabus": {"subject": "...", "area": "...", "topic": "..."},
      "prelimsPotential": 3
    }
  ],
  "highlights": [
    // Top 5 one-line highlights of the day
    "Highlight text 1",
    "Highlight text 2"
  ],
  "prelimsMocks": [
    // 5 UPSC Prelims-style MCQs from the day's news
    {
      "question": "Consider the following statements...",
      "options": ["(a) ...", "(b) ...", "(c) ...", "(d) ..."],
      "answer": "(b) ...",
      "explanation": "Detailed explanation with facts"
    }
  ],
  "mainsMocks": [
    // 3 Mains-style questions
    {
      "question": "Discuss...",
      "syllabusMatch": "GS2: ...",
      "approach": "Brief answer approach"
    }
  ],
  "quickBytes": [
    // 10 quick facts/trivia for UPSC
    {
      "text": "Quick fact about 80 chars",
      "category": "polity/economy/environment/science/history/geography/art_culture/ir",
      "gsPaper": "GS1/GS2/GS3",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Make the FIRST article the "Lead" story (most important UPSC-relevant news of the day).
Ensure good distribution across GS papers.
The quick bytes should mix current affairs with static GK that's UPSC relevant.
All content must be factually accurate for the given date.

Return ONLY the JSON object, no markdown formatting.`;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 65536,
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = await res.json();

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`);
  }

  const finishReason = data.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    console.log(`  ⚠ Finish reason: ${finishReason}`);
  }

  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    const raw = JSON.stringify(data).slice(0, 500);
    throw new Error(`Empty response from Gemini. Raw: ${raw}`);
  }

  console.log(`  [gemini] Response length: ${responseText.length} chars`);

  // Parse the JSON response
  const cleaned = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const epaper = JSON.parse(cleaned);

  // Add articlesByGS grouping
  epaper.articlesByGS = { GS1: [], GS2: [], GS3: [], GS4: [] };
  for (const article of epaper.articles || []) {
    const gs = article.gsPaper || 'GS2';
    if (epaper.articlesByGS[gs]) {
      epaper.articlesByGS[gs].push(article);
    }
  }

  // Add source count
  const sources = new Set((epaper.articles || []).map((a: any) => a.source));
  epaper.sources = Array.from(sources);
  epaper.totalScraped = epaper.articles?.length || 0;
  epaper.totalProcessed = epaper.articles?.length || 0;

  return epaper;
}

// ── Main Pipeline ───────────────────────────────────────────────────

async function processDate(
  dateStr: string,
  wikiEventsMap: Map<string, WikiEvent[]>,
  frontlineData: FrontlineItem[],
  skipGdelt = false
) {
  console.log(`\n📰 Processing ${dateStr}...`);

  if (epaperExists(dateStr)) {
    console.log(`  ⏭ Already exists, skipping`);
    return true;
  }

  // Gather data from all sources
  const wikiEvents = wikiEventsMap.get(dateStr) || [];
  console.log(`  [wiki] ${wikiEvents.length} events`);

  let gdeltArticles: GdeltArticle[] = [];
  if (!skipGdelt) {
    gdeltArticles = await fetchGdeltForDate(dateStr);
    console.log(`  [gdelt] ${gdeltArticles.length} articles`);
  }

  const dateFrontline = frontlineData.filter(f => f.date === dateStr);
  console.log(`  [frontline] ${dateFrontline.length} items`);

  // Generate ePaper via Gemini
  try {
    const epaper = await generateEpaperWithGemini(dateStr, wikiEvents, gdeltArticles, dateFrontline);

    // Save
    const outPath = path.join(EPAPER_DIR, `epaper-${dateStr}.json`);
    fs.writeFileSync(outPath, JSON.stringify(epaper, null, 2));
    console.log(`  ✅ Saved: ${outPath} (${epaper.articles?.length || 0} articles)`);
    return true;
  } catch (e) {
    console.error(`  ❌ Error: ${(e as Error).message}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  function getArgValue(flag: string): string | undefined {
    const eqMatch = args.find(a => a.startsWith(`${flag}=`));
    if (eqMatch) return eqMatch.split('=')[1];
    const idx = args.indexOf(flag);
    if (idx !== -1 && idx + 1 < args.length && !args[idx + 1].startsWith('--')) {
      return args[idx + 1];
    }
    return undefined;
  }

  const phaseArg = getArgValue('--phase');
  const dateArg = getArgValue('--date');
  const monthArg = getArgValue('--month');
  const skipGdelt = args.includes('--no-gdelt');

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not set. Export it first:');
    console.error('   export GEMINI_API_KEY=your-key-here');
    process.exit(1);
  }

  // Determine date range
  let dates: string[] = [];
  let label = '';

  if (dateArg) {
    dates = [dateArg];
    label = `Single date: ${dateArg}`;
  } else if (monthArg) {
    const [y, m] = monthArg.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    dates = dateRange(`${monthArg}-01`, `${monthArg}-${lastDay}`);
    label = `Month: ${monthArg}`;
  } else if (phaseArg && PHASES[phaseArg]) {
    const phase = PHASES[phaseArg];
    dates = dateRange(phase.start, phase.end);
    label = `Phase ${phaseArg}: ${phase.label}`;
  } else {
    console.log('Usage:');
    console.log('  npx tsx scripts/backfill-epaper.ts --phase 1');
    console.log('  npx tsx scripts/backfill-epaper.ts --date 2025-10-15');
    console.log('  npx tsx scripts/backfill-epaper.ts --month 2025-10');
    console.log('  Add --no-gdelt to skip GDELT (faster, uses Wiki + Gemini only)');
    console.log('\nPhases:');
    for (const [k, v] of Object.entries(PHASES)) {
      console.log(`  ${k}: ${v.label} (${v.start} to ${v.end})`);
    }
    return;
  }

  // Filter out dates that already have ePapers
  const existing = dates.filter(d => epaperExists(d)).length;
  const toProcess = dates.filter(d => !epaperExists(d));

  console.log(`\n🚀 ePaper Archive Backfill`);
  console.log(`   ${label}`);
  console.log(`   Total dates: ${dates.length}`);
  console.log(`   Already exist: ${existing}`);
  console.log(`   To generate: ${toProcess.length}`);
  console.log(`   GDELT: ${skipGdelt ? 'DISABLED' : 'enabled'}`);

  if (toProcess.length === 0) {
    console.log('\n✅ All dates already have ePapers!');
    return;
  }

  // Pre-fetch Wikipedia data for all needed years
  const years = new Set(toProcess.map(d => parseInt(d.split('-')[0])));
  const wikiEventsMap = new Map<string, WikiEvent[]>();

  const yearsArr = Array.from(years);
  console.log(`\n📚 Fetching Wikipedia data for years: ${yearsArr.join(', ')}`);
  for (const year of yearsArr) {
    const events = await fetchWikipediaEvents(year);
    for (const event of events) {
      if (!wikiEventsMap.has(event.date)) {
        wikiEventsMap.set(event.date, []);
      }
      wikiEventsMap.get(event.date)!.push(event);
    }
    await sleep(1000);
  }

  // Load Frontline data
  console.log('📚 Loading Frontline CA data...');
  const frontlineData = loadFrontlineData();
  console.log(`   ${frontlineData.length} items loaded`);

  // Process each date
  let success = 0, failed = 0;
  const batchSize = 10;

  for (let i = 0; i < toProcess.length; i++) {
    const dateStr = toProcess[i];

    const ok = await processDate(dateStr, wikiEventsMap, frontlineData, skipGdelt);
    if (ok) success++;
    else failed++;

    // Rate limit: pause between batches
    if ((i + 1) % batchSize === 0 && i < toProcess.length - 1) {
      console.log(`\n⏸ Batch ${Math.floor(i / batchSize) + 1} complete. Cooling down 30s...`);
      console.log(`   Progress: ${i + 1}/${toProcess.length} (${success} ok, ${failed} failed)`);
      await sleep(30000);
    } else {
      // Small gap between individual calls
      await sleep(5000);
    }
  }

  // Update index
  updateEpaperIndex();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Backfill complete!`);
  console.log(`   Generated: ${success}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total ePapers in archive: ${fs.readdirSync(EPAPER_DIR).filter(f => f.startsWith('epaper-') && f !== 'epaper-index.json').length}`);
}

function updateEpaperIndex() {
  const files = fs.readdirSync(EPAPER_DIR)
    .filter(f => f.startsWith('epaper-') && f.endsWith('.json') && f !== 'epaper-index.json')
    .sort();

  const index = files.map(f => {
    const dateStr = f.replace('epaper-', '').replace('.json', '');
    try {
      const data = JSON.parse(fs.readFileSync(path.join(EPAPER_DIR, f), 'utf-8'));
      return {
        date: dateStr,
        dateFormatted: data.dateFormatted || formatDate(dateStr),
        articles: data.articles?.length || 0,
        highlights: data.highlights?.length || 0,
      };
    } catch {
      return { date: dateStr, dateFormatted: formatDate(dateStr), articles: 0, highlights: 0 };
    }
  });

  fs.writeFileSync(
    path.join(EPAPER_DIR, 'epaper-index.json'),
    JSON.stringify({ total: index.length, papers: index }, null, 2)
  );
  console.log(`📋 Index updated: ${index.length} ePapers`);
}

main().catch(console.error);
