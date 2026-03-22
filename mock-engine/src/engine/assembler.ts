// ============================================================
// Mock Test Assembler
// Reads generated questions → deduplicates → assembles into
// proper mock papers with correct sub-topic & difficulty distribution
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GenerationResult, GeneratedQuestion, Difficulty, Subject } from '../types/index.js';
import { SUBJECTS, getSubject, SubjectDef } from '../data/subjects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// Types
// ============================================================

interface IndexedQuestion extends GeneratedQuestion {
  id: string;        // unique ID for this question
  source_file: string;
}

interface AssembledMock {
  mock_id: string;
  title: string;
  subject: Subject;
  test_type: 'subject_wise';
  sequence_number: number;
  total_questions: number;
  duration_minutes: number;
  marks_per_correct: number;
  negative_marks: number;
  difficulty_summary: { easy: number; medium: number; hard: number };
  sub_topic_summary: Record<string, number>;
  questions: IndexedQuestion[];
  created_at: string;
}

// ============================================================
// Step 1: Load All Questions
// ============================================================

function loadAllQuestions(generatedDir: string): { questions: IndexedQuestion[]; fileCount: number } {
  const files = fs.readdirSync(generatedDir).filter(f => f.endsWith('.json'));
  const allQuestions: IndexedQuestion[] = [];
  let qIndex = 0;

  for (const file of files) {
    const filepath = path.join(generatedDir, file);
    const data: GenerationResult = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    for (const q of data.questions) {
      qIndex++;
      allQuestions.push({
        ...q,
        id: `Q${String(qIndex).padStart(4, '0')}`,
        source_file: file,
      });
    }
  }

  return { questions: allQuestions, fileCount: files.length };
}

// ============================================================
// Step 2: Deduplicate
// ============================================================

function fingerprint(q: GeneratedQuestion): string {
  return q.question
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 120);
}

function deduplicate(questions: IndexedQuestion[]): { unique: IndexedQuestion[]; removed: number } {
  const seen = new Map<string, IndexedQuestion>();
  let removed = 0;

  for (const q of questions) {
    const fp = fingerprint(q);
    if (!seen.has(fp)) {
      seen.set(fp, q);
    } else {
      removed++;
    }
  }

  return { unique: Array.from(seen.values()), removed };
}

// ============================================================
// Step 3: Group by Sub-Topic & Difficulty
// ============================================================

interface QuestionPool {
  [subTopic: string]: {
    easy: IndexedQuestion[];
    medium: IndexedQuestion[];
    hard: IndexedQuestion[];
  };
}

