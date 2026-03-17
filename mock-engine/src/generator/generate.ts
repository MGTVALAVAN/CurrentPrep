// ============================================================
// Question Generator — AI-Powered UPSC MCQ Generation
// Uses Gemini AI to generate high-quality UPSC-pattern questions
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  Subject,
  GeneratedQuestion,
  GenerationBatch,
  GenerationResult,
} from '../types/index.js';
import {
  SUBJECTS,
  buildSubjectBatches,
  getSubject,
  printSubjectSummary,
} from '../data/subjects.js';

// Load environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ============================================================
// Current Affairs Context (Apr 2025 – Mar 2026 news window)
// Topics/events that were in the news — UPSC Prelims 2026 will
// test factual knowledge about these because they were recently
// newsworthy due to anniversaries, centenaries, jubilees, etc.
// ============================================================

const HISTORY_CURRENT_AFFAIRS_CONTEXT = `
IMPORTANT CURRENT AFFAIRS LINKAGE FOR UPSC PRELIMS 2026:
The UPSC Prelims exam (June 2026) covers current affairs from approximately April 2025 to March 2026.
Historical topics that were in the news during this period due to anniversaries get asked as factual questions.
Weave in 15-20% of questions on topics linked to these recent news events:

KEY ANNIVERSARIES IN THE NEWS (Apr 2025 – Mar 2026):
- June 2025: 50th anniversary of the National Emergency (1975) — questions on Emergency provisions, 42nd Amendment, fundamental rights suspension, press censorship, Shah Commission
- Aug 2025: 78th Independence Day — Partition, transfer of power, Mountbatten Plan, Indian Independence Act 1947
- Jan 2026: 77th Republic Day — Constitution adoption, Constituent Assembly debates, Dr. Ambedkar's role
- 2025-26: 75th anniversary of First General Elections (1951-52) — universal adult franchise, Election Commission, Sukumar Sen
- 2025-26: 100th anniversary of events from 1925-1926 — formation of RSS (1925), Kakori Conspiracy (1925), labour movements, revolutionary activities
- 2025-26: Birth/death centenaries of notable freedom fighters and leaders born/died in 1925-1926
- 2025-26: 150th anniversary of events from 1875-1876 — Arya Samaj (1875), Aligarh Movement, Deccan Riots (1875)
- 2025: 80th anniversary of the end of World War II (1945) and its impact on Indian freedom movement (INA trials, RIN Mutiny 1946)

DO NOT explicitly mention "anniversary" or "centenary" in the question text.
Instead, simply ask factual questions about these topics — UPSC does this to test whether aspirants read the news AND know the underlying history.
`;

const ART_CULTURE_CURRENT_AFFAIRS_CONTEXT = `
IMPORTANT CURRENT AFFAIRS LINKAGE FOR UPSC PRELIMS 2026:
The UPSC Prelims exam (June 2026) covers current affairs from approximately April 2025 to March 2026.
Art & Culture topics that were in the news during this period get asked as factual questions.
Weave in 10-15% of questions on topics linked to these recent news events:

KEY CULTURAL NEWS (Apr 2025 – Mar 2026):
- UNESCO World Heritage Sites: Any new Indian sites inscribed in 2025 WHC session (46th session). Ask factual questions about the site's historical and cultural significance.
- GI Tags: New Geographical Indication tags awarded in 2025-26 to Indian products. Ask about the craft, state, and tradition behind the product.
- Padma Awards 2026: Artists, musicians, dancers awarded Padma Shri/Bhushan in Republic Day 2026 honors. Ask about their art form, style, and contribution.
- UNESCO Intangible Cultural Heritage: Any new Indian traditions inscribed on the ICH list in 2025.
- Kumbh Mela 2025 (Prayagraj): Factual questions about Kumbh — history, significance, locations, rotation cycle.
- Classical language declarations: Any new languages granted classical status.
- Cultural festivals and events making national/international news.
- Birth/death centenaries of notable artists, musicians, writers born/died in 1925-1926 or 1875-1876.

IMPORTANT TOPICS WITH HIGH UPSC PROBABILITY:
- Temple architecture styles (Nagara vs Dravida vs Vesara) — perennial favorite
- Classical dances and their state/origin — at least 2-3 questions every year
- GI-tagged products — UPSC has been asking 3-5 GI tag questions since 2020
- UNESCO World Heritage Sites in India (42 cultural + natural sites)
- Folk paintings — Madhubani, Warli, Pattachitra, Kalamkari — trending topic

DO NOT explicitly mention "in the news" or "recently" in the question text.
Simply ask factual questions about these topics.
`;

