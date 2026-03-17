// Quick top-up script for Art & Culture sub-topics that are short
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

interface TopUpBatch {
  sub_topic: string;
  sub_topic_label: string;
  count: number;
  description: string;
}

const TOPUP_BATCHES: TopUpBatch[] = [
  {
    sub_topic: 'ac-architecture',
    sub_topic_label: 'Architecture & Sculpture',
    count: 25,
    description: 'Nagara/Dravida/Vesara temple styles, cave temples, Buddhist stupas, Indo-Islamic architecture, colonial architecture, Gandhara vs Mathura sculpture schools, UNESCO World Heritage Sites',
  },
  {
    sub_topic: 'ac-handicrafts',
    sub_topic_label: 'Handicrafts, Textiles & GI Tags',
    count: 25,
    description: 'GI-tagged products (state-wise), textile traditions (Banarasi, Pochampalli, Patola, Chanderi, Kanjeevaram), crafts (Bidriware, Dhokra, Blue Pottery, Papier-mâché), tribal crafts',
  },
];

async function generate(batch: TopUpBatch) {
  const easy = Math.round(batch.count * 0.30);
  const hard = Math.round(batch.count * 0.30);
  const medium = batch.count - easy - hard;

  const prompt = `You are a senior UPSC Civil Services Preliminary Examination question setter with 20 years of experience.

Generate exactly ${batch.count} unique MCQ questions for:
- Subject: Art & Culture
- Sub-topic: ${batch.sub_topic_label}
- Description: ${batch.description}
- Difficulty ratio 3:4:3 → ${easy} easy, ${medium} medium, ${hard} hard

STRICT RULES:
1. Each question has exactly 4 options (A, B, C, D) with ONE correct answer
2. All options must be plausible
3. Mix question patterns: statements, direct factual, matching, chronological, negative
4. Include 2-4 line explanation for each
5. Facts must be accurate as of 2026
6. No duplicate questions

Return ONLY a valid JSON array:
[
  {
    "question": "Question text",
    "option_a": "Option A",
    "option_b": "Option B",
    "option_c": "Option C",
    "option_d": "Option D",
    "correct_answer": "B",
    "explanation": "Explanation",
    "difficulty": "medium",
    "sub_topic": "${batch.sub_topic}"
  }
]`;

  const result = await model.generateContent(prompt);
  let jsonText = result.response.text().trim();
  if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7);
  if (jsonText.startsWith('```')) jsonText = jsonText.slice(3);
  if (jsonText.endsWith('```')) jsonText = jsonText.slice(0, -3);

  const questions = JSON.parse(jsonText.trim());
  return questions;
}

async function main() {
  console.log('\n🔄 Art & Culture Top-Up Generation\n');
  const outputDir = path.resolve(__dirname, '../data/generated');

  for (const batch of TOPUP_BATCHES) {
    console.log(`Generating ${batch.count} Qs for ${batch.sub_topic_label}...`);
    try {
      const questions = await generate(batch);
      const result = {
        batch: { subject: 'art_culture', sub_topic: batch.sub_topic, sub_topic_label: batch.sub_topic_label, count: batch.count, difficulty_mix: {} },
        questions,
        valid_count: questions.length,
        invalid_count: 0,
        errors: [],
        generated_at: new Date().toISOString(),
      };
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filepath = path.join(outputDir, `art_culture_${batch.sub_topic}_topup_${timestamp}.json`);
      fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
      console.log(`   ✅ ${questions.length} questions saved`);
    } catch (e: any) {
      console.error(`   ❌ Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n✅ Top-up complete!');
}

main().catch(console.error);