function buildPool(questions: IndexedQuestion[]): QuestionPool {
  const pool: QuestionPool = {};

  for (const q of questions) {
    const st = q.sub_topic;
    const diff = (q.difficulty?.toLowerCase() || 'medium') as Difficulty;

    if (!pool[st]) {
      pool[st] = { easy: [], medium: [], hard: [] };
    }

    pool[st][diff].push(q);
  }

  // Shuffle each group for randomness
  for (const st of Object.keys(pool)) {
    pool[st].easy = shuffle(pool[st].easy);
    pool[st].medium = shuffle(pool[st].medium);
    pool[st].hard = shuffle(pool[st].hard);
  }

  return pool;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================
// Step 4: Assemble Mocks
// ============================================================

function assembleMocks(
  pool: QuestionPool,
  subjectDef: SubjectDef,
  numMocks: number = 5
): { mocks: AssembledMock[]; warnings: string[] } {
  const mocks: AssembledMock[] = [];
  const warnings: string[] = [];
  const usedIds = new Set<string>();

  for (let mockNum = 1; mockNum <= numMocks; mockNum++) {
    const mockQuestions: IndexedQuestion[] = [];
    const diffCount = { easy: 0, medium: 0, hard: 0 };
    const stCount: Record<string, number> = {};

    for (const st of subjectDef.sub_topics) {
      const needed = st.question_count_per_mock;
      // 3:4:3 ratio within each sub-topic
      const easyNeeded = Math.round(needed * 0.30);
      const hardNeeded = Math.round(needed * 0.30);
      const medNeeded = needed - easyNeeded - hardNeeded;

      const stPool = pool[st.id];
      if (!stPool) {
        warnings.push(`Mock ${mockNum}: No questions found for sub-topic "${st.id}"`);
        continue;
      }

      // Pick questions from pool (avoiding already-used ones)
      const picked: IndexedQuestion[] = [];

      // Pick easy
      const easyPicked = pickFromPool(stPool.easy, easyNeeded, usedIds);
      picked.push(...easyPicked);
      diffCount.easy += easyPicked.length;

      // Pick medium
      const medPicked = pickFromPool(stPool.medium, medNeeded, usedIds);
      picked.push(...medPicked);
      diffCount.medium += medPicked.length;

      // Pick hard
      const hardPicked = pickFromPool(stPool.hard, hardNeeded, usedIds);
      picked.push(...hardPicked);
      diffCount.hard += hardPicked.length;

      // If we're short on any difficulty, try filling from other difficulties
      const shortfall = needed - picked.length;
      if (shortfall > 0) {
        // Try to fill from any available difficulty
        const allRemaining = [
          ...stPool.easy.filter(q => !usedIds.has(q.id)),
          ...stPool.medium.filter(q => !usedIds.has(q.id)),
          ...stPool.hard.filter(q => !usedIds.has(q.id)),
        ];
        const extraPicked = allRemaining.slice(0, shortfall);
        picked.push(...extraPicked);
        extraPicked.forEach(q => {
          usedIds.add(q.id);
          const d = (q.difficulty?.toLowerCase() || 'medium') as Difficulty;
          diffCount[d]++;
        });

        if (extraPicked.length < shortfall) {
          warnings.push(
            `Mock ${mockNum}: Only ${picked.length}/${needed} questions available for "${st.label}" ` +
            `(short by ${shortfall - extraPicked.length})`
          );
        }
      }

      // Mark picked questions as used
      for (const q of easyPicked.concat(medPicked, hardPicked)) {
        usedIds.add(q.id);
      }

      stCount[st.id] = picked.length;
      mockQuestions.push(...picked);
    }

    // Shuffle all questions within the mock (don't group by sub-topic)
    const shuffled = shuffle(mockQuestions);

    // Number the questions 1 to N
    shuffled.forEach((q, i) => {
      (q as any).question_number = i + 1;
    });

    const mock: AssembledMock = {
      mock_id: `${subjectDef.id}-mock-${mockNum}`,
      title: `${subjectDef.label} Mock Test ${mockNum}`,
      subject: subjectDef.id,
      test_type: 'subject_wise',
      sequence_number: mockNum,
      total_questions: shuffled.length,
      duration_minutes: 120,
      marks_per_correct: 2.00,
      negative_marks: 0.66,
      difficulty_summary: { ...diffCount },
      sub_topic_summary: { ...stCount },
      questions: shuffled,
      created_at: new Date().toISOString(),
    };

    mocks.push(mock);
  }

  return { mocks, warnings };
}

function pickFromPool(
  pool: IndexedQuestion[],
  count: number,
  usedIds: Set<string>
): IndexedQuestion[] {
  const picked: IndexedQuestion[] = [];
  for (const q of pool) {
    if (picked.length >= count) break;
    if (!usedIds.has(q.id)) {
      picked.push(q);
    }
  }
  return picked;
}

// ============================================================
// Step 5: Save & Report
// ============================================================

function saveMocks(mocks: AssembledMock[], outputDir: string): string[] {
  fs.mkdirSync(outputDir, { recursive: true });
  const paths: string[] = [];

  for (const mock of mocks) {
    const filename = `${mock.mock_id}.json`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(mock, null, 2));
    paths.push(filepath);
  }

  // Also save a summary index
  const index = mocks.map(m => ({
    mock_id: m.mock_id,
    title: m.title,
    subject: m.subject,
    sequence_number: m.sequence_number,
    total_questions: m.total_questions,
    difficulty_summary: m.difficulty_summary,
    sub_topic_summary: m.sub_topic_summary,
    created_at: m.created_at,
  }));
  const indexPath = path.join(outputDir, `${mocks[0]?.subject || 'unknown'}-index.json`);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  paths.push(indexPath);

  return paths;
}