const GEOGRAPHY_CURRENT_AFFAIRS_CONTEXT = `
IMPORTANT CURRENT AFFAIRS LINKAGE FOR UPSC PRELIMS 2026:
The UPSC Prelims exam (June 2026) covers current affairs from approximately April 2025 to March 2026.
Geography topics that were in the news during this period get asked as factual questions.
Weave in 10-15% of questions on topics linked to these recent news events:

KEY GEOGRAPHY NEWS (Apr 2025 – Mar 2026):
- Wayanad landslides (2024-25): Questions on Western Ghats geology, laterite soils, landslide-prone zones
- Joshimath subsidence aftermath: Himalayan geology, glacial Lake Outburst Floods (GLOFs), Uttarakhand terrain
- El Niño / La Niña cycle: Questions on ENSO, Indian Ocean Dipole (IOD), monsoon dynamics
- Flood events in Assam/Bihar: Brahmaputra river system, flood-plain management
- India's critical mineral policy: Lithium reserves in J&K, rare earth minerals
- Ken-Betwa river linking project: Inter-basin transfer, river systems
- Glacial retreat in Himalayas: Climate impact on glaciers, downstream effects
- Earthquake events: Seismic zones in India, plate tectonics
- Cyclones (Bay of Bengal/Arabian Sea): Tropical cyclone naming, formation, IMD warnings
- New National Parks / Tiger Reserves announced

IMPORTANT TOPICS WITH HIGH UPSC PROBABILITY:
- Indian monsoon mechanism — perennial UPSC favorite
- River systems (Himalayan vs Peninsular) — 3-5 Qs every year
- Soil types and distribution — frequently tested
- National Parks, Wildlife Sanctuaries — always asked (often with location mapping)
- Ocean currents and their climate effects
- Earthquake zones and vulnerability mapping

DO NOT explicitly mention "in the news" or "recently" in the question text.
Simply ask factual questions about these topics.
`;

// ============================================================
// Prompt Builder
// ============================================================

function buildPrompt(batch: GenerationBatch): string {
  // Add subject-specific current affairs context
  const contextMap: Record<string, string> = {
    'history': HISTORY_CURRENT_AFFAIRS_CONTEXT,
    'art_culture': ART_CULTURE_CURRENT_AFFAIRS_CONTEXT,
    'geography': GEOGRAPHY_CURRENT_AFFAIRS_CONTEXT,
  };
  const currentAffairsContext = contextMap[batch.subject] || '';

  return `You are a senior UPSC Civil Services Preliminary Examination question setter with 20 years of experience.

Generate exactly ${batch.count} unique MCQ questions for:
- Subject: ${getSubject(batch.subject)?.label || batch.subject}
- Sub-topic: ${batch.sub_topic_label}
- Difficulty ratio 3:4:3 → ${batch.difficulty_mix.easy} easy, ${batch.difficulty_mix.medium} medium, ${batch.difficulty_mix.hard} hard
${currentAffairsContext}
STRICT RULES — follow these exactly:
1. Each question has exactly 4 options (A, B, C, D) with ONE correct answer
2. All options must be plausible — no obviously absurd choices
3. Question patterns to use (mix these across the batch):
   - "Consider the following statements" → 30% of questions
   - Direct factual questions → 30% of questions
   - "Which of the following is/are correct?" → 15% of questions
   - "Match the following / Correctly matched pairs" → 10% of questions
   - Chronological ordering / sequence questions → 10% of questions
   - "Which is NOT correct?" (negative) → 5% of questions
4. For "statements" type questions, ALWAYS include the statements in the question text itself:
   "Consider the following statements:
   1. Statement one
   2. Statement two
   3. Statement three
   Which of the above statements is/are correct?"
   Options: "A) 1 only  B) 1 and 2 only  C) 2 and 3 only  D) 1, 2 and 3"
5. For matching questions, use format:
   "Match List I with List II and select the correct answer:
   List I: A. Item1  B. Item2  C. Item3
   List II: 1. Match1  2. Match2  3. Match3"
6. Include a clear 2-4 line explanation for WHY the correct answer is right
7. Reference NCERT or standard textbook facts where applicable
8. Questions must test UNDERSTANDING and APPLICATION, not just rote memory
9. Avoid controversial, opinion-based, or outdated questions
10. Difficulty levels:
    - Easy: Direct recall from NCERT, straightforward facts
    - Medium: Requires connecting two concepts, deeper understanding, or subtle distinctions
    - Hard: Requires analysis, comparison across periods/topics, elimination logic, or expert-level knowledge
11. Facts must be accurate as of 2026
12. Ensure NO duplicate questions within this batch — each question must test a DIFFERENT fact or concept

Return ONLY a valid JSON array with this exact structure — no markdown, no code blocks, just raw JSON:
[
  {
    "question": "Full question text here (include statements/lists INSIDE the question text)",
    "option_a": "Option A text",
    "option_b": "Option B text",
    "option_c": "Option C text",
    "option_d": "Option D text",
    "correct_answer": "B",
    "explanation": "Explanation text here",
    "difficulty": "medium",
    "sub_topic": "${batch.sub_topic}"
  }
]

Generate exactly ${batch.count} questions. Do not include any text outside the JSON array.`;
}

