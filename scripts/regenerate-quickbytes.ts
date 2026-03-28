/**
 * Regenerate Quick Bytes with the tightened diversity prompt,
 * inject into today's ePaper JSON, then send email.
 */
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
];

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

interface QuickByte {
    text: string;
    category: string;
    gsPaper: string;
    tags: string[];
}

async function regenerateQuickBytes(): Promise<void> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { console.error('No GEMINI_API_KEY'); process.exit(1); }

    const today = new Date().toISOString().split('T')[0];
    const epaperPath = path.join(process.cwd(), 'src/data/epaper', `epaper-${today}.json`);

    if (!fs.existsSync(epaperPath)) {
        console.error(`No ePaper file found at ${epaperPath}`);
        process.exit(1);
    }

    const epaper = JSON.parse(fs.readFileSync(epaperPath, 'utf-8'));
    console.log(`Loaded ePaper for ${today} with ${epaper.articles?.length || 0} articles`);

    // Gather headlines for context
    const headlines = (epaper.articles || [])
        .slice(0, 30)
        .map((a: any) => `${a.headline}: ${(a.tags || []).join(', ')}`);

    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const headlineBlock = headlines.join('\n');
    const prompt = [
        `You are a UPSC Static GK expert. Given today's date (${dateStr}) and the news headlines below, generate EXACTLY 10 crisp one-liner facts for the "Quick Bytes" section of a UPSC ePaper.`,
        '',
        'MANDATORY DISTRIBUTION (follow strictly):',
        '- 2 items: ART & CULTURE (GI tags, UNESCO sites, dances, textile, literature, temples, festivals)',
        `- 2 items: HISTORY / THIS DAY IN HISTORY (at least 1 must be an event on ${dateStr})`,
        '- 1 item: GEOGRAPHY (national parks, rivers, mountains, biosphere reserves)',
        '- 1 item: SCIENCE & TECHNOLOGY (ISRO, discoveries, Indian milestones)',
        '- 1 item: ENVIRONMENT (Ramsar sites, wildlife, endangered species)',
        '- 1 item: POLITY (constitutional facts, landmark judgments, statutory bodies)',
        '- 1 item: ECONOMY (schemes, indices, institutions)',
        '- 1 item: INTERNATIONAL (organizations, treaties, conventions)',
        '',
        'STRICT RULES:',
        '- Each Quick Byte must be 1-2 lines MAX (under 150 characters)',
        '- Must be a testable, factual statement — NOT opinion or analysis',
        '- Include specific names, dates, locations, numbers',
        '- NO TWO facts may cover the same topic or entity. Each must be distinct.',
        '- Prefer surprising/less-known facts over obvious ones',
        '- News-linked facts are preferred when relevant, but static GK is fine',
        '',
        'HEADLINES FOR CONTEXT:',
        headlineBlock,
        '',
        'Return ONLY a JSON array where each element has:',
        '- "text": The one-liner fact (concise, factual, testable)',
        '- "category": One of: art_culture, history, anniversary, geography, science, environment, polity, economy, international, general',
        '- "gsPaper": Primary GS paper (GS1, GS2, GS3, GS4)',
        '- "tags": Array of 2-3 keyword tags',
    ].join('\n');

    const requestBody = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, topP: 0.9, maxOutputTokens: 4096, responseMimeType: 'application/json' },
    };

    let quickBytes: QuickByte[] = [];

    for (const model of GEMINI_MODELS) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                console.log(`Generating Quick Bytes with ${model} (attempt ${attempt})...`);
                const qbController = new AbortController();
                const qbTimer = setTimeout(() => qbController.abort(), 60_000);
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody), signal: qbController.signal }
                );
                clearTimeout(qbTimer);
                if (!response.ok) {
                    if (response.status === 429) { await sleep(5000); continue; }
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();
                const candidate = data?.candidates?.[0];
                const finishReason = candidate?.finishReason;
                if (finishReason === 'MAX_TOKENS' || finishReason === 'SAFETY') {
                    console.warn(`Truncated (${finishReason}), retrying...`);
                    continue;
                }
                const text = candidate?.content?.parts?.[0]?.text || '[]';
                const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                quickBytes = JSON.parse(cleaned);
                console.log(`✅ Generated ${quickBytes.length} Quick Bytes`);

                // Show distribution
                const catCount: Record<string, number> = {};
                quickBytes.forEach(qb => { catCount[qb.category] = (catCount[qb.category] || 0) + 1; });
                console.log('Category distribution:', catCount);
                break;
            } catch (err: any) {
                console.warn(`Failed on ${model} (attempt ${attempt}): ${err.message}`);
                if (attempt < 2) await sleep(3000);
            }
        }
        if (quickBytes.length > 0) break;
    }

    if (quickBytes.length === 0) {
        console.error('❌ Quick Bytes generation failed');
        process.exit(1);
    }

    // Inject into ePaper
    epaper.quickBytes = quickBytes;
    fs.writeFileSync(epaperPath, JSON.stringify(epaper, null, 2));
    console.log(`✅ Injected ${quickBytes.length} Quick Bytes into ${epaperPath}`);

    // Show each Quick Byte
    console.log('\n--- Quick Bytes ---');
    quickBytes.forEach((qb, i) => {
        console.log(`${i + 1}. [${qb.category.toUpperCase()}] (${qb.gsPaper}) ${qb.text}`);
    });
}

regenerateQuickBytes();
