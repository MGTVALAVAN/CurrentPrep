/**
 * Generate front page extras: Quote of the Day, On This Day, Data Snapshot
 * Injects them into the existing ePaper JSON.
 *
 * Usage: npx tsx generate-front-page-extras.ts [date]
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

const dateArg = process.argv[2] || new Date().toISOString().split('T')[0];
const DATA_FILE = path.join(process.cwd(), 'src/data/epaper', `epaper-${dateArg}.json`);

async function callGemini(prompt: string): Promise<string> {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
                    }),
                }
            );
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text) return text;
        } catch (e: any) {
            console.log(`  Attempt ${attempt} failed: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error('Gemini call failed after 3 attempts');
}

async function main() {
    console.log(`\n📰 Generating front page extras for ${dateArg}...\n`);

    const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
    const leadArticle = data.articles[0];

    // ── 1. Quote of the Day ─────────────────────────────────────────────
    console.log('1️⃣ Generating Quote of the Day...');
    const quotePrompt = `Generate a single inspirational quote relevant to UPSC Civil Services aspirants for today (${dateArg}).

The quote should be from one of these categories (pick one):
- Indian constitutional framers (Ambedkar, Nehru, Patel, Rajendra Prasad)
- Indian freedom fighters (Gandhi, Bhagat Singh, Tilak, Bose, Azad)
- Governance & public service thinkers (Kautilya, Swami Vivekananda, APJ Abdul Kalam)
- International thinkers on democracy/justice (Amartya Sen, Martha Nussbaum, John Rawls)

Requirements:
- Must be a REAL, verifiable quote (not fabricated)
- Should be thought-provoking and relevant to governance, ethics, or nation-building
- Keep it concise (under 25 words)
- Do NOT pick an overused/cliché quote

Return ONLY a valid JSON object (no markdown, no code fences):
{"text": "the quote text here", "author": "Author Name"}`;

    let quoteOfTheDay: { text: string; author: string } | undefined;
    try {
        const raw = await callGemini(quotePrompt);
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        quoteOfTheDay = JSON.parse(cleaned);
        console.log(`  ✅ "${quoteOfTheDay!.text}" — ${quoteOfTheDay!.author}`);
    } catch (e: any) {
        console.log(`  ❌ Failed: ${e.message}`);
    }

    // ── 2. On This Day ──────────────────────────────────────────────────
    console.log('\n2️⃣ Generating On This Day...');
    // Parse date
    const [year, month, day] = dateArg.split('-').map(Number);
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dateLabel = `${monthNames[month]} ${day}`;

    const onThisDayPrompt = `What is the single most notable historical event that happened on ${dateLabel} (any year) that is most relevant to UPSC Civil Services Exam preparation?

The event MUST have actually occurred on ${dateLabel}. Do NOT pick events from other dates.

Priority topics (in order):
1. Indian independence movement / freedom struggle
2. Indian constitutional history
3. Important Indian/world treaties, acts, or declarations
4. Major scientific/space achievements by India
5. International events with significance for Indian history

Requirements:
- Must be a REAL, verified historical fact that actually happened on ${dateLabel}
- Should be highly relevant to UPSC Prelims/Mains
- Pick ONE event that is most impactful and examworthy
- Do NOT return the example below — pick an event specific to ${dateLabel}

Return ONLY a valid JSON object (no markdown, no code fences):
{"year": 1950, "event": "Description of the historical event that happened on this specific date."}`;

    let onThisDay: { year: number; event: string } | undefined;
    try {
        const raw = await callGemini(onThisDayPrompt);
        let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        // Normalize: replace newlines, smart quotes, and excessive whitespace
        cleaned = cleaned.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
        cleaned = cleaned.replace(/\n/g, ' ').replace(/\s+/g, ' ');

        let parsed: any = null;
        try {
            // Try direct parse first
            const jsonMatch = cleaned.match(/\{[^}]*"year"\s*:\s*\d+[^}]*\}/);
            if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
            else parsed = JSON.parse(cleaned);
        } catch {
            // Fallback: manually extract year and event via regex
            const yearMatch = cleaned.match(/"year"\s*:\s*(\d+)/);
            const eventMatch = cleaned.match(/"event"\s*:\s*"([^"]+)/);
            if (yearMatch && eventMatch) {
                parsed = { year: parseInt(yearMatch[1]), event: eventMatch[1] };
                console.log('  ℹ️ Used regex fallback for JSON extraction');
            } else {
                console.log(`  ⚠️ Could not parse AI response: ${cleaned.substring(0, 200)}`);
            }
        }

        if (parsed && parsed.event && !parsed.event.includes('Description of the historical event') && parsed.year > 0) {
            onThisDay = parsed;
            console.log(`  ✅ ${onThisDay!.year}: ${onThisDay!.event}`);
        } else if (parsed) {
            console.log('  ⚠️ AI returned invalid/example text — discarding');
        }
    } catch (e: any) {
        console.log(`  ❌ Failed: ${e.message}`);
    }

    // ── 3. Data Snapshot ────────────────────────────────────────────────
    console.log('\n3️⃣ Generating Data Snapshot...');

    let dataSnapshot: { label: string; value: string; context: string } | undefined;

    // Use gemini-2.0-flash (non-thinking) for short structured output
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const dsPrompt = `Based on the news topic "${leadArticle.headline}", provide ONE striking numerical statistic from credible sources like the Economic Survey, RBI Annual Report, Union Budget, Census, NITI Aayog reports, World Bank data, or reputable newspapers (The Hindu, Indian Express, Times of India).

REQUIREMENTS:
- The "value" MUST be a real NUMBER with unit (e.g., "164", "$642 Bn", "28.7%", "1.4 Bn", "₹45.03 Lakh Cr")
- Do NOT use syllabus codes like GS1, GS2 etc.
- The "label" should name the metric (e.g., "WTO MEMBER NATIONS", "GDP GROWTH RATE", "FOREX RESERVES")
- The "context" should explain why this number matters (max 25 words)
- Must be a REAL, verifiable statistic

Return ONLY valid JSON (no markdown, no code fences):
{"label": "metric name in CAPS max 5 words", "value": "number with unit", "context": "brief explanation max 25 words"}`;
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: dsPrompt }] }],
                        generationConfig: { temperature: 0.3, maxOutputTokens: 200 },
                    }),
                }
            );
            const result = await response.json();
            const raw = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            dataSnapshot = JSON.parse(cleaned);
            // Validate: value must contain a digit, reject syllabus codes
            if (!dataSnapshot!.value || !/\d/.test(dataSnapshot!.value) || /^GS\d/.test(dataSnapshot!.value)) {
                console.log(`  ⚠️ Invalid value "${dataSnapshot!.value}", retrying...`);
                dataSnapshot = undefined;
                continue;
            }
            console.log(`  ✅ ${dataSnapshot!.label}: ${dataSnapshot!.value} — ${dataSnapshot!.context}`);
            break;
        } catch (e: any) {
            console.log(`  Attempt ${attempt} failed: ${e.message}`);
            if (attempt < 3) await new Promise(r => setTimeout(r, 2000));
        }
    }

    // Fallback: use meaningful UPSC-relevant stats, not syllabus codes
    if (!dataSnapshot) {
        const STAT_FALLBACKS = [
            { label: 'INDIA GDP (2024-25)', value: '₹330.68 Lakh Cr', context: 'India is the 5th largest economy globally by nominal GDP and 3rd by PPP.' },
            { label: 'FOREX RESERVES', value: '$640+ Bn', context: 'India holds the 4th largest forex reserves globally, providing import cover.' },
            { label: 'INDIA POPULATION', value: '1.44 Bn', context: 'India became the most populous country in 2023, overtaking China.' },
            { label: 'FISCAL DEFICIT TARGET', value: '4.4%', context: 'Union Budget 2025-26 targets fiscal deficit at 4.4% of GDP.' },
            { label: 'LITERACY RATE', value: '77.7%', context: 'India\'s literacy rate has improved significantly from 12% at independence.' },
        ];
        const dayIdx = parseInt(dateArg.split('-')[2]) || 1;
        dataSnapshot = STAT_FALLBACKS[(dayIdx - 1) % STAT_FALLBACKS.length];
        console.log(`  ✅ Fallback: ${dataSnapshot.label}: ${dataSnapshot.value}`);
    }

    // ── Save ─────────────────────────────────────────────────────────────
    if (quoteOfTheDay) data.quoteOfTheDay = quoteOfTheDay;
    if (onThisDay) data.onThisDay = onThisDay;
    if (dataSnapshot) data.dataSnapshot = dataSnapshot;

    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n✅ Saved front page extras to ${DATA_FILE}`);
}

main().catch(console.error);