function printReport(mocks: AssembledMock[], warnings: string[], stats: {
  totalLoaded: number;
  filesScanned: number;
  duplicatesRemoved: number;
  uniqueQuestions: number;
}) {
  console.log('\n📋 Assembly Report');
  console.log('═'.repeat(60));
  console.log(`📁 Files scanned: ${stats.filesScanned}`);
  console.log(`📝 Total questions loaded: ${stats.totalLoaded}`);
  console.log(`🔵 Duplicates removed: ${stats.duplicatesRemoved}`);
  console.log(`✅ Unique questions: ${stats.uniqueQuestions}`);

  console.log('\n─── Mock Papers ───');
  for (const mock of mocks) {
    const { easy, medium, hard } = mock.difficulty_summary;
    const total = mock.total_questions;
    console.log(`\n  📄 ${mock.title} (${total} Qs)`);
    console.log(`     Difficulty: ${easy}E / ${medium}M / ${hard}H`);

    // Sub-topic breakdown
    for (const [st, count] of Object.entries(mock.sub_topic_summary)) {
      console.log(`     ${st.padEnd(20)} ${count} Qs`);
    }
  }

  if (warnings.length > 0) {
    console.log('\n─── ⚠️ Warnings ───');
    for (const w of warnings) {
      console.log(`  ${w}`);
    }
  }

  // Overall difficulty distribution
  const totalE = mocks.reduce((s, m) => s + m.difficulty_summary.easy, 0);
  const totalM = mocks.reduce((s, m) => s + m.difficulty_summary.medium, 0);
  const totalH = mocks.reduce((s, m) => s + m.difficulty_summary.hard, 0);
  const totalQ = totalE + totalM + totalH;

  console.log('\n─── Overall Difficulty ───');
  console.log(`  Easy:   ${totalE} (${((totalE / totalQ) * 100).toFixed(1)}%)`);
  console.log(`  Medium: ${totalM} (${((totalM / totalQ) * 100).toFixed(1)}%)`);
  console.log(`  Hard:   ${totalH} (${((totalH / totalQ) * 100).toFixed(1)}%)`);
  console.log(`  Total:  ${totalQ} questions across ${mocks.length} mocks`);
}

// ============================================================
// Main
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const subjectArg = args[0];
  const numMocksArg = parseInt(args[1]) || 5;

  if (!subjectArg) {
    console.log('\n🏗️ Mock Test Assembler');
    console.log('═'.repeat(50));
    console.log('\nUsage: npm run assemble -- <subject> [numMocks]');
    console.log('  numMocks: number of mock papers to assemble (default: 5)');
    console.log('\nAvailable subjects:');
    for (const s of SUBJECTS) {
      console.log(`  ${s.id.padEnd(20)} ${s.label}`);
    }
    process.exit(0);
  }

  const subjectDef = getSubject(subjectArg as Subject);
  if (!subjectDef) {
    console.error(`❌ Unknown subject: "${subjectArg}"`);
    process.exit(1);
  }

  console.log(`\n🏗️ Assembling ${subjectDef.label} Mock Tests (${numMocksArg} mocks)`);
  console.log('═'.repeat(50));

  // Step 1: Load
  const generatedDir = path.resolve(__dirname, '../../data/generated');
  console.log('\n📂 Loading generated questions...');
  const { questions: allQuestions, fileCount } = loadAllQuestions(generatedDir);

  // Filter to the requested subject only
  const subjectQuestions = allQuestions.filter(q => {
    return subjectDef.sub_topics.some(st => st.id === q.sub_topic);
  });
  console.log(`   Found ${subjectQuestions.length} questions for ${subjectDef.label} (from ${fileCount} files)`);

  // Step 2: Deduplicate
  console.log('\n🔍 Deduplicating...');
  const { unique, removed } = deduplicate(subjectQuestions);
  console.log(`   Removed ${removed} duplicates → ${unique.length} unique questions`);

  // Step 3: Build pool
  console.log('\n🏊 Building question pool...');
  const pool = buildPool(unique);

  for (const st of subjectDef.sub_topics) {
    const p = pool[st.id];
    if (p) {
      console.log(`   ${st.label.padEnd(25)} E:${p.easy.length} M:${p.medium.length} H:${p.hard.length} = ${p.easy.length + p.medium.length + p.hard.length}`);
    } else {
      console.log(`   ${st.label.padEnd(25)} ⚠️ No questions found!`);
    }
  }

  // Step 4: Assemble
  console.log(`\n🏗️ Assembling ${numMocksArg} mock papers...`);
  const { mocks, warnings } = assembleMocks(pool, subjectDef, numMocksArg);

  // Step 5: Save
  const outputDir = path.resolve(__dirname, '../../data/mocks');
  const savedPaths = saveMocks(mocks, outputDir);
  console.log(`\n💾 Saved ${savedPaths.length} files to: ${outputDir}`);

  // Report
  printReport(mocks, warnings, {
    totalLoaded: subjectQuestions.length,
    filesScanned: fileCount,
    duplicatesRemoved: removed,
    uniqueQuestions: unique.length,
  });

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Assembly complete!');
  console.log('═'.repeat(60));
}

main().catch(console.error);
