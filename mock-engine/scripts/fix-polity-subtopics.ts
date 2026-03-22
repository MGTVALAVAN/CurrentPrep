// ============================================================
// Fix Polity Sub-Topic Tags
// The AI sometimes generates incorrect sub_topic values.
// This script normalizes them based on the filename, which 
// always contains the correct sub-topic.
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.resolve(__dirname, '../data/generated');

// Valid polity sub-topics (from subjects.ts)
const VALID_SUBTOPICS = [
  'pol-constitution',
  'pol-parliament',
  'pol-federal',
  'pol-statutory',
  'pol-admin',
  'pol-evolution',
];

function main() {
  const files = fs.readdirSync(generatedDir)
    .filter(f => f.startsWith('polity_') && f.endsWith('.json'));

  console.log(`\n🔧 Fixing Polity sub-topic tags`);
  console.log(`   Found ${files.length} polity question files\n`);

  let totalFixed = 0;
  let totalQuestions = 0;

  for (const file of files) {
    // Extract expected sub-topic from filename
    // Filename format: polity_pol-constitution_2026-...json
    const match = file.match(/^polity_(pol-[a-z]+)_/);
    if (!match) {
      console.log(`   ⚠️ Skipping ${file} — can't determine sub-topic from filename`);
      continue;
    }

    const expectedSubTopic = match[1];
    if (!VALID_SUBTOPICS.includes(expectedSubTopic)) {
      console.log(`   ⚠️ Unknown sub-topic '${expectedSubTopic}' in ${file}`);
      continue;
    }

    const filepath = path.join(generatedDir, file);
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    let fixed = 0;
    for (const q of data.questions) {
      totalQuestions++;
      if (q.sub_topic !== expectedSubTopic) {
        q.sub_topic = expectedSubTopic;
        fixed++;
        totalFixed++;
      }
    }

    if (fixed > 0) {
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      console.log(`   ✅ ${file}: fixed ${fixed}/${data.questions.length} questions → ${expectedSubTopic}`);
    } else {
      console.log(`   ✔️ ${file}: all ${data.questions.length} questions already correct`);
    }
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📊 Total: ${totalFixed}/${totalQuestions} questions fixed`);
  console.log(`${'═'.repeat(50)}\n`);
}

main();
