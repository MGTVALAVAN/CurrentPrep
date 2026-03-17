// ============================================================
// Fix sub-topic IDs in generated Art & Culture questions
// The AI sometimes invents sub-topic names instead of using
// the exact IDs from our taxonomy. This script normalizes them.
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.resolve(__dirname, '../data/generated');

// Mapping of wrong sub-topic IDs → correct ones
const SUB_TOPIC_FIXES: Record<string, string> = {
  'ac-sculpture': 'ac-architecture',
  'ac-traditions': 'ac-festivals',
  'ac-tribal-culture': 'ac-festivals',
  'ac-tribal': 'ac-festivals',
  'ac-textiles': 'ac-handicrafts',
  'ac-gi-tags': 'ac-handicrafts',
  'ac-folk-paintings': 'ac-paintings',
  'ac-miniature': 'ac-paintings',
  'ac-modern-art': 'ac-paintings',
  'ac-dance': 'ac-performing',
  'ac-music': 'ac-performing',
  'ac-theatre': 'ac-performing',
};

let totalFixed = 0;
let filesFixed = 0;

const files = fs.readdirSync(generatedDir).filter(f => f.startsWith('art_culture') && f.endsWith('.json'));

for (const file of files) {
  const filepath = path.join(generatedDir, file);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  let changed = false;

  for (const q of data.questions) {
    const fixedId = SUB_TOPIC_FIXES[q.sub_topic];
    if (fixedId) {
      q.sub_topic = fixedId;
      totalFixed++;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    filesFixed++;
  }
}

console.log(`\n🔧 Sub-Topic ID Fix Complete`);
console.log(`   Files modified: ${filesFixed}`);
console.log(`   Questions fixed: ${totalFixed}`);
console.log(`   Mapping used:`);
for (const [from, to] of Object.entries(SUB_TOPIC_FIXES)) {
  console.log(`     ${from} → ${to}`);
}
