/**
 * CSAT Question Bank Generator
 * Generates high-quality UPSC CSAT questions using Gemini API
 * 
 * Usage: npx tsx scripts/generate-csat-bank.ts [category] [count]
 * 
 * Categories: comprehension, logical_reasoning, basic_numeracy, 
 *             data_interpretation, decision_making
 * 
 * Example: npx tsx scripts/generate-csat-bank.ts comprehension 10
 *          (generates 10 comprehension passages with 3-5 questions each)
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

const OUTPUT_PATH = path.join(process.cwd(), 'mock-engine', 'data', 'unified-csat-questions.json');

// ─── Content Safety Guidelines (common to all prompts) ─────────────────

const SAFETY_GUIDELINES = `
MANDATORY CONTENT GUIDELINES (STRICTLY FOLLOW):
- This is for the UPSC Civil Services Examination, a prestigious Government of India exam.
- DO NOT reference specific countries in a negative light. Use phrases like "a developing nation" or "Country X" if needed.
- DO NOT include politically sensitive, communally sensitive, or controversial content.
- DO NOT reference specific political parties, politicians, or partisan ideologies.
- DO NOT include gender-biased, caste-based, or religiously biased content.
- DO NOT reference real-world conflicts, wars, or disputed territories.
- Passages and questions should be neutral, educational, and fact-based.
- For social topics, maintain a governance-oriented perspective (policy, welfare, development).
- Use Indian context where appropriate (Indian economy, Indian geography, Indian governance).
- Avoid sensationalism — keep tone academic and analytical.
`;

// ─── Types ─────────────────────────────────────────────────────────────

interface CSATQuestion {
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
    passage?: string;
    passage_id?: string;
}

interface ComprehensionPassage {
    passage_id: string;
    passage: string;
    source_theme: string;
    questions: CSATQuestion[];
}

// ─── Gemini API Call ───────────────────────────────────────────────────

async function callGemini(prompt: string, temperature = 0.7, retries = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature,
                        maxOutputTokens: 16384,
                    },
                }),
            });

            if (!response.ok) {
                const errText = await response.text();
                if (attempt < retries && (response.status === 429 || response.status >= 500)) {
                    console.log(`    ⏳ API error ${response.status}, retrying in ${attempt * 5}s...`);
                    await new Promise(r => setTimeout(r, attempt * 5000));
                    continue;
                }
                throw new Error(`Gemini API error ${response.status}: ${errText}`);
            }

            const json = await response.json();
            return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (e: any) {
            if (attempt < retries && !e.message?.includes('Gemini API error')) {
                console.log(`    ⏳ Attempt ${attempt} failed: ${e.message}. Retrying...`);
                await new Promise(r => setTimeout(r, attempt * 3000));
                continue;
            }
            throw e;
        }
    }
    throw new Error('All retry attempts failed');
}

function extractJSON(text: string): any {
    // Clean control chars and BOM
    const cleaned = text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '').replace(/^\uFEFF/, '');

    // Try to parse the whole thing first
    try { return JSON.parse(cleaned); } catch { }

    // Find JSON block in markdown (try both ``` and ```)
    const jsonMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (jsonMatch) {
        try { return JSON.parse(jsonMatch[1]); } catch { }
        // Try fixing truncated JSON by closing brackets
        const fixedJson = fixTruncatedJSON(jsonMatch[1]);
        if (fixedJson) return fixedJson;
    }

    // Find array or object
    const bracketMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (bracketMatch) {
        try { return JSON.parse(bracketMatch[1]); } catch { }
        const fixedJson = fixTruncatedJSON(bracketMatch[1]);
        if (fixedJson) return fixedJson;
    }

    throw new Error('Could not extract JSON from response');
}

function fixTruncatedJSON(text: string): any | null {
    // Count open/close brackets to detect truncation
    let braces = 0, brackets = 0;
    for (const ch of text) {
        if (ch === '{') braces++;
        if (ch === '}') braces--;
        if (ch === '[') brackets++;
        if (ch === ']') brackets--;
    }

    // Try to close truncated JSON
    let fixed = text.trim();
    // Remove trailing comma
    fixed = fixed.replace(/,\s*$/, '');
    // Close open strings
    const quoteCount = (fixed.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) fixed += '"';
    // Close open objects and arrays
    for (let i = 0; i < braces; i++) fixed += '}';
    for (let i = 0; i < brackets; i++) fixed += ']';

    try { return JSON.parse(fixed); } catch { }
    return null;
}

function generateUID(prefix: string, text: string): string {
    const hash = crypto.createHash('md5').update(text).digest('hex').slice(0, 10);
    return `csat-gen-${prefix}-${hash}`;
}

// ─── COMPREHENSION PASSAGE GENERATOR ──────────────────────────────────

const COMPREHENSION_THEMES = [
    'Economic development and inclusive growth in India',
    'Environmental conservation and sustainable development',
    'Science and technology for societal benefit',
    'Public health and welfare policies',
    'Education reform and skill development',
    'Urbanization and smart city challenges',
    'Agricultural modernization and food security',
    'Digital governance and e-governance initiatives',
    'Water resource management and conservation',
    'Renewable energy and energy security',
    'Ethics in public administration',
    'Social justice and empowerment of vulnerable sections',
    'Disaster management and resilience',
    'Space technology and its applications',
    'Biodiversity and ecosystem services',
    'Cultural heritage preservation in modern times',
    'International trade and economic diplomacy',
    'Demographic transitions and population challenges',
    'Transport infrastructure and logistics',
    'Role of civil society in governance',
    'Financial inclusion and banking reforms',
    'Intellectual property and innovation ecosystem',
    'Mental health awareness and policy frameworks',
    'Media and information literacy in the digital age',
    'Tribal development and forest rights',
];

async function generateComprehensionBatch(batchIndex: number, count: number): Promise<ComprehensionPassage[]> {
    const themes = [];
    for (let i = 0; i < count; i++) {
        themes.push(COMPREHENSION_THEMES[(batchIndex * count + i) % COMPREHENSION_THEMES.length]);
    }

    const prompt = `
You are an expert UPSC CSAT Paper II question setter. Generate ${count} reading comprehension passages for the UPSC CSE Prelims CSAT Paper II.

${SAFETY_GUIDELINES}

PASSAGE REQUIREMENTS:
- Each passage should be 250-400 words long.
- Use sophisticated yet clear academic English.
- Cover the following themes (one per passage): ${themes.map((t, i) => `${i + 1}. "${t}"`).join(', ')}
- Each passage should present a nuanced argument or analysis — NOT just facts.
- Include elements that test: inference, author's tone/attitude, vocabulary-in-context, main idea, and logical conclusions.

QUESTION REQUIREMENTS:
- Generate EXACTLY 4 questions per passage.
- Each question MUST have exactly 4 options (A, B, C, D).
- Questions should test DIFFERENT skills: 
  Q1: Main idea / central theme
  Q2: Inference / what can be concluded
  Q3: Author's tone or attitude
  Q4: Vocabulary in context OR logical implication
- Ensure only ONE option is unambiguously correct.
- The correct answer must be defensible — avoid subjective or debatable answers.
- Distractors should be plausible but clearly wrong on careful reading.

DIFFICULTY MIX per passage:
- 1 easy, 2 medium, 1 hard

OUTPUT FORMAT (JSON array):
\`\`\`json
[
    {
        "theme": "topic name",
        "passage": "full passage text...",
        "questions": [
            {
                "question": "question text?",
                "option_a": "option text",
                "option_b": "option text",
                "option_c": "option text",
                "option_d": "option text",
                "correct_answer": "A",
                "explanation": "brief explanation of why this is correct",
                "difficulty": "easy|medium|hard",
                "skill_tested": "main_idea|inference|tone|vocabulary|implication"
            }
        ]
    }
]
\`\`\`

Generate EXACTLY ${count} passages with 4 questions each. Return ONLY the JSON array.
`;

    console.log(`  📖 Generating ${count} comprehension passages (batch ${batchIndex + 1})...`);
    const response = await callGemini(prompt, 0.75);
    const passages = extractJSON(response) as any[];

    const result: ComprehensionPassage[] = [];

    for (const p of passages) {
        const passageId = generateUID('comp', p.passage || '');
        const questions: CSATQuestion[] = (p.questions || []).map((q: any, idx: number) => ({
            uid: generateUID('comp-q', (p.passage || '') + q.question),
            question: q.question,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_answer: q.correct_answer?.toUpperCase()?.match(/[ABCD]/)?.[0] || 'A',
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'medium',
            subject: 'comprehension',
            sub_topic: q.skill_tested || 'Reading Comprehension',
            passage: p.passage,
            passage_id: passageId,
        }));

        result.push({
            passage_id: passageId,
            passage: p.passage,
            source_theme: p.theme || themes[result.length] || 'General',
            questions,
        });
    }

    return result;
}

// ─── LOGICAL REASONING GENERATOR ──────────────────────────────────────

const REASONING_SUBTYPES = [
    {
        id: 'syllogism',
        name: 'Syllogism',
        instruction: `Generate syllogism questions using "All", "Some", "No" statements.
        Format: Give 2-3 statements, then ask which conclusion(s) follow.
        Example style: "Statements: 1. All cats are animals. 2. Some animals are wild. Conclusions: I. Some cats are wild. II. All animals are cats."
        Options should be: "Only I", "Only II", "Both I and II", "Neither I nor II".`,
    },
    {
        id: 'statement_assumption',
        name: 'Statement & Assumption',
        instruction: `Generate "Statement and Assumption" questions.
        Give a statement, then two assumptions. Ask which assumption(s) is/are implicit.
        Use everyday governance/policy/social scenarios.
        Options: "Only I", "Only II", "Both I and II", "Neither I nor II".`,
    },
    {
        id: 'blood_relation',
        name: 'Blood Relation',
        instruction: `Generate blood relation puzzles.
        Use gender-neutral names or clearly gendered names. Describe relationships through a chain.
        Ask "How is X related to Y?"
        Keep chains 3-5 steps long. Use only standard family relationships.`,
    },
    {
        id: 'seating_arrangement',
        name: 'Seating Arrangement',
        instruction: `Generate linear or circular seating arrangement questions.
        Give 4-6 persons with position constraints. Ask one question about positions.
        Keep the puzzle solvable with the given constraints — avoid ambiguity.
        For linear: use "row facing north" convention. For circular: specify clockwise/anticlockwise.`,
    },
    {
        id: 'direction_sense',
        name: 'Direction Sense',
        instruction: `Generate direction sense questions.
        A person starts at point A, walks in various directions for given distances.
        Ask: "How far is the person from the starting point?" or "In which direction is the person now facing?"
        Use simple distances (km). Maximum 4-5 turns.`,
    },
    {
        id: 'coding_decoding',
        name: 'Coding & Decoding',
        instruction: `Generate letter/number coding-decoding questions.
        Pattern: "In a certain code, APPLE is written as ELPPA. How is MANGO written in that code?"
        Use clear, deterministic patterns (reversal, shift, substitution).
        Avoid obscure or arbitrary patterns.`,
    },
    {
        id: 'series_sequence',
        name: 'Series & Sequence',
        instruction: `Generate number series and letter series questions.
        Give a sequence with a pattern and ask for the next term or missing term.
        Use patterns like: arithmetic, geometric, squares, cubes, alternating operations, Fibonacci-like.
        Example: "2, 6, 18, 54, ?" → Answer: 162 (×3 each time).`,
    },
    {
        id: 'statement_conclusion',
        name: 'Statement & Conclusion',
        instruction: `Generate "Statement and Conclusion" questions.
        Give a statement about a policy, social issue, or fact. Then give two conclusions.
        Ask which conclusion(s) logically follow from the statement.
        Conclusions should test whether the student can distinguish logical deduction from assumption.`,
    },
];

async function generateReasoningBatch(subtype: typeof REASONING_SUBTYPES[0], count: number): Promise<CSATQuestion[]> {
    const prompt = `
You are an expert UPSC CSAT Paper II question setter specializing in Logical Reasoning.

${SAFETY_GUIDELINES}

Generate ${count} ${subtype.name} questions for UPSC CSAT.

SPECIFIC FORMAT:
${subtype.instruction}

REQUIREMENTS:
- Each question must have exactly 4 options (A, B, C, D).
- Only ONE answer must be unambiguously correct.
- Difficulty: ${count >= 6 ? '2 easy, ' + Math.ceil(count * 0.5) + ' medium, ' + Math.floor(count * 0.2) + ' hard' : 'mix of easy and medium'}.
- Questions must be solvable without any external knowledge.
- Do NOT reference specific people, countries, religions, or political entities.
- Use generic names like "A, B, C, D, E" or common Indian names.

OUTPUT FORMAT (JSON array):
\`\`\`json
[
    {
        "question": "full question text including statements if any",
        "option_a": "option text",
        "option_b": "option text",
        "option_c": "option text",
        "option_d": "option text",
        "correct_answer": "A",
        "explanation": "step-by-step explanation",
        "difficulty": "easy|medium|hard"
    }
]
\`\`\`

Return ONLY the JSON array of ${count} questions.
`;

    console.log(`  🧩 Generating ${count} ${subtype.name} questions...`);
    const response = await callGemini(prompt, 0.7);
    const questions = extractJSON(response) as any[];

    return questions.map((q: any) => ({
        uid: generateUID(`lr-${subtype.id}`, q.question),
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer?.toUpperCase()?.match(/[ABCD]/)?.[0] || 'A',
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        subject: 'logical_reasoning',
        sub_topic: subtype.name,
    }));
}

// ─── BASIC NUMERACY GENERATOR ─────────────────────────────────────────

const NUMERACY_SUBTYPES = [
    { id: 'percentage', name: 'Percentage', topics: 'percentage increase/decrease, successive percentages, finding original value' },
    { id: 'ratio_proportion', name: 'Ratio & Proportion', topics: 'simple ratios, compound ratios, proportional distribution' },
    { id: 'time_work', name: 'Time & Work', topics: 'individual work, combined work, work alternation, pipes and cisterns' },
    { id: 'speed_distance', name: 'Speed, Distance & Time', topics: 'relative speed, trains, boats and streams, average speed' },
    { id: 'profit_loss', name: 'Profit & Loss', topics: 'cost price, selling price, markup, discount, successive discounts' },
    { id: 'averages', name: 'Averages & Mixtures', topics: 'weighted average, mixtures, alligation' },
    { id: 'number_system', name: 'Number System', topics: 'divisibility, LCM, HCF, remainders' },
    { id: 'simple_interest', name: 'Simple & Compound Interest', topics: 'SI, CI, difference between SI and CI' },
];

async function generateNumeracyBatch(count: number): Promise<CSATQuestion[]> {
    const subtypesList = NUMERACY_SUBTYPES.map(s => `${s.name} (${s.topics})`).join('\n- ');

    const prompt = `
You are an expert UPSC CSAT Paper II question setter specializing in Basic Numeracy / Quantitative Aptitude.

${SAFETY_GUIDELINES}

Generate ${count} basic numeracy questions for UPSC CSAT, distributed across these sub-topics:
- ${subtypesList}

REQUIREMENTS:
- Generate approximately equal questions across the sub-topics.
- Each question must have exactly 4 options (A, B, C, D).
- Questions should be solvable in 1-2 minutes with mental math or simple calculation.
- Do NOT require complex formulas — UPSC CSAT tests aptitude, not advanced math.
- Use real-world contexts: market purchases, travel, work scenarios, budget allocation, etc.
- Do NOT reference specific brands, companies, or people.
- Difficulty: 30% easy, 50% medium, 20% hard.
- Hard questions should require 2-3 step reasoning, not complex computation.

OUTPUT FORMAT (JSON array):
\`\`\`json
[
    {
        "question": "question text",
        "option_a": "option text",
        "option_b": "option text", 
        "option_c": "option text",
        "option_d": "option text",
        "correct_answer": "A",
        "explanation": "step-by-step solution",
        "difficulty": "easy|medium|hard",
        "sub_topic": "Percentage|Ratio & Proportion|Time & Work|Speed, Distance & Time|Profit & Loss|Averages & Mixtures|Number System|Simple & Compound Interest"
    }
]
\`\`\`

Return ONLY the JSON array of ${count} questions.
`;

    console.log(`  🔢 Generating ${count} numeracy questions...`);
    const response = await callGemini(prompt, 0.6);
    const questions = extractJSON(response) as any[];

    return questions.map((q: any) => ({
        uid: generateUID('num', q.question),
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer?.toUpperCase()?.match(/[ABCD]/)?.[0] || 'A',
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        subject: 'basic_numeracy',
        sub_topic: q.sub_topic || 'General Numeracy',
    }));
}

// ─── DATA INTERPRETATION GENERATOR ────────────────────────────────────

async function generateDIBatch(count: number): Promise<{ passage: string; passage_id: string; questions: CSATQuestion[] }[]> {
    const prompt = `
You are an expert UPSC CSAT Paper II question setter specializing in Data Interpretation.

${SAFETY_GUIDELINES}

Generate ${count} data interpretation sets for UPSC CSAT, each with a data table and 4 questions.

DATA SET REQUIREMENTS:
- Present data as a TEXT TABLE (since this is MCQ format, no images).
- Types: production data, population data, budget allocation, survey results, agricultural output, export-import data, state-wise comparison.
- Each table should have 4-6 rows and 3-5 columns.
- Use Indian context where natural (states, sectors, years).
- Do NOT use real data — create realistic hypothetical data.
- Ensure all calculations are exact (no approximation needed).

QUESTION REQUIREMENTS:
- 4 questions per data set.
- Test: reading values, calculating percentage/ratio, finding maximum/minimum, comparison.
- Each must have exactly 4 options (A, B, C, D).
- Difficulty: 1 easy (direct reading), 2 medium (one calculation), 1 hard (multi-step).

OUTPUT FORMAT (JSON array):
\`\`\`json
[
    {
        "data_description": "brief description of what the table shows",
        "data_table": "formatted text table with headers and values, using | separators",
        "questions": [
            {
                "question": "question text",
                "option_a": "value",
                "option_b": "value",
                "option_c": "value",
                "option_d": "value",
                "correct_answer": "B",
                "explanation": "calculation steps",
                "difficulty": "easy|medium|hard"
            }
        ]
    }
]
\`\`\`

Return ONLY the JSON array of ${count} data sets.
`;

    console.log(`  📊 Generating ${count} data interpretation sets...`);
    const response = await callGemini(prompt, 0.6);
    const sets = extractJSON(response) as any[];

    return sets.map((s: any) => {
        const passageText = `${s.data_description}\n\n${s.data_table}`;
        const passageId = generateUID('di', passageText);

        return {
            passage: passageText,
            passage_id: passageId,
            questions: (s.questions || []).map((q: any, idx: number) => ({
                uid: generateUID(`di-q`, passageText + q.question),
                question: q.question,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_answer: q.correct_answer?.toUpperCase()?.match(/[ABCD]/)?.[0] || 'A',
                explanation: q.explanation || '',
                difficulty: q.difficulty || 'medium',
                subject: 'data_interpretation',
                sub_topic: 'Data Interpretation',
                passage: passageText,
                passage_id: passageId,
            })),
        };
    });
}

// ─── DECISION MAKING GENERATOR ────────────────────────────────────────

async function generateDecisionMakingBatch(count: number): Promise<CSATQuestion[]> {
    const prompt = `
You are an expert UPSC CSAT Paper II question setter specializing in Decision Making and Problem Solving.

${SAFETY_GUIDELINES}

Generate ${count} decision-making questions for UPSC CSAT.

SCENARIO TYPES:
- Administrative decisions: A District Collector faces a situation...
- Ethical dilemmas: A government officer discovers...
- Crisis management: During a natural disaster, an officer must...
- Resource allocation: With limited budget, a department head must prioritize...
- Conflicting duties: An official must balance transparency vs. confidentiality...

REQUIREMENTS:
- Each scenario should be 3-5 sentences long.
- Present a realistic governance/administrative situation.
- 4 options representing different courses of action.
- The correct answer should reflect good governance principles: transparency, accountability, empathy, rule of law, public interest, due process.
- AVOID options that are clearly absurd — all options should be plausible.
- The correct answer should be the MOST appropriate, not just acceptable.
- Do NOT use real names or real incidents.
- Difficulty: 30% easy (clear right answer), 50% medium (requires weighing options), 20% hard (close options).

OUTPUT FORMAT (JSON array):
\`\`\`json
[
    {
        "question": "Full scenario followed by: What should the officer do?",
        "option_a": "course of action A",
        "option_b": "course of action B",
        "option_c": "course of action C",
        "option_d": "course of action D",
        "correct_answer": "C",
        "explanation": "why this is the best course of action based on governance principles",
        "difficulty": "easy|medium|hard"
    }
]
\`\`\`

Return ONLY the JSON array of ${count} questions.
`;

    console.log(`  🤔 Generating ${count} decision-making questions...`);
    const response = await callGemini(prompt, 0.7);
    const questions = extractJSON(response) as any[];

    return questions.map((q: any) => ({
        uid: generateUID('dm', q.question),
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer?.toUpperCase()?.match(/[ABCD]/)?.[0] || 'A',
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        subject: 'decision_making',
        sub_topic: 'Decision Making',
    }));
}

// ─── VALIDATION PASS ──────────────────────────────────────────────────

async function validateBatch(questions: CSATQuestion[]): Promise<CSATQuestion[]> {
    if (questions.length === 0) return [];

    // Sample up to 10 for validation (API cost management)
    const sample = questions.slice(0, Math.min(10, questions.length));

    const prompt = `
You are a UPSC CSAT quality reviewer. Review each question below and for each:
1. Verify the correct answer is actually correct
2. Check if the question is clearly worded
3. Flag if it violates content guidelines (controversial, politically sensitive, biased)

Questions to review:
${sample.map((q, i) => `
Q${i + 1}: ${q.question}
A: ${q.option_a}  B: ${q.option_b}  C: ${q.option_c}  D: ${q.option_d}
Marked correct: ${q.correct_answer}
`).join('\n')}

Return a JSON array with one entry per question:
\`\`\`json
[
    {
        "question_index": 0,
        "answer_correct": true,
        "actual_correct_answer": "A",
        "quality_score": 8,
        "issues": "none" 
    }
]
\`\`\`

quality_score: 1-10 (10 = perfect UPSC standard). Flag any question scoring below 6.
Return ONLY the JSON array.
`;

    try {
        console.log(`  ✅ Validating ${sample.length} questions...`);
        const response = await callGemini(prompt, 0.2);
        const reviews = extractJSON(response) as any[];

        let corrected = 0;
        let flagged = 0;

        for (const review of reviews) {
            const idx = review.question_index;
            if (idx >= 0 && idx < sample.length) {
                // Fix wrong answers
                if (!review.answer_correct && review.actual_correct_answer) {
                    const match = review.actual_correct_answer.toUpperCase().match(/[ABCD]/);
                    if (match) {
                        questions[idx].correct_answer = match[0];
                        corrected++;
                    }
                }
                // Flag low quality
                if (review.quality_score < 6) {
                    flagged++;
                    console.log(`    ⚠️  Q${idx + 1} flagged (score=${review.quality_score}): ${review.issues}`);
                }
            }
        }

        if (corrected > 0) console.log(`    🔧 Corrected ${corrected} answer(s)`);
        if (flagged > 0) console.log(`    ⚠️  ${flagged} question(s) flagged for review`);

    } catch (e) {
        console.log(`    ⚠️  Validation skipped (API error)`);
    }

    return questions;
}

// ─── MAIN ORCHESTRATOR ────────────────────────────────────────────────

async function loadExistingBank(): Promise<{ questions: CSATQuestion[]; passages: ComprehensionPassage[] }> {
    if (fs.existsSync(OUTPUT_PATH)) {
        const data = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
        return {
            questions: data.questions || [],
            passages: data.passages || [],
        };
    }
    return { questions: [], passages: [] };
}

function deduplicateQuestions(existing: CSATQuestion[], newQs: CSATQuestion[]): CSATQuestion[] {
    const existingTexts = new Set(existing.map(q => q.question.toLowerCase().trim().slice(0, 60)));
    return newQs.filter(q => !existingTexts.has(q.question.toLowerCase().trim().slice(0, 60)));
}

async function generateAll(category: string, count: number) {
    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not set. Add it to .env.local');
        process.exit(1);
    }

    console.log('\n🎯 CSAT Question Bank Generator');
    console.log(`   Category: ${category}`);
    console.log(`   Target count: ${count}`);
    console.log(`   Model: ${GEMINI_MODEL}\n`);

    const existing = await loadExistingBank();
    console.log(`   📦 Existing bank: ${existing.questions.length} questions, ${existing.passages.length} passages\n`);

    let newQuestions: CSATQuestion[] = [];
    let newPassages: ComprehensionPassage[] = [];

    try {
        switch (category) {
            case 'comprehension': {
                // Generate passages in batches of 5
                const batches = Math.ceil(count / 5);
                for (let i = 0; i < batches; i++) {
                    const batchCount = Math.min(5, count - i * 5);
                    const passages = await generateComprehensionBatch(i, batchCount);
                    newPassages.push(...passages);
                    for (const p of passages) {
                        newQuestions.push(...p.questions);
                    }
                    if (i < batches - 1) {
                        console.log(`  ⏳ Waiting 3s before next batch...`);
                        await new Promise(r => setTimeout(r, 3000));
                    }
                }
                break;
            }

            case 'logical_reasoning': {
                // Generate each sub-type
                const perSubtype = Math.ceil(count / REASONING_SUBTYPES.length);
                for (const subtype of REASONING_SUBTYPES) {
                    const qs = await generateReasoningBatch(subtype, Math.min(perSubtype, 15));
                    newQuestions.push(...qs);
                    await new Promise(r => setTimeout(r, 2000));
                }
                break;
            }

            case 'basic_numeracy': {
                // Generate in batches of 20
                const batches = Math.ceil(count / 20);
                for (let i = 0; i < batches; i++) {
                    const batchCount = Math.min(20, count - i * 20);
                    const qs = await generateNumeracyBatch(batchCount);
                    newQuestions.push(...qs);
                    if (i < batches - 1) await new Promise(r => setTimeout(r, 2000));
                }
                break;
            }

            case 'data_interpretation': {
                // count = number of data sets (each has 4 questions)
                const batches = Math.ceil(count / 5);
                for (let i = 0; i < batches; i++) {
                    const batchCount = Math.min(5, count - i * 5);
                    const sets = await generateDIBatch(batchCount);
                    for (const s of sets) {
                        newPassages.push({
                            passage_id: s.passage_id,
                            passage: s.passage,
                            source_theme: 'Data Interpretation',
                            questions: s.questions,
                        });
                        newQuestions.push(...s.questions);
                    }
                    if (i < batches - 1) await new Promise(r => setTimeout(r, 2000));
                }
                break;
            }

            case 'decision_making': {
                const batches = Math.ceil(count / 15);
                for (let i = 0; i < batches; i++) {
                    const batchCount = Math.min(15, count - i * 15);
                    const qs = await generateDecisionMakingBatch(batchCount);
                    newQuestions.push(...qs);
                    if (i < batches - 1) await new Promise(r => setTimeout(r, 2000));
                }
                break;
            }

            case 'all': {
                console.log('📦 Generating ALL categories...\n');

                // Helper to wrap each category with error handling
                async function safeRun(label: string, fn: () => Promise<void>) {
                    try {
                        await fn();
                    } catch (err: any) {
                        console.error(`  ❌ ${label} failed: ${err.message}`);
                        console.log(`  ⏭️  Continuing with next category...\n`);
                    }
                }

                // 1. Comprehension — 15 passages (60 questions)
                await safeRun('Comprehension', async () => {
                    console.log('══ COMPREHENSION (15 passages, ~60 Qs) ══');
                    for (let i = 0; i < 3; i++) {
                        const passages = await generateComprehensionBatch(i, 5);
                        newPassages.push(...passages);
                        for (const p of passages) newQuestions.push(...p.questions);
                        await new Promise(r => setTimeout(r, 3000));
                    }
                });

                // 2. Logical Reasoning — 8 sub-types × 8 = 64 questions
                await safeRun('Logical Reasoning', async () => {
                    console.log('\n══ LOGICAL REASONING (8 sub-types × 8 Qs) ══');
                    for (const subtype of REASONING_SUBTYPES) {
                        try {
                            const qs = await generateReasoningBatch(subtype, 8);
                            newQuestions.push(...qs);
                        } catch (e: any) {
                            console.error(`  ⚠️  ${subtype.name} failed: ${e.message}`);
                        }
                        await new Promise(r => setTimeout(r, 2000));
                    }
                });

                // 3. Basic Numeracy — 40 questions
                await safeRun('Basic Numeracy', async () => {
                    console.log('\n══ BASIC NUMERACY (40 Qs) ══');
                    const numQs = await generateNumeracyBatch(20);
                    newQuestions.push(...numQs);
                    await new Promise(r => setTimeout(r, 2000));
                    const numQs2 = await generateNumeracyBatch(20);
                    newQuestions.push(...numQs2);
                });

                // 4. Data Interpretation — 8 sets (32 questions)
                await safeRun('Data Interpretation', async () => {
                    console.log('\n══ DATA INTERPRETATION (8 sets × 4 Qs) ══');
                    await new Promise(r => setTimeout(r, 3000));
                    for (let i = 0; i < 2; i++) {
                        const sets = await generateDIBatch(4);
                        for (const s of sets) {
                            newPassages.push({
                                passage_id: s.passage_id, passage: s.passage,
                                source_theme: 'Data Interpretation', questions: s.questions,
                            });
                            newQuestions.push(...s.questions);
                        }
                        if (i < 1) await new Promise(r => setTimeout(r, 2000));
                    }
                });

                // 5. Decision Making — 30 questions
                await safeRun('Decision Making', async () => {
                    console.log('\n══ DECISION MAKING (30 Qs) ══');
                    await new Promise(r => setTimeout(r, 2000));
                    const dmQs = await generateDecisionMakingBatch(15);
                    newQuestions.push(...dmQs);
                    await new Promise(r => setTimeout(r, 2000));
                    const dmQs2 = await generateDecisionMakingBatch(15);
                    newQuestions.push(...dmQs2);
                });

                break;
            }

            default:
                console.error(`❌ Unknown category: ${category}`);
                console.log('   Valid: comprehension, logical_reasoning, basic_numeracy, data_interpretation, decision_making, all');
                process.exit(1);
        }
    } catch (err: any) {
        console.error(`\n❌ Generation error: ${err.message}`);
        if (newQuestions.length > 0) {
            console.log(`   Saving ${newQuestions.length} questions generated so far...`);
        } else {
            process.exit(1);
        }
    }

    // Validate
    if (newQuestions.length > 0) {
        console.log(`\n── Validation Pass ──`);
        newQuestions = await validateBatch(newQuestions);
    }

    // Deduplicate against existing
    const uniqueNew = deduplicateQuestions(existing.questions, newQuestions);
    console.log(`\n   New unique questions: ${uniqueNew.length} (${newQuestions.length - uniqueNew.length} duplicates removed)`);

    // Merge and save
    const allQuestions = [...existing.questions, ...uniqueNew];
    const allPassages = [...existing.passages, ...newPassages];

    // Build subject distribution
    const subjectCounts: Record<string, number> = {};
    for (const q of allQuestions) {
        subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
    }

    const output = {
        paper: 'csat',
        generatedAt: new Date().toISOString(),
        totalQuestions: allQuestions.length,
        totalPassages: allPassages.length,
        subjectDistribution: subjectCounts,
        passages: allPassages,
        questions: allQuestions,
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

    console.log(`\n✅ CSAT Question Bank Updated`);
    console.log(`   📁 ${OUTPUT_PATH}`);
    console.log(`   📊 Total questions: ${allQuestions.length}`);
    console.log(`   📖 Total passages: ${allPassages.length}`);
    console.log('\n   Subject Distribution:');
    for (const [s, c] of Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`     ${s}: ${c}`);
    }
}

// ─── CLI ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const category = args[0] || 'all';
const count = parseInt(args[1] || '0') || (category === 'all' ? 0 : category === 'comprehension' ? 15 : category === 'data_interpretation' ? 8 : 30);

generateAll(category, count).catch(console.error);
