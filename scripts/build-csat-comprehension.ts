/**
 * CSAT Comprehension Bank Builder
 * 
 * Extracts editorial/explainer content from 542 days of ePaper data,
 * converts them into UPSC CSAT-style comprehension passages with 3-4 questions each.
 * 
 * Usage: npx tsx scripts/build-csat-comprehension.ts [batchSize] [startFrom]
 * 
 * batchSize: number of passages to generate per run (default: 20)
 * startFrom: skip first N ePaper files (default: 0, for incremental runs)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const EPAPER_DIR = path.join(process.cwd(), 'src', 'data', 'epaper');
const OUTPUT_PATH = path.join(process.cwd(), 'mock-engine', 'data', 'csat-comprehension-bank.json');

const SAFETY_GUIDELINES = `
MANDATORY CONTENT GUIDELINES:
- This is for the UPSC Civil Services Examination (Government of India exam).
- Keep content neutral, academic, and analytical.
- DO NOT reference specific political parties or politicians by name.
- DO NOT take sides on controversial issues — present balanced analysis.
- DO NOT reference specific countries negatively.
- Maintain a governance/policy perspective.
`;

// ─── Types ─────────────────────────────────────────────────────────────

interface PassageQuestion {
    uid: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    subject: string;
    sub_topic: string;
    passage: string;
    passage_id: string;
}

interface ComprehensionPassage {
    passage_id: string;
    passage: string;
    source_theme: string;
    source_date: string;
    source_headline: string;
    word_count: number;
    questions: PassageQuestion[];
}

interface ComprehensionBank {
    generatedAt: string;
    totalPassages: number;
    totalQuestions: number;
    passages: ComprehensionPassage[];
}

// ─── Gemini API ────────────────────────────────────────────────────────

async function callGemini(prompt: string, retries = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.6, maxOutputTokens: 8192 },
                }),
            });

            if (!response.ok) {
                const errText = await response.text();
                if (attempt < retries && (response.status === 429 || response.status >= 500)) {
                    console.log(`    ⏳ API error ${response.status}, retrying in ${attempt * 5}s...`);
                    await new Promise(r => setTimeout(r, attempt * 5000));
                    continue;
                }
                throw new Error(`Gemini API error ${response.status}: ${errText.substring(0, 200)}`);
            }

            const json = await response.json();
            return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (e: any) {
            if (attempt < retries) {
                console.log(`    ⏳ Attempt ${attempt} failed, retrying...`);
                await new Promise(r => setTimeout(r, attempt * 3000));
                continue;
            }
            throw e;
        }
    }
    throw new Error('All retries failed');
}

function extractJSON(text: string): any {
    const cleaned = text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
    try { return JSON.parse(cleaned); } catch { }

    const jsonMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (jsonMatch) {
        try { return JSON.parse(jsonMatch[1]); } catch { }
        const fixed = fixTruncatedJSON(jsonMatch[1]);
        if (fixed) return fixed;
    }

    const bracketMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (bracketMatch) {
        try { return JSON.parse(bracketMatch[1]); } catch { }
        const fixed = fixTruncatedJSON(bracketMatch[1]);
        if (fixed) return fixed;
    }

    throw new Error('Could not extract JSON');
}

function fixTruncatedJSON(text: string): any | null {
    let braces = 0, brackets = 0;
    for (const ch of text) {
        if (ch === '{') braces++;
        if (ch === '}') braces--;
        if (ch === '[') brackets++;
        if (ch === ']') brackets--;
    }
    let fixed = text.trim().replace(/,\s*$/, '');
    const quoteCount = (fixed.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) fixed += '"';
    for (let i = 0; i < braces; i++) fixed += '}';
    for (let i = 0; i < brackets; i++) fixed += ']';
    try { return JSON.parse(fixed); } catch { }
    return null;
}

function genUID(text: string): string {
    const hash = crypto.createHash('md5').update(text).digest('hex').slice(0, 12);
    return `csat-comp-${hash}`;
}

// ─── Extract editorial content from ePaper files ───────────────────────

interface EditorialSource {
    date: string;
    headline: string;
    explainer: string;
    category: string;
}

function extractEditorials(): EditorialSource[] {
    if (!fs.existsSync(EPAPER_DIR)) {
        console.error('❌ ePaper directory not found');
        process.exit(1);
    }

    const files = fs.readdirSync(EPAPER_DIR)
        .filter(f => f.startsWith('epaper-') && f.endsWith('.json') && f !== 'epaper-index.json')
        .sort();

    console.log(`📂 Found ${files.length} ePaper files`);

    const editorials: EditorialSource[] = [];

    for (const file of files) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(EPAPER_DIR, file), 'utf-8'));
            const dateStr = file.replace('epaper-', '').replace('.json', '');
            const articles = data.articles || [];

            for (const article of articles) {
                const explainer = article.explainer || '';
                // Only take articles with substantial explainer content (>300 chars)
                if (explainer.length >= 300) {
                    editorials.push({
                        date: dateStr,
                        headline: article.headline || '',
                        explainer,
                        category: article.category || 'general',
                    });
                }
            }
        } catch { /* skip broken files */ }
    }

    console.log(`📰 Extracted ${editorials.length} editorials with substantial content`);
    return editorials;
}