// ============================================================
// AI Generation
// ============================================================

async function generateBatch(batch: GenerationBatch): Promise<GenerationResult> {
  const prompt = buildPrompt(batch);

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON from response (handle potential markdown fencing)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const questions: GeneratedQuestion[] = JSON.parse(jsonText);

    // Validate each question
    const valid: GeneratedQuestion[] = [];
    const errors: string[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qErrors = validateQuestion(q, i + 1);
      if (qErrors.length === 0) {
        valid.push(q);
      } else {
        errors.push(...qErrors);
      }
    }

    return {
      batch,
      questions: valid,
      valid_count: valid.length,
      invalid_count: questions.length - valid.length,
      errors,
      generated_at: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      batch,
      questions: [],
      valid_count: 0,
      invalid_count: 0,
      errors: [`API Error: ${error.message}`],
      generated_at: new Date().toISOString(),
    };
  }
}

// ============================================================
// Validation
// ============================================================

function validateQuestion(q: GeneratedQuestion, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Q${index}`;

  if (!q.question || q.question.trim().length < 20) {
    errors.push(`${prefix}: Question text too short or missing`);
  }
  if (!q.option_a || q.option_a.trim().length === 0) {
    errors.push(`${prefix}: Option A missing`);
  }
  if (!q.option_b || q.option_b.trim().length === 0) {
    errors.push(`${prefix}: Option B missing`);
  }
  if (!q.option_c || q.option_c.trim().length === 0) {
    errors.push(`${prefix}: Option C missing`);
  }
  if (!q.option_d || q.option_d.trim().length === 0) {
    errors.push(`${prefix}: Option D missing`);
  }
  if (!['A', 'B', 'C', 'D'].includes(q.correct_answer?.toUpperCase())) {
    errors.push(`${prefix}: Invalid correct_answer: "${q.correct_answer}"`);
  }
  if (!q.explanation || q.explanation.trim().length < 10) {
    errors.push(`${prefix}: Explanation too short or missing`);
  }
  if (!['easy', 'medium', 'hard'].includes(q.difficulty?.toLowerCase())) {
    errors.push(`${prefix}: Invalid difficulty: "${q.difficulty}"`);
  }
  if (!q.sub_topic || q.sub_topic.trim().length === 0) {
    errors.push(`${prefix}: Sub-topic missing`);
  }

  return errors;
}

// ============================================================
// File Storage
// ============================================================

function saveResult(result: GenerationResult, outputDir: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${result.batch.subject}_${result.batch.sub_topic}_${timestamp}.json`;
  const filepath = path.join(outputDir, filename);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2));

  return filepath;
}

