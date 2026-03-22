// ============================================================
// Question Quality Validator
// Scans all mock test questions for incomplete/broken content
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mocksDir = path.resolve(__dirname, '../data/mocks');

interface Issue {
  mock: string;
  qIndex: number;
  question: string;
  issue: string;
  severity: 'critical' | 'warning';
}

function validateQuestion(q: any, mockFile: string, idx: number): Issue[] {
  const issues: Issue[] = [];
  const qText = (q.question || '').trim();
  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
  
  // 1. Empty or very short question
  if (!qText || qText.length < 15) {
    issues.push({ mock: mockFile, qIndex: idx, question: qText, issue: 'Question text too short or empty', severity: 'critical' });
  }

  // 2. "Arrange chronologically" / "Consider the following" without items
  // "Which of the following is NOT correct" is VALID UPSC format where options = statements
  // Only flag truly broken patterns: very short question + no items + no newlines
  
  // Arrange chronologically MUST have items listed
  if (/arrange.*chronolog/i.test(qText) && qText.length < 100 && !/\n/.test(qText) && !/\d\.\s/.test(qText)) {
    issues.push({ mock: mockFile, qIndex: idx, question: qText.substring(0, 100), issue: 'Arrange chronologically without items listed', severity: 'critical' });
  }
  
  // "Consider the following statements" without ANY numbered items (only if very short)
  if (/consider.*following.*statements?/i.test(qText) && qText.length < 80 && !/\n/.test(qText) && !/\d\.\s/.test(qText)) {
    issues.push({ mock: mockFile, qIndex: idx, question: qText.substring(0, 100), issue: 'Consider statements without listing them', severity: 'critical' });
  }

  // 3. Question ends abruptly (ends with preposition, article, or conjunction)
  const abruptEndings = /\b(the|a|an|of|in|with|by|for|to|from|and|or|is|are|was|were|which|that|this|these|those)\s*[?.]?\s*$/i;
  if (abruptEndings.test(qText) && qText.length < 80) {
    issues.push({ mock: mockFile, qIndex: idx, question: qText.substring(0, 100), issue: 'Question may end abruptly', severity: 'warning' });
  }

  // 4. Duplicate options
  const optTexts = opts.map(o => (o || '').trim().toLowerCase());
  const uniqueOpts = new Set(optTexts.filter(o => o.length > 0));
  if (uniqueOpts.size < 4 && optTexts.filter(o => o.length > 0).length === 4) {
    issues.push({ mock: mockFile, qIndex: idx, question: qText.substring(0, 80), issue: `Duplicate options found (${uniqueOpts.size} unique out of 4)`, severity: 'critical' });
  }

  // 5. Empty options
  for (let i = 0; i < opts.length; i++) {
    if (!opts[i] || opts[i].trim().length === 0) {
      issues.push({ mock: mockFile, qIndex: idx, question: qText.substring(0, 80), issue: `Option ${String.fromCharCode(65+i)} is empty`, severity: 'critical' });
    }
  }

  // 6. Missing correct answer or invalid
  const validAnswers = ['a', 'b', 'c', 'd'];
  if (!q.correct_answer || !validAnswers.includes(q.correct_answer.toLowerCase())) {
    issues.push({ mock: mockFile, qIndex: idx, question: qText.substring(0, 80), issue: `Invalid correct_answer: "${q.correct_answer}"`, severity: 'critical' });
  }

  // 7. Missing explanation
  if (!q.explanation || q.explanation.trim().length < 10) {
    issues.push({ mock: mockFile, qIndex: idx, question: qText.substring(0, 80), issue: 'Missing or very short explanation', severity: 'warning' });
  }

  // 8. Question contains placeholder text
  const placeholders = /\[.*?\]|___+|\.\.\.{3,}|TBD|TODO|PLACEHOLDER/i;
  if (placeholders.test(qText)) {
    issues.push({ mock: mockFile, qIndex: idx, question: qText.substring(0, 100), issue: 'Contains placeholder text', severity: 'critical' });
  }

  // 9. Very similar options (likely AI hallucination)
  for (let i = 0; i < opts.length; i++) {
    for (let j = i + 1; j < opts.length; j++) {
      if (opts[i] && opts[j] && opts[i].trim().length > 5) {
        const a = opts[i].trim().toLowerCase();
        const b = opts[j].trim().toLowerCase();
        if (a === b) {
          issues.push({ mock: mockFile, qIndex: idx, question: qText.substring(0, 80), issue: `Options ${String.fromCharCode(65+i)} and ${String.fromCharCode(65+j)} are identical`, severity: 'critical' });
        }
      }
    }
  }

  // 10. Question references numbered items but doesn't contain them
  const numberedRef = /statement[s]?\s*(1|I|i)/i;
  if (numberedRef.test(qText) && !/\n/.test(qText) && qText.length < 60) {
    issues.push({ mock: mockFile, qIndex: idx, question: qText.substring(0, 100), issue: 'References numbered statements but none found in question', severity: 'warning' });
  }

  return issues;
}