// ─── Generate passages from editorials ─────────────────────────────────

async function generatePassageBatch(editorials: EditorialSource[]): Promise<ComprehensionPassage[]> {
    // Group 3 editorials per prompt call → 3 passages per API call
    const sourceSummaries = editorials.map((e, i) => 
        `SOURCE ${i + 1} (${e.date}, ${e.category}):\nHeadline: ${e.headline}\nContent: ${e.explainer}`
    ).join('\n\n');

    const prompt = `
You are an expert UPSC CSAT Paper II question setter. I will give you ${editorials.length} editorial summaries from Indian current affairs. 

For EACH source, create ONE reading comprehension passage and EXACTLY 4 MCQ questions.

${SAFETY_GUIDELINES}

PASSAGE RULES:
- Rewrite the editorial content as a self-contained academic passage of 200-300 words.
- DO NOT copy the source text verbatim — rephrase and restructure it.
- The passage should read like an editorial from a quality newspaper.
- Include nuanced arguments, not just facts.
- Do NOT mention specific newspaper names or dates.
- Make it suitable for a competitive exam — analytical and thought-provoking.

QUESTION RULES:
- 4 questions per passage, testing DIFFERENT skills:
  Q1: What is the central theme / main idea of the passage?
  Q2: What can be inferred from the passage? (inference)
  Q3: What is the author's tone / attitude? OR What does the word "X" mean in context?
  Q4: Which of the following conclusions can be drawn? (logical conclusion)
- Each question: 4 options (A/B/C/D), only ONE correct.
- Distractors must be plausible but clearly wrong on careful reading.
- Difficulty: 1 easy, 2 medium, 1 hard per passage.

${sourceSummaries}

OUTPUT FORMAT (JSON array):
\`\`\`json
[
  {
    "source_index": 0,
    "passage": "200-300 word passage text...",
    "theme": "brief theme label",
    "questions": [
      {
        "question": "Q text?",
        "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...",
        "correct_answer": "A",
        "explanation": "why correct",
        "difficulty": "easy|medium|hard",
        "skill": "main_idea|inference|tone|vocabulary|conclusion"
      }
    ]
  }
]
\`\`\`

Return ONLY the JSON array of ${editorials.length} passage objects.`;

    const response = await callGemini(prompt);
    const parsed = extractJSON(response) as any[];

    const results: ComprehensionPassage[] = [];

    for (const item of parsed) {
        const srcIdx = item.source_index ?? results.length;
        const src = editorials[srcIdx] || editorials[results.length] || editorials[0];
        const passageText = item.passage || '';
        const passageId = genUID(passageText);
        const wordCount = passageText.split(/\s+/).length;

        const questions: PassageQuestion[] = (item.questions || []).map((q: any) => ({
            uid: genUID(passageText + q.question),
            question: q.question,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_answer: q.correct_answer?.toUpperCase()?.match(/[ABCD]/)?.[0] || 'A',
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'medium',
            subject: 'comprehension',
            sub_topic: q.skill || 'Reading Comprehension',
            passage: passageText,
            passage_id: passageId,
        }));

        results.push({
            passage_id: passageId,
            passage: passageText,
            source_theme: item.theme || src.category,
            source_date: src.date,
            source_headline: src.headline,
            word_count: wordCount,
            questions,
        });
    }

    return results;
}