// ============================================================
// Main Entry Point
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const isPilot = args.includes('--pilot');
  const subjectArg = args.find(a => !a.startsWith('--'));

  console.log('\n🧠 UPSC Mock Test — Question Generator');
  console.log('═'.repeat(50));

  if (isPilot) {
    console.log('🧪 PILOT MODE — generating a small sample batch\n');
    await runPilot();
    return;
  }

  if (subjectArg) {
    console.log(`📚 Generating for subject: ${subjectArg}\n`);
    await runForSubject(subjectArg as Subject);
    return;
  }

  // No args — show summary and usage
  printSubjectSummary();
  console.log('\n📌 Usage:');
  console.log('  npm run generate:pilot       — Generate 25 sample questions (History: Ancient India)');
  console.log('  npm run generate -- history   — Generate all History questions');
  console.log('  npm run generate              — Show this summary');
  console.log('');
}

/** Run a quick pilot: 25 questions from History - Ancient India */
async function runPilot() {
  const batch: GenerationBatch = {
    subject: 'history',
    sub_topic: 'hist-ancient',
    sub_topic_label: 'Ancient India — Indus Valley Civilization to Gupta Period',
    count: 25,
    difficulty_mix: { easy: 8, medium: 12, hard: 5 },
  };

  console.log(`📝 Generating ${batch.count} questions...`);
  console.log(`   Subject: History`);
  console.log(`   Sub-topic: ${batch.sub_topic_label}`);
  console.log(`   Mix: ${batch.difficulty_mix.easy} easy, ${batch.difficulty_mix.medium} medium, ${batch.difficulty_mix.hard} hard`);
  console.log('');

  const startTime = Date.now();
  const result = await generateBatch(batch);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Save to data/generated
  const outputDir = path.resolve(__dirname, '../../data/generated');
  const filepath = saveResult(result, outputDir);

  // Print summary
  console.log(`✅ Generated ${result.valid_count} valid questions in ${elapsed}s`);
  if (result.invalid_count > 0) {
    console.log(`⚠️  ${result.invalid_count} questions failed validation`);
  }
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(e => console.log(`   ${e}`));
  }
  console.log(`\n💾 Saved to: ${filepath}`);

  // Print sample question
  if (result.questions.length > 0) {
    const sample = result.questions[0];
    console.log('\n📋 Sample Question:');
    console.log('─'.repeat(50));
    console.log(`Q: ${sample.question}`);
    console.log(`A) ${sample.option_a}`);
    console.log(`B) ${sample.option_b}`);
    console.log(`C) ${sample.option_c}`);
    console.log(`D) ${sample.option_d}`);
    console.log(`✅ Answer: ${sample.correct_answer}`);
    console.log(`📖 ${sample.explanation}`);
    console.log(`⚡ Difficulty: ${sample.difficulty}`);
    console.log('─'.repeat(50));
  }
}

/** Generate all questions for a given subject */
async function runForSubject(subject: Subject) {
  const subjectDef = getSubject(subject);
  if (!subjectDef) {
    console.error(`❌ Unknown subject: "${subject}"`);
    console.log(`   Valid subjects: ${SUBJECTS.map(s => s.id).join(', ')}`);
    process.exit(1);
  }

  const batches = buildSubjectBatches(subject);
  console.log(`📚 ${subjectDef.label} — ${batches.length} batches to generate`);
  console.log(`   Sub-topics: ${subjectDef.sub_topics.map(st => st.label).join(', ')}`);

  const outputDir = path.resolve(__dirname, '../../data/generated');
  let totalValid = 0;
  let totalInvalid = 0;
  let totalErrors: string[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\n[${i + 1}/${batches.length}] Generating ${batch.count} Qs for ${batch.sub_topic_label}...`);

    const result = await generateBatch(batch);
    saveResult(result, outputDir);

    totalValid += result.valid_count;
    totalInvalid += result.invalid_count;
    totalErrors.push(...result.errors);

    console.log(`   ✅ ${result.valid_count} valid | ⚠️ ${result.invalid_count} invalid`);

    // Rate limiting — wait 2 seconds between batches to respect Gemini limits
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`📊 ${subjectDef.label} Generation Complete`);
  console.log(`   ✅ Valid: ${totalValid}`);
  console.log(`   ⚠️  Invalid: ${totalInvalid}`);
  console.log(`   ❌ Errors: ${totalErrors.length}`);
  console.log(`   💾 Saved to: ${outputDir}`);
  console.log('═'.repeat(50));
}

// Run
main().catch(console.error);
