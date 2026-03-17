import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.resolve(__dirname, '../data/generated');

// All geography wrong sub-topic IDs → correct parent sub-topic
const FIXES: Record<string, string> = {
  'monsoon': 'geo-physical',
  'soil types': 'geo-india',
  'cyclones': 'geo-physical',
  'river systems': 'geo-india',
  'himalayan geology': 'geo-physical',
  'critical minerals': 'geo-economic',
  'climate change': 'geo-physical',
  'atmosphere': 'geo-physical',
  'ocean currents': 'geo-physical',
  'wildlife': 'geo-india',
  'plate tectonics': 'geo-physical',
  'geomorphology': 'geo-physical',
  'biogeography': 'geo-physical',
  'climatology': 'geo-physical',
  'oceanography': 'geo-physical',
  'vegetation': 'geo-india',
  'minerals': 'geo-economic',
  'agriculture': 'geo-economic',
  'urbanization': 'geo-economic',
  'industry': 'geo-economic',
  'trade': 'geo-economic',
};

let totalFixed = 0;
let filesFixed = 0;

const files = fs.readdirSync(generatedDir).filter(f => f.startsWith('geography') && f.endsWith('.json'));

for (const file of files) {
  const filepath = path.join(generatedDir, file);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  let changed = false;

  for (const q of data.questions) {
    const fixedId = FIXES[q.sub_topic];
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

console.log(`\n🔧 Geography Sub-Topic Fix Complete`);
console.log(`   Files modified: ${filesFixed}`);
console.log(`   Questions fixed: ${totalFixed}`);