// ─── Load existing bank ────────────────────────────────────────────────

function loadExistingBank(): ComprehensionBank {
    if (fs.existsSync(OUTPUT_PATH)) {
        try {
            return JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
        } catch { }
    }
    return { generatedAt: '', totalPassages: 0, totalQuestions: 0, passages: [] };
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not set');
        process.exit(1);
    }

    const args = process.argv.slice(2);
    const targetPassages = parseInt(args[0]) || 20;
    const startFrom = parseInt(args[1]) || 0;

    console.log('\n📖 CSAT Comprehension Bank Builder');
    console.log(`   Target: ${targetPassages} new passages`);
    console.log(`   Start from ePaper index: ${startFrom}\n`);

    // Load existing
    const bank = loadExistingBank();
    const existingHeadlines = new Set(bank.passages.map(p => p.source_headline.toLowerCase()));
    console.log(`   📦 Existing: ${bank.totalPassages} passages, ${bank.totalQuestions} questions\n`);

    // Extract editorials
    const allEditorials = extractEditorials();

    // Skip already used headlines and start from offset
    const freshEditorials = allEditorials
        .slice(startFrom)
        .filter(e => !existingHeadlines.has(e.headline.toLowerCase()));

    console.log(`   🆕 Fresh editorials available: ${freshEditorials.length}\n`);

    if (freshEditorials.length === 0) {
        console.log('✅ No new editorials to process');
        return;
    }

    // Shuffle to get variety across dates/categories
    const shuffled = freshEditorials.sort(() => Math.random() - 0.5);

    // Process in batches of 3 (3 passages per API call)
    const batchSize = 3;
    const totalBatches = Math.ceil(targetPassages / batchSize);
    let generated = 0;

    for (let b = 0; b < totalBatches && generated < targetPassages; b++) {
        const batchEditorials = shuffled.slice(b * batchSize, (b + 1) * batchSize);
        if (batchEditorials.length === 0) break;

        try {
            console.log(`  📝 Batch ${b + 1}/${totalBatches}: ${batchEditorials.map(e => e.headline.substring(0, 40) + '...').join(' | ')}`);
            
            const passages = await generatePassageBatch(batchEditorials);
            
            for (const p of passages) {
                // Skip if passage is too short
                if (p.word_count < 100 || p.questions.length < 3) {
                    console.log(`    ⚠️ Skipping short passage (${p.word_count} words, ${p.questions.length} Qs)`);
                    continue;
                }
                bank.passages.push(p);
                generated++;
            }

            console.log(`    ✅ ${passages.length} passages (total: ${bank.passages.length})`);

            // Save after each batch (incremental save)
            bank.generatedAt = new Date().toISOString();
            bank.totalPassages = bank.passages.length;
            bank.totalQuestions = bank.passages.reduce((sum, p) => sum + p.questions.length, 0);
            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(bank, null, 2));

        } catch (err: any) {
            console.error(`    ❌ Batch ${b + 1} failed: ${err.message}`);
        }

        // Rate limiting
        if (b < totalBatches - 1) {
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    // Final stats
    console.log(`\n✅ Comprehension Bank Updated`);
    console.log(`   📁 ${OUTPUT_PATH}`);
    console.log(`   📖 Total passages: ${bank.totalPassages}`);
    console.log(`   ❓ Total questions: ${bank.totalQuestions}`);
    console.log(`   📊 Avg questions/passage: ${(bank.totalQuestions / bank.totalPassages).toFixed(1)}`);
    
    // Category distribution
    const catCounts: Record<string, number> = {};
    for (const p of bank.passages) {
        catCounts[p.source_theme] = (catCounts[p.source_theme] || 0) + 1;
    }
    console.log('   📂 Theme distribution:');
    for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`      ${cat}: ${count}`);
    }
}

main().catch(console.error);
