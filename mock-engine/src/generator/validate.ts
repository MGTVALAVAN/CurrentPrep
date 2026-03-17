// ============================================================
// Question Validator — Post-Generation Quality Checks
// Reads generated JSON files and reports quality metrics
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GenerationResult, GeneratedQuestion } from '../types/index.js';
import { getAllSubTopicIds } from '../data/subjects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ValidationReport {
  totalFiles: number;
  totalQuestions: number;
  validQuestions: number;
  issues: ValidationIssue[];
  duplicates: DuplicateGroup[];
  difficultyDistribution: Record<string, number>;
  subTopicDistribution: Record<string, number>;
}

interface ValidationIssue {
  file: string;
  questionIndex: number;
  issue: string;
  severity: 'error' | 'warning';
}

interface DuplicateGroup {
  fingerprint: string;
  questions: { file: string; index: number; text: string }[];
}

// ============================================================
// Deep Validation
// ============================================================

function deepValidate(q: GeneratedQuestion, file: string, index: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const validSubTopics = getAllSubTopicIds();

  // Length checks
  if (q.question.length < 30) {
    issues.push({ file, questionIndex: index, issue: 'Question text suspiciously short', severity: 'warning' });
  }
  if (q.explanation.length < 20) {
    issues.push({ file, questionIndex: index, issue: 'Explanation too brief — students need detail', severity: 'warning' });
  }

  // Check for identical options
  const options = [q.option_a, q.option_b, q.option_c, q.option_d];
  const uniqueOptions = new Set(options.map(o => o.toLowerCase().trim()));
  if (uniqueOptions.size < 4) {
    issues.push({ file, questionIndex: index, issue: 'Duplicate options found', severity: 'error' });
  }

  // Check option lengths (too short = likely placeholder)
  for (const [label, opt] of [['A', q.option_a], ['B', q.option_b], ['C', q.option_c], ['D', q.option_d]]) {
    if (opt.length < 2) {
      issues.push({ file, questionIndex: index, issue: `Option ${label} is suspiciously short: "${opt}"`, severity: 'error' });
    }
  }

  // Sub-topic validity
  if (!validSubTopics.includes(q.sub_topic)) {
    issues.push({ file, questionIndex: index, issue: `Unknown sub-topic: "${q.sub_topic}"`, severity: 'error' });
  }

  // Check for "None of the above" pattern (lazy AI)
  for (const opt of options) {
    if (opt.toLowerCase().match(/none of the above|all of the above/)) {
      issues.push({ file, questionIndex: index, issue: `"${opt}" — avoid "None/All of the above" patterns`, severity: 'warning' });
    }
  }

  return issues;
}

// ============================================================
// Duplicate Detection
// ============================================================

function fingerprint(q: GeneratedQuestion): string {
  // Create a normalized fingerprint for duplicate detection
  return q.question
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 100);
}

function findDuplicates(allQuestions: { file: string; index: number; q: GeneratedQuestion }[]): DuplicateGroup[] {
  const groups = new Map<string, { file: string; index: number; text: string }[]>();

  for (const item of allQuestions) {
    const fp = fingerprint(item.q);
    if (!groups.has(fp)) {
      groups.set(fp, []);
    }
    groups.get(fp)!.push({ file: item.file, index: item.index, text: item.q.question.slice(0, 80) });
  }

  return Array.from(groups.entries())
    .filter(([, items]) => items.length > 1)
    .map(([fp, items]) => ({ fingerprint: fp, questions: items }));
}

// ============================================================
// Main
// ============================================================

async function main() {
  const generatedDir = path.resolve(__dirname, '../../data/generated');

  if (!fs.existsSync(generatedDir)) {
    console.log('❌ No generated data found. Run `npm run generate:pilot` first.');
    process.exit(1);
  }

  const files = fs.readdirSync(generatedDir).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('❌ No JSON files found in data/generated/');
    process.exit(1);
  }

  console.log('\n🔍 Question Validator — Quality Report');
  console.log('═'.repeat(55));

  const allQuestions: { file: string; index: number; q: GeneratedQuestion }[] = [];
  const allIssues: ValidationIssue[] = [];
  const diffDist: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  const stDist: Record<string, number> = {};

  for (const file of files) {
    const filepath = path.join(generatedDir, file);
    const data: GenerationResult = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      allQuestions.push({ file, index: i, q });

      // Deep validation
      const issues = deepValidate(q, file, i);
      allIssues.push(...issues);

      // Distribution tracking
      const diff = q.difficulty?.toLowerCase() || 'unknown';
      diffDist[diff] = (diffDist[diff] || 0) + 1;

      stDist[q.sub_topic] = (stDist[q.sub_topic] || 0) + 1;
    }
  }

  // Find duplicates
  const duplicates = findDuplicates(allQuestions);

  // Print report
  console.log(`\n📁 Files scanned: ${files.length}`);
  console.log(`📝 Total questions: ${allQuestions.length}`);

  const errorCount = allIssues.filter(i => i.severity === 'error').length;
  const warnCount = allIssues.filter(i => i.severity === 'warning').length;

  console.log(`\n🔴 Errors: ${errorCount}`);
  console.log(`🟡 Warnings: ${warnCount}`);
  console.log(`🔵 Duplicates: ${duplicates.length} group(s)`);

  if (allIssues.length > 0) {
    console.log('\n─── Issues ───');
    for (const issue of allIssues.slice(0, 20)) {
      const icon = issue.severity === 'error' ? '🔴' : '🟡';
      console.log(`${icon} [${issue.file}] Q${issue.questionIndex + 1}: ${issue.issue}`);
    }
    if (allIssues.length > 20) {
      console.log(`   ... and ${allIssues.length - 20} more`);
    }
  }

  if (duplicates.length > 0) {
    console.log('\n─── Duplicates ───');
    for (const dup of duplicates.slice(0, 5)) {
      console.log(`🔵 "${dup.questions[0].text}..."`);
      for (const q of dup.questions) {
        console.log(`   └─ ${q.file} (Q${q.index + 1})`);
      }
    }
  }

  console.log('\n─── Difficulty Distribution ───');
  for (const [diff, count] of Object.entries(diffDist)) {
    const pct = ((count / allQuestions.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(Number(pct) / 2));
    console.log(`  ${diff.padEnd(8)} ${bar} ${count} (${pct}%)`);
  }

  console.log('\n─── Sub-Topic Distribution ───');
  for (const [st, count] of Object.entries(stDist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${st.padEnd(20)} ${count} questions`);
  }

  // Summary
  const qualityScore = Math.round(((allQuestions.length - errorCount) / allQuestions.length) * 100);
  console.log('\n' + '═'.repeat(55));
  console.log(`📊 Quality Score: ${qualityScore}% (${allQuestions.length - errorCount}/${allQuestions.length} clean)`);
  console.log(`📋 ${allQuestions.length - errorCount} questions ready for review`);
  console.log('═'.repeat(55));
}

main().catch(console.error);
