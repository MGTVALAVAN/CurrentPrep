/**
 * Translate today's ePaper to Tamil using Gemini API.
 * Saves translated version as epaper-{date}-ta.json
 * 
 * Usage: npx tsx scripts/translate-epaper-tamil.ts [date]
 */
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function callGemini(apiKey: string, prompt: string, retries = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: { 
                            temperature: 0.2,
                            maxOutputTokens: 8192,
                            responseMimeType: 'application/json'
                        },
                    }),
                }
            );
            if (!response.ok) {
                if (response.status === 429) { await sleep(8000); continue; }
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        } catch (err: any) {
            console.warn(`  ⚠️ Attempt ${attempt} failed: ${err.message}`);
            if (attempt < retries) await sleep(3000);
        }
    }
    throw new Error('All retries exhausted');
}

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { console.error('No GEMINI_API_KEY'); process.exit(1); }

    const dateArg = process.argv[2] || new Date().toISOString().split('T')[0];
    const epaperPath = path.join(process.cwd(), 'src/data/epaper', `epaper-${dateArg}.json`);

    if (!fs.existsSync(epaperPath)) {
        console.error(`❌ No ePaper file found: ${epaperPath}`);
        process.exit(1);
    }

    const epaper = JSON.parse(fs.readFileSync(epaperPath, 'utf-8'));
    console.log(`\n📰 Translating ePaper for ${dateArg} to Tamil`);
    console.log(`   ${epaper.articles.length} articles to translate\n`);

    // Translate articles in batches of 3
    const translatedArticles: any[] = [];
    const batchSize = 3;

    for (let i = 0; i < epaper.articles.length; i += batchSize) {
        const batch = epaper.articles.slice(i, i + batchSize);
        console.log(`  Translating articles ${i + 1}-${Math.min(i + batchSize, epaper.articles.length)}...`);

        const articlesForTranslation = batch.map((a: any) => ({
            id: a.id,
            headline: a.headline,
            explainer: a.explainer,
            trivia: a.trivia || '',
            keyTerms: a.keyTerms || [],
            prelimsPoints: a.prelimsPoints || [],
            mainsPoints: a.mainsPoints || [],
        }));

        const prompt = `You are an expert English-to-Tamil translator for UPSC exam content.

Translate the following article data from English to Tamil. Maintain all technical terms, proper nouns, and acronyms in English (like GDP, ISRO, UNESCO, etc.) but translate the surrounding text to Tamil.

IMPORTANT RULES:
- Translate headline, explainer, trivia, keyTerms, prelimsPoints, and mainsPoints to Tamil
- Keep proper nouns (country names, person names, organization names) in English within Tamil text
- Keep acronyms and abbreviations in English
- The translation should be natural Tamil, not transliterated English
- Return the SAME JSON structure with Tamil translations

INPUT:
${JSON.stringify(articlesForTranslation, null, 2)}

Return a JSON array with the same structure, but with Tamil translations for all text fields.`;

        try {
            const result = await callGemini(apiKey, prompt);
            const translated = JSON.parse(result);

            for (let j = 0; j < batch.length; j++) {
                const original = { ...batch[j] };
                const tamil = translated[j] || {};
                translatedArticles.push({
                    ...original,
                    headline: tamil.headline || original.headline,
                    explainer: tamil.explainer || original.explainer,
                    trivia: tamil.trivia || original.trivia,
                    keyTerms: tamil.keyTerms || original.keyTerms,
                    prelimsPoints: tamil.prelimsPoints || original.prelimsPoints,
                    mainsPoints: tamil.mainsPoints || original.mainsPoints,
                });
            }
            console.log(`  ✅ Batch translated`);
        } catch (err: any) {
            console.warn(`  ⚠️ Batch failed, keeping English: ${err.message}`);
            translatedArticles.push(...batch);
        }

        if (i + batchSize < epaper.articles.length) await sleep(2000);
    }

    // Translate highlights
    console.log(`  Translating highlights...`);
    try {
        const highlightsPrompt = `Translate these news highlights to Tamil. Keep proper nouns and acronyms in English. Return a JSON array of strings.

${JSON.stringify(epaper.highlights)}`;
        const highlightsResult = await callGemini(apiKey, highlightsPrompt);
        epaper.highlights = JSON.parse(highlightsResult);
        console.log(`  ✅ Highlights translated`);
    } catch { console.warn(`  ⚠️ Highlights translation failed, keeping English`); }

    await sleep(2000);

    // Translate Quick Bytes
    if (epaper.quickBytes?.length) {
        console.log(`  Translating Quick Bytes...`);
        try {
            const qbPrompt = `Translate these Quick Bytes to Tamil. Keep proper nouns, acronyms, dates in English. Return same JSON structure.

${JSON.stringify(epaper.quickBytes)}`;
            const qbResult = await callGemini(apiKey, qbPrompt);
            epaper.quickBytes = JSON.parse(qbResult);
            console.log(`  ✅ Quick Bytes translated`);
        } catch { console.warn(`  ⚠️ Quick Bytes translation failed`); }
    }

    await sleep(2000);

    // Translate Prelims Mocks
    if (epaper.prelimsMocks?.length) {
        console.log(`  Translating Prelims mocks...`);
        try {
            const pm = epaper.prelimsMocks.map((q: any) => ({
                question: q.question,
                options: q.options,
                answer: q.answer,
                explanation: q.explanation,
            }));
            const pmPrompt = `Translate these UPSC Prelims MCQ questions to Tamil. Keep proper nouns, acronyms, and technical terms in English. Return same JSON structure.

${JSON.stringify(pm)}`;
            const pmResult = await callGemini(apiKey, pmPrompt);
            const translatedPm = JSON.parse(pmResult);
            for (let i = 0; i < epaper.prelimsMocks.length; i++) {
                if (translatedPm[i]) {
                    epaper.prelimsMocks[i].question = translatedPm[i].question || epaper.prelimsMocks[i].question;
                    epaper.prelimsMocks[i].options = translatedPm[i].options || epaper.prelimsMocks[i].options;
                    epaper.prelimsMocks[i].explanation = translatedPm[i].explanation || epaper.prelimsMocks[i].explanation;
                    // Keep answer key in English
                }
            }
            console.log(`  ✅ Prelims mocks translated`);
        } catch { console.warn(`  ⚠️ Prelims mocks translation failed`); }
    }

    await sleep(2000);

    // Translate Mains Mocks
    if (epaper.mainsMocks?.length) {
        console.log(`  Translating Mains mocks...`);
        try {
            const mm = epaper.mainsMocks.map((q: any) => ({
                question: q.question,
                syllabusMatch: q.syllabusMatch,
                approach: q.approach,
            }));
            const mmPrompt = `Translate these UPSC Mains questions to Tamil. Keep proper nouns, acronyms, and technical terms in English. Return same JSON structure.

${JSON.stringify(mm)}`;
            const mmResult = await callGemini(apiKey, mmPrompt);
            const translatedMm = JSON.parse(mmResult);
            for (let i = 0; i < epaper.mainsMocks.length; i++) {
                if (translatedMm[i]) {
                    epaper.mainsMocks[i].question = translatedMm[i].question || epaper.mainsMocks[i].question;
                    epaper.mainsMocks[i].syllabusMatch = translatedMm[i].syllabusMatch || epaper.mainsMocks[i].syllabusMatch;
                    epaper.mainsMocks[i].approach = translatedMm[i].approach || epaper.mainsMocks[i].approach;
                }
            }
            console.log(`  ✅ Mains mocks translated`);
        } catch { console.warn(`  ⚠️ Mains mocks translation failed`); }
    }

    await sleep(2000);

    // Translate front page extras
    if (epaper.quoteOfTheDay) {
        console.log(`  Translating Quote of the Day...`);
        try {
            const qPrompt = `Translate this quote to Tamil. Keep the author name in English. Return JSON: {"text": "...", "author": "..."}

${JSON.stringify(epaper.quoteOfTheDay)}`;
            const qResult = await callGemini(apiKey, qPrompt);
            epaper.quoteOfTheDay = JSON.parse(qResult);
            console.log(`  ✅ Quote translated`);
        } catch { console.warn(`  ⚠️ Quote translation failed`); }
    }

    if (epaper.onThisDay) {
        console.log(`  Translating On This Day...`);
        try {
            const otdPrompt = `Translate this historical event to Tamil. Keep proper nouns in English. Return JSON: {"year": number, "event": "..."}

${JSON.stringify(epaper.onThisDay)}`;
            const otdResult = await callGemini(apiKey, otdPrompt);
            epaper.onThisDay = JSON.parse(otdResult);
            console.log(`  ✅ On This Day translated`);
        } catch { console.warn(`  ⚠️ On This Day translation failed`); }
    }

    if (epaper.dataSnapshot) {
        console.log(`  Translating Data Snapshot...`);
        try {
            const dsPrompt = `Translate this data snapshot to Tamil. Keep numbers/values in English. Return JSON: {"label": "...", "value": "...", "context": "..."}

${JSON.stringify(epaper.dataSnapshot)}`;
            const dsResult = await callGemini(apiKey, dsPrompt);
            epaper.dataSnapshot = JSON.parse(dsResult);
            console.log(`  ✅ Data Snapshot translated`);
        } catch { console.warn(`  ⚠️ Data Snapshot translation failed`); }
    }

    // Save Tamil version
    epaper.articles = translatedArticles;
    epaper.language = 'ta';
    epaper.dateFormatted = `${dateArg} • தமிழ் பதிப்பு`;

    const outputPath = path.join(process.cwd(), 'src/data/epaper', `epaper-${dateArg}-ta.json`);
    fs.writeFileSync(outputPath, JSON.stringify(epaper, null, 2));
    console.log(`\n✅ Tamil ePaper saved to: ${outputPath}`);
    console.log(`   ${translatedArticles.length} articles translated\n`);
}

main().catch(console.error);
