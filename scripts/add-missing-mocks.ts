/**
 * Add Prelims & Mains mocks to existing ePaper files that are missing them.
 * Uses Gemini to generate contextual mock questions from the articles.
 */
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash';
const EPAPER_DIR = path.join(__dirname, '..', 'src', 'data', 'epaper');

async function addMocksToDate(dateStr: string) {
  const filePath = path.join(EPAPER_DIR, `epaper-${dateStr}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ No ePaper for ${dateStr}`);
    return false;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  // Check if mocks already exist
  const hasPrelims = (data.prelimsMocks || []).length > 0;
  const hasMains = (data.mainsMocks || []).length > 0;
  
  if (hasPrelims && hasMains) {
    console.log(`  ⏭ ${dateStr}: Already has ${data.prelimsMocks.length} Prelims + ${data.mainsMocks.length} Mains mocks`);
    return true;
  }

  console.log(`  📝 ${dateStr}: Generating mocks (Prelims: ${hasPrelims ? 'exists' : 'MISSING'}, Mains: ${hasMains ? 'exists' : 'MISSING'})...`);

  // Build article summaries for context
  const articleSummaries = (data.articles || [])
    .slice(0, 20)
    .map((a: any, i: number) => {
      const exp = Array.isArray(a.explainer) ? a.explainer.join(' ') : (a.explainer || '');
      return `${i + 1}. [${a.category || ''}] ${a.headline}\n   ${String(exp).slice(0, 200)}`;
    })
    .join('\n\n');

  const prompt = `Based on the following UPSC Current Affairs articles from ${dateStr}, generate mock questions.

ARTICLES:
${articleSummaries}

Generate a JSON object with:
{
  "prelimsMocks": [
    // Generate 5 UPSC Prelims-style MCQs. Format:
    {
      "question": "Consider the following statements regarding [topic]:\\n1. Statement 1\\n2. Statement 2\\nWhich of the statements given above is/are correct?",
      "options": ["(a) 1 only", "(b) 2 only", "(c) Both 1 and 2", "(d) Neither 1 nor 2"],
      "answer": "(c) Both 1 and 2",
      "explanation": "Detailed factual explanation"
    }
  ],
  "mainsMocks": [
    // Generate 5 UPSC Mains-style questions. Format:
    {
      "question": "Discuss the significance of...",
      "syllabusMatch": "GS2: International Relations / Important International Institutions",
      "approach": "Brief 3-4 line approach on how to answer"
    }
  ]
}

IMPORTANT:
- Make Prelims MCQs factually accurate with proper UPSC format
- Use "Consider the following statements" or "Which of the following" patterns
- Mains questions should be analytical, not just descriptive
- Cover diverse GS papers (GS1, GS2, GS3)
- Return ONLY the JSON object, no markdown`;

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    });

    const result = await res.json();
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini');
    }

    const cleaned = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const mocks = JSON.parse(cleaned);

    // Merge mocks into existing data
    if (!hasPrelims && mocks.prelimsMocks?.length > 0) {
      data.prelimsMocks = mocks.prelimsMocks;
      console.log(`    ✅ Added ${mocks.prelimsMocks.length} Prelims mocks`);
    }
    if (!hasMains && mocks.mainsMocks?.length > 0) {
      data.mainsMocks = mocks.mainsMocks;
      console.log(`    ✅ Added ${mocks.mainsMocks.length} Mains mocks`);
    }

    // Save updated file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`    💾 Saved ${dateStr}`);
    return true;
  } catch (e) {
    console.error(`    ❌ Error: ${(e as Error).message}`);
    return false;
  }
}

async function main() {
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not set');
    process.exit(1);
  }

  console.log('\n📝 Adding mocks to ePapers that are missing them...\n');

  // Find all ePapers missing mocks
  const files = fs.readdirSync(EPAPER_DIR)
    .filter(f => f.startsWith('epaper-') && f.endsWith('.json') && f !== 'epaper-index.json')
    .sort();

  const missing: string[] = [];
  
  for (const f of files) {
    const dateStr = f.replace('epaper-', '').replace('.json', '');
    // Only check March 2026
    if (!dateStr.startsWith('2026-03')) continue;
    
    try {
      const data = JSON.parse(fs.readFileSync(path.join(EPAPER_DIR, f), 'utf-8'));
      const prelims = (data.prelimsMocks || []).length;
      const mains = (data.mainsMocks || []).length;
      if (prelims === 0 || mains === 0) {
        missing.push(dateStr);
      }
    } catch {}
  }

  console.log(`Found ${missing.length} March 2026 ePapers missing mocks: ${missing.join(', ')}\n`);

  let success = 0;
  for (const dateStr of missing) {
    const ok = await addMocksToDate(dateStr);
    if (ok) success++;
    // Rate limit
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log(`\n✅ Done! Fixed ${success}/${missing.length} ePapers.`);
}

main().catch(console.error);
