import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.resolve(__dirname, '../data/generated');

const VALID_SUBTOPICS = [
  'env-biodiversity', 'env-climate', 'env-pollution', 'env-sustainable',
  'env-ecology', 'env-eia', 'env-species', 'env-sdgs',
];

function main() {
  const files = fs.readdirSync(generatedDir)
    .filter(f => f.startsWith('environment_') && f.endsWith('.json'));

  console.log(`\n🔧 Fixing Environment sub-topic tags`);
  console.log(`   Found ${files.length} environment question files\n`);

  let totalFixed = 0, totalQuestions = 0;

  for (const file of files) {
    const match = file.match(/^environment_(env-[a-z]+)_/);
    if (!match) { console.log(`   ⚠️ Skipping ${file}`); continue; }

    const expected = match[1];
    if (!VALID_SUBTOPICS.includes(expected)) { console.log(`   ⚠️ Unknown '${expected}' in ${file}`); continue; }

    const filepath = path.join(generatedDir, file);
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    let fixed = 0;
    for (const q of data.questions) {
      totalQuestions++;
      if (q.sub_topic !== expected) { q.sub_topic = expected; fixed++; totalFixed++; }
    }
    if (fixed > 0) {
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      console.log(`   ✅ ${file}: fixed ${fixed}/${data.questions.length} → ${expected}`);
    } else {
      console.log(`   ✔️ ${file}: all ${data.questions.length} correct`);
    }
  }
  console.log(`\n${'═'.repeat(50)}\n📊 Total: ${totalFixed}/${totalQuestions} fixed\n${'═'.repeat(50)}\n`);
}
main();