function main() {
  const files = fs.readdirSync(mocksDir).filter(f => f.endsWith('.json') && f.includes('mock-'));
  
  console.log('\n🔍 UPSC Mock Test — Question Quality Validator');
  console.log('══════════════════════════════════════════════════');
  console.log(`📂 Scanning ${files.length} mock test files...\n`);

  let totalQuestions = 0;
  const allIssues: Issue[] = [];
  const mockSummary: Record<string, { total: number, critical: number, warning: number }> = {};

  for (const file of files.sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(mocksDir, file), 'utf-8'));
    const questions = data.questions || [];
    totalQuestions += questions.length;
    
    let critical = 0, warning = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const issues = validateQuestion(questions[i], file, i + 1);
      for (const issue of issues) {
        allIssues.push(issue);
        if (issue.severity === 'critical') critical++;
        else warning++;
      }
    }

    mockSummary[file] = { total: questions.length, critical, warning };
    
    const status = critical > 0 ? '❌' : warning > 0 ? '⚠️' : '✅';
    console.log(`  ${status} ${file}: ${questions.length} Qs | ${critical} critical, ${warning} warnings`);
  }

  // Summary
  const totalCritical = allIssues.filter(i => i.severity === 'critical').length;
  const totalWarning = allIssues.filter(i => i.severity === 'warning').length;

  console.log('\n══════════════════════════════════════════════════');
  console.log(`📊 Scan Complete`);
  console.log(`   📝 Total questions: ${totalQuestions}`);
  console.log(`   ❌ Critical issues: ${totalCritical}`);
  console.log(`   ⚠️  Warnings: ${totalWarning}`);
  console.log(`   ✅ Clean: ${totalQuestions - allIssues.length}`);
  console.log('══════════════════════════════════════════════════');

  // Detail critical issues
  if (totalCritical > 0) {
    console.log('\n❌ CRITICAL ISSUES (require fixing):');
    console.log('─'.repeat(60));
    for (const issue of allIssues.filter(i => i.severity === 'critical')) {
      console.log(`\n  📄 ${issue.mock} — Q${issue.qIndex}`);
      console.log(`  🔴 ${issue.issue}`);
      console.log(`  📝 "${issue.question}"`);
    }
  }

  if (totalWarning > 0) {
    console.log('\n⚠️  WARNINGS (review recommended):');
    console.log('─'.repeat(60));
    for (const issue of allIssues.filter(i => i.severity === 'warning')) {
      console.log(`\n  📄 ${issue.mock} — Q${issue.qIndex}`);
      console.log(`  🟡 ${issue.issue}`);
      console.log(`  📝 "${issue.question}"`);
    }
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    totalQuestions,
    totalCritical,
    totalWarning,
    issues: allIssues,
  };
  const reportPath = path.join(mocksDir, '..', 'quality-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Full report saved to: ${reportPath}\n`);
}

main();
