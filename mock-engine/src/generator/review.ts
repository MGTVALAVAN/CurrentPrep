// ============================================================
// Interactive Review Tool — Browse & approve generated questions
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';
import { GenerationResult } from '../types/index.js';
import { getSubTopicLabel } from '../data/subjects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  const generatedDir = path.resolve(__dirname, '../../data/generated');
  const approvedDir = path.resolve(__dirname, '../../data/approved');

  if (!fs.existsSync(generatedDir)) {
    console.log('❌ No generated data found. Run `npm run generate:pilot` first.');
    process.exit(1);
  }

  const files = fs.readdirSync(generatedDir).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('❌ No files to review.');
    process.exit(1);
  }

  console.log('\n📋 Question Review Tool');
  console.log('═'.repeat(50));
  console.log(`Files to review: ${files.length}`);
  console.log('Commands: [a]pprove  [r]eject  [s]kip  [q]uit\n');

  let totalApproved = 0;
  let totalRejected = 0;
  let totalSkipped = 0;

  for (const file of files) {
    const filepath = path.join(generatedDir, file);
    const data: GenerationResult = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    console.log(`\n📁 ${file}`);
    console.log(`   Subject: ${data.batch.subject} | Sub-topic: ${data.batch.sub_topic_label}`);
    console.log(`   Questions: ${data.questions.length}`);
    console.log('─'.repeat(50));

    const approved = [];
    const rejected = [];

    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];

      console.log(`\n[${i + 1}/${data.questions.length}] ${q.difficulty?.toUpperCase()} | ${getSubTopicLabel(q.sub_topic)}`);
      console.log(`\nQ: ${q.question}`);
      console.log(`   A) ${q.option_a}`);
      console.log(`   B) ${q.option_b}`);
      console.log(`   C) ${q.option_c}`);
      console.log(`   D) ${q.option_d}`);
      console.log(`   ✅ Answer: ${q.correct_answer}`);
      console.log(`   📖 ${q.explanation}`);

      const action = await ask('\n→ [a]pprove / [r]eject / [s]kip / [q]uit: ');

      switch (action.toLowerCase().trim()) {
        case 'a':
          approved.push(q);
          totalApproved++;
          console.log('   ✅ Approved');
          break;
        case 'r':
          rejected.push(q);
          totalRejected++;
          console.log('   ❌ Rejected');
          break;
        case 'q':
          console.log(`\n📊 Session Summary: ${totalApproved} approved, ${totalRejected} rejected, ${totalSkipped} skipped`);
          rl.close();
          process.exit(0);
          break;
        case 's':
        default:
          totalSkipped++;
          console.log('   ⏭️ Skipped');
          break;
      }
    }

    // Save approved questions
    if (approved.length > 0) {
      fs.mkdirSync(approvedDir, { recursive: true });
      const approvedFile = path.join(approvedDir, `approved_${file}`);
      const approvedData = { ...data, questions: approved, approved_count: approved.length };
      fs.writeFileSync(approvedFile, JSON.stringify(approvedData, null, 2));
      console.log(`\n💾 Saved ${approved.length} approved questions → ${approvedFile}`);
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log('📊 Review Complete');
  console.log(`   ✅ Approved: ${totalApproved}`);
  console.log(`   ❌ Rejected: ${totalRejected}`);
  console.log(`   ⏭️ Skipped: ${totalSkipped}`);
  console.log('═'.repeat(50));

  rl.close();
}

main().catch(console.error);
