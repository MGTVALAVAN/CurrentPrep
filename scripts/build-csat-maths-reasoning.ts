/**
 * CSAT Maths & Reasoning Bank Generator v2
 * Based on UPSC CSAT 2014-2024 PYQ Trend Analysis
 * 
 * Usage:
 *   npx tsx scripts/build-csat-maths-reasoning.ts maths [count]
 *   npx tsx scripts/build-csat-maths-reasoning.ts reasoning [count]
 *   npx tsx scripts/build-csat-maths-reasoning.ts all
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

const OUTPUT_DIR = path.join(process.cwd(), 'mock-engine', 'data');
const MATHS_PATH = path.join(OUTPUT_DIR, 'csat-maths-bank.json');
const REASONING_PATH = path.join(OUTPUT_DIR, 'csat-reasoning-bank.json');

const SAFETY = `
MANDATORY RULES:
- UPSC Civil Services Exam (Government of India). Keep content neutral, academic.
- NO specific countries referenced negatively. NO political parties/politicians.
- NO gender/caste/religion bias. NO controversial topics.
- Use Indian context where natural (₹, km, Indian names).
- Questions must be solvable without external knowledge.
`;

// ─── PYQ-aligned sub-topic definitions ─────────────────────────────────

// MATHS: Based on 317 PYQs (2014-2024), proportional targets for 500 bank
const MATHS_SUBTOPICS = [
    { id: 'number_system', name: 'Number System', pyqCount: 87, bankTarget: 130,
      prompt: `Number System questions: divisibility rules, factors, prime numbers, LCM, HCF, unit digit, digital root, number properties. Questions should test number sense and pattern recognition. Include "which of the following numbers..." style questions.` },
    { id: 'percentage', name: 'Percentage', pyqCount: 26, bankTarget: 40,
      prompt: `Percentage problems: successive percentage changes, finding original value after increase/decrease, percentage of percentage, population growth, price changes.` },
    { id: 'divisibility_remainder', name: 'Divisibility & Remainder', pyqCount: 22, bankTarget: 35,
      prompt: `Divisibility & Remainder questions: remainder when large numbers are divided, divisibility tests for 2-11, applications of modular arithmetic. "What is the remainder when X is divided by Y?" style.` },
    { id: 'permutation', name: 'Permutation & Combination', pyqCount: 19, bankTarget: 30,
      prompt: `Permutation and Combination questions: arrangement problems, selection problems, forming numbers with conditions, committee formation, word arrangement. Keep at Class X level.` },
    { id: 'data_sufficiency', name: 'Data Sufficiency', pyqCount: 16, bankTarget: 25,
      prompt: `Data Sufficiency questions: Give a question and TWO statements. Ask which statement(s) are sufficient to answer. Options: "Statement I alone", "Statement II alone", "Both together", "Neither". Topics: arithmetic, algebra, geometry.` },
    { id: 'data_interpretation', name: 'Data Interpretation', pyqCount: 27, bankTarget: 40,
      prompt: `Data Interpretation: Present a TEXT TABLE (4-6 rows, 3-5 columns) with hypothetical data (production, population, budget, agriculture). Ask 4 questions per table: direct reading, percentage calculation, comparison, multi-step. Use Indian context (states, sectors, years).` },
    { id: 'average', name: 'Average', pyqCount: 14, bankTarget: 22,
      prompt: `Average problems: weighted average, finding missing values, effect of adding/removing elements, average of series, age-based averages.` },
    { id: 'speed_time_distance', name: 'Speed, Time & Distance', pyqCount: 13, bankTarget: 20,
      prompt: `Speed/Time/Distance: relative speed, meeting point, trains crossing, boats and streams, average speed for round trips. 1-2 minute solvable.` },
    { id: 'mensuration', name: 'Mensuration', pyqCount: 12, bankTarget: 18,
      prompt: `Mensuration: area/perimeter of basic shapes (rectangle, circle, triangle), volume of cube/cylinder/sphere, surface area. Practical contexts: fencing, painting, water filling.` },
    { id: 'time_work', name: 'Time & Work', pyqCount: 10, bankTarget: 16,
      prompt: `Time and Work: individual/combined work rates, alternate day work, pipes and cisterns. "A can do a job in X days, B in Y days" style.` },
    { id: 'profit_loss', name: 'Profit & Loss', pyqCount: 10, bankTarget: 16,
      prompt: `Profit and Loss: cost price, selling price, markup/discount, successive discounts, dishonest dealer. Market/shop scenarios.` },
    { id: 'ratio_proportion', name: 'Ratio & Proportion', pyqCount: 8, bankTarget: 14,
      prompt: `Ratio and Proportion: direct/inverse proportion, distributing amounts, compound ratio, partnership-based ratios.` },
    { id: 'integer', name: 'Integer Properties', pyqCount: 12, bankTarget: 18,
      prompt: `Integer properties: odd/even, consecutive numbers, sum of digits, greatest/smallest N-digit numbers, powers and indices.` },
    { id: 'problem_age', name: 'Problem on Ages', pyqCount: 6, bankTarget: 10,
      prompt: `Age problems: "X years ago A was Y years old. After Z years..." Linear equation approach. Keep to 2 variables max.` },
    { id: 'mixture', name: 'Mixture & Alligation', pyqCount: 5, bankTarget: 8,
      prompt: `Mixture problems: alligation rule, mixing solutions of different concentrations, milk-water problems, tea blending.` },
    { id: 'probability', name: 'Probability', pyqCount: 4, bankTarget: 8,
      prompt: `Basic Probability: coin, dice, card-based, "at least one" type, complementary probability. Class X level.` },
    { id: 'interest', name: 'Simple & Compound Interest', pyqCount: 3, bankTarget: 6,
      prompt: `SI and CI: finding interest/principal/time, difference between SI and CI for 2-3 years. Bank/loan scenarios.` },
    { id: 'geometry', name: 'Geometry', pyqCount: 3, bankTarget: 6,
      prompt: `Basic Geometry: properties of triangles, circles, quadrilaterals, angle calculations, parallel lines. Theorem applications.` },
    { id: 'cube_cuboid', name: 'Cube & Cuboid', pyqCount: 4, bankTarget: 6,
      prompt: `Cube cutting, painting, and counting problems. "A cube is painted on all faces and then cut into N equal smaller cubes..."` },
    { id: 'number_series', name: 'Number Series', pyqCount: 5, bankTarget: 8,
      prompt: `Number series: find next term or missing term. Patterns: arithmetic, geometric, squares, cubes, alternating, Fibonacci-like.` },
    { id: 'simplification', name: 'Simplification', pyqCount: 5, bankTarget: 8,
      prompt: `Simplification: BODMAS, fraction operations, approximation, square roots. "Simplify the following expression" style.` },
];

// REASONING: Based on 256 PYQs (2014-2024)
const REASONING_SUBTOPICS = [
    { id: 'puzzle', name: 'Puzzle', pyqCount: 78, bankTarget: 80,
      prompt: `Logic Puzzles: Give a scenario with 4-6 persons and multiple conditions (who does what, who sits where, etc.). Ask multiple questions from one puzzle. Types: scheduling, assignment, comparison. Each puzzle should have 2-3 conditions and be solvable step-by-step. Use generic names (A, B, C, D or Amit, Bina, etc).` },
    { id: 'statement_conclusion', name: 'Statements & Conclusions', pyqCount: 23, bankTarget: 40,
      prompt: `Statement-Conclusion / Statement-Inference / Statement-Argument questions. Give a statement about a social/policy topic, then 2 conclusions/inferences. Ask which follow logically. Options: "Only I", "Only II", "Both", "Neither". Test deduction vs assumption.` },
    { id: 'order_ranking', name: 'Order & Ranking', pyqCount: 18, bankTarget: 30,
      prompt: `Order and Ranking: "A is taller than B, C is shorter than D..." type. Linear ordering, comparison chains. Ask: "Who is 3rd from top?" or "How many persons between X and Y?"` },
    { id: 'direction_distance', name: 'Direction & Distance', pyqCount: 14, bankTarget: 25,
      prompt: `Direction sense: A person walks east 5km, turns left walks 3km, etc. Ask final distance from start or final direction facing. Maximum 4-5 turns. Use km.` },
    { id: 'series', name: 'Series (Logical)', pyqCount: 12, bankTarget: 20,
      prompt: `Logical series: letter series, alpha-numeric series, figure-based pattern (describe in text). "What comes next?" or "Find the odd one out".` },
    { id: 'clock', name: 'Clock Problems', pyqCount: 12, bankTarget: 20,
      prompt: `Clock questions: angle between hands at a given time, how many times hands coincide in 12 hours, time when hands are at a specific angle. Also clock-based logic.` },
    { id: 'calendar', name: 'Calendar Problems', pyqCount: 12, bankTarget: 20,
      prompt: `Calendar questions: what day of the week was/will be a given date, leap year calculations, odd days concept. "If Jan 1 2024 is Monday, what day is March 15?"` },
    { id: 'syllogism', name: 'Syllogism', pyqCount: 11, bankTarget: 20,
      prompt: `Syllogism: 2-3 statements using "All", "Some", "No". Two conclusions given. Options: "Only I follows", "Only II follows", "Both follow", "Neither follows". Use Venn diagram logic.` },
    { id: 'blood_relation', name: 'Blood Relation', pyqCount: 9, bankTarget: 15,
      prompt: `Blood relation puzzles: "A is father of B, B is sister of C..." chains. Ask "How is X related to Y?" 3-5 relationship steps. Use Indian names.` },
    { id: 'coding_decoding', name: 'Coding & Decoding', pyqCount: 8, bankTarget: 15,
      prompt: `Coding-Decoding: "In a code, APPLE→ELPPA. How is MANGO written?" Clear deterministic patterns: reversal, letter shift, position-based.` },
    { id: 'cube_dice', name: 'Cube & Dice', pyqCount: 9, bankTarget: 15,
      prompt: `Dice/Cube problems: "A cube has numbers 1-6 on faces. When 1 is on top, 3 is facing north..." or dice unfolding problems. Which number is opposite to X?` },
    { id: 'data_sufficiency_reasoning', name: 'Data Sufficiency (Reasoning)', pyqCount: 9, bankTarget: 15,
      prompt: `Data Sufficiency for logical reasoning: Give a logical question + 2 statements. Ask which statement(s) are sufficient. Topics: age, ranking, direction.` },
    { id: 'arrangement_pattern', name: 'Arrangement & Pattern', pyqCount: 9, bankTarget: 15,
      prompt: `Pattern recognition: figure series described in text, missing element in a pattern, arrangement rules. "Which figure completes the pattern?"` },
    { id: 'venn_diagram', name: 'Venn Diagram', pyqCount: 6, bankTarget: 10,
      prompt: `Venn Diagram: 2 or 3 overlapping sets. Given total counts and overlaps, find specific regions. "How many students study only Maths?"` },
    { id: 'seating_arrangement', name: 'Seating Arrangement', pyqCount: 5, bankTarget: 10,
      prompt: `Linear or circular seating: 5-6 persons, given position constraints. "Who sits opposite to A?" For linear: row facing north. For circular: clockwise.` },
    { id: 'missing_term', name: 'Missing Term', pyqCount: 6, bankTarget: 10,
      prompt: `Missing term in a matrix/sequence: 3x3 grid or table with one missing value. Find the pattern (row-wise, column-wise, diagonal) and the missing number.` },
];

// ─── Gemini API ────────────────────────────────────────────────────────

async function callGemini(prompt: string, retries = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.65, maxOutputTokens: 16384 },
                }),
            });
            if (!response.ok) {
                const errText = await response.text();
                if (attempt < retries && (response.status === 429 || response.status >= 500)) {
                    await new Promise(r => setTimeout(r, attempt * 5000));
                    continue;
                }
                throw new Error(`API error ${response.status}`);
            }
            const json = await response.json();
            return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (e: any) {
            if (attempt < retries) {
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
    const m = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (m) { try { return JSON.parse(m[1]); } catch { } }
    const b = cleaned.match(/(\[[\s\S]*\])/);
    if (b) { try { return JSON.parse(b[1]); } catch { } }
    // Try fixing truncated
    const raw = (m?.[1] || b?.[1] || cleaned).trim().replace(/,\s*$/, '');
    let braces = 0, brackets = 0;
    for (const ch of raw) { if (ch === '{') braces++; if (ch === '}') braces--; if (ch === '[') brackets++; if (ch === ']') brackets--; }
    let fixed = raw;
    for (let i = 0; i < braces; i++) fixed += '}';
    for (let i = 0; i < brackets; i++) fixed += ']';
    try { return JSON.parse(fixed); } catch { }
    throw new Error('Could not extract JSON');
}

function genUID(prefix: string, text: string): string {
    return `csat-${prefix}-${crypto.createHash('md5').update(text).digest('hex').slice(0, 12)}`;
}

// ─── Question Generator ───────────────────────────────────────────────

interface Question {
    uid: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    subject: string;      // 'maths' or 'reasoning'
    sub_topic: string;     // exact PYQ sub-topic
    passage?: string;      // for DI tables
    passage_id?: string;
}

async function generateSubtopicBatch(
    category: 'maths' | 'reasoning',
    subtopic: { id: string; name: string; prompt: string },
    count: number
): Promise<Question[]> {
    const isDI = subtopic.id === 'data_interpretation';
    
    const prompt = `
You are an expert UPSC CSAT Paper II question setter for ${category === 'maths' ? 'Basic Numeracy / Quantitative Aptitude' : 'Logical Reasoning'}.

${SAFETY}

Generate EXACTLY ${count} "${subtopic.name}" questions for UPSC CSAT.

SPECIFIC INSTRUCTIONS:
${subtopic.prompt}

REQUIREMENTS:
- Each question: 4 options (A, B, C, D). Only ONE correct answer.
- Difficulty mix: 30% easy, 50% medium, 20% hard.
- Solvable in 1-2 minutes. Class X math level (for maths questions).
- Step-by-step explanation for each answer.
${isDI ? '- For DI: Present data as text table with | separators. Generate 4 questions per table. Return each question separately with the table as "data_table" field.' : ''}

OUTPUT FORMAT (JSON array):
\`\`\`json
[
  {
    "question": "full question text",
    ${isDI ? '"data_table": "table with | separators",' : ''}
    "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...",
    "correct_answer": "A",
    "explanation": "step-by-step solution",
    "difficulty": "easy|medium|hard"
  }
]
\`\`\`

Return ONLY the JSON array of ${count} questions.`;

    const response = await callGemini(prompt);
    const parsed = extractJSON(response) as any[];

    return parsed.map((q: any) => {
        const passageText = q.data_table || '';
        const pid = passageText ? genUID('di', passageText) : undefined;
        return {
            uid: genUID(subtopic.id, q.question || ''),
            question: q.question || '',
            option_a: q.option_a || '',
            option_b: q.option_b || '',
            option_c: q.option_c || '',
            option_d: q.option_d || '',
            correct_answer: q.correct_answer?.toUpperCase()?.match(/[ABCD]/)?.[0] || 'A',
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'medium',
            subject: category,
            sub_topic: subtopic.name,
            ...(passageText ? { passage: passageText, passage_id: pid } : {}),
        };
    });
}

// ─── Main ──────────────────────────────────────────────────────────────

interface Bank {
    generatedAt: string;
    category: string;
    totalQuestions: number;
    subtopicDistribution: Record<string, number>;
    questions: Question[];
}

function loadBank(filePath: string): Bank {
    if (fs.existsSync(filePath)) {
        try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch { }
    }
    return { generatedAt: '', category: '', totalQuestions: 0, subtopicDistribution: {}, questions: [] };
}

function dedup(existing: Question[], newQs: Question[]): Question[] {
    const texts = new Set(existing.map(q => q.question.toLowerCase().trim().slice(0, 60)));
    return newQs.filter(q => !texts.has(q.question.toLowerCase().trim().slice(0, 60)));
}

async function buildCategory(category: 'maths' | 'reasoning') {
    const subtopics = category === 'maths' ? MATHS_SUBTOPICS : REASONING_SUBTOPICS;
    const bankPath = category === 'maths' ? MATHS_PATH : REASONING_PATH;
    const bank = loadBank(bankPath);

    console.log(`\n🎯 Building CSAT ${category.toUpperCase()} Bank`);
    console.log(`   📦 Existing: ${bank.totalQuestions} questions\n`);

    // Calculate how many we need per sub-topic
    const existingBySubtopic: Record<string, number> = {};
    for (const q of bank.questions) {
        existingBySubtopic[q.sub_topic] = (existingBySubtopic[q.sub_topic] || 0) + 1;
    }

    for (const st of subtopics) {
        const existing = existingBySubtopic[st.name] || 0;
        const needed = Math.max(0, st.bankTarget - existing);

        if (needed === 0) {
            console.log(`  ✅ ${st.name} — ${existing}/${st.bankTarget} (full)`);
            continue;
        }

        console.log(`  🔄 ${st.name} — ${existing}/${st.bankTarget} (need ${needed})`);

        // Generate in batches of 10
        const batchSize = Math.min(10, needed);
        const batches = Math.ceil(needed / batchSize);

        for (let b = 0; b < batches; b++) {
            const count = Math.min(batchSize, needed - b * batchSize);
            try {
                const qs = await generateSubtopicBatch(category, st, count);
                const unique = dedup(bank.questions, qs);
                bank.questions.push(...unique);
                console.log(`    📝 Generated ${unique.length}/${count} unique questions (batch ${b + 1}/${batches})`);
            } catch (err: any) {
                console.error(`    ❌ Failed: ${err.message}`);
            }
            await new Promise(r => setTimeout(r, 2500));
        }

        // Save incrementally
        bank.generatedAt = new Date().toISOString();
        bank.category = category;
        bank.totalQuestions = bank.questions.length;
        bank.subtopicDistribution = {};
        for (const q of bank.questions) {
            bank.subtopicDistribution[q.sub_topic] = (bank.subtopicDistribution[q.sub_topic] || 0) + 1;
        }
        fs.writeFileSync(bankPath, JSON.stringify(bank, null, 2));
    }

    console.log(`\n✅ ${category.toUpperCase()} Bank Complete`);
    console.log(`   📁 ${bankPath}`);
    console.log(`   📊 Total: ${bank.totalQuestions} questions`);
    console.log('   Sub-topic distribution:');
    for (const [st, count] of Object.entries(bank.subtopicDistribution).sort((a, b) => b[1] - a[1])) {
        const target = subtopics.find(s => s.name === st)?.bankTarget || 0;
        console.log(`     ${st}: ${count}/${target}`);
    }
}

async function main() {
    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not set');
        process.exit(1);
    }

    const category = process.argv[2] || 'all';

    if (category === 'maths' || category === 'all') {
        await buildCategory('maths');
    }

    if (category === 'reasoning' || category === 'all') {
        await buildCategory('reasoning');
    }

    if (category !== 'maths' && category !== 'reasoning' && category !== 'all') {
        console.error(`Unknown category: ${category}. Use: maths, reasoning, all`);
    }
}

main().catch(console.error);
