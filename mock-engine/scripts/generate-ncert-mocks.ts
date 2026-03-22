// ============================================================
// NCERT-Based Mock Test Generator
// Generates 2-3 NCERT-focused tests per subject
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mocksDir = path.resolve(__dirname, '../data/mocks');
const apiKey = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf-8')
  .split('\n').find(l => l.startsWith('GEMINI_API_KEY'))?.split('=')[1]?.trim() || '';

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// NCERT subjects and their textbook coverage
const NCERT_SUBJECTS = [
  {
    subject: 'history',
    label: 'History (NCERT)',
    mocks: 3,
    ncertBooks: [
      'Class 6: Our Pasts I (Ancient India)',
      'Class 7: Our Pasts II (Medieval India)', 
      'Class 8: Our Pasts III (Modern India)',
      'Class 9: India and the Contemporary World I',
      'Class 10: India and the Contemporary World II',
      'Class 11: Themes in Indian History I, II, III',
      'Class 12: Themes in Indian History I, II, III',
    ],
    subTopics: [
      'Ancient India - Indus Valley & Vedic Age',
      'Ancient India - Maurya & Gupta Empires',
      'Medieval India - Delhi Sultanate',
      'Medieval India - Mughal Empire',
      'Modern India - British Conquest',
      'Modern India - Freedom Struggle',
      'World History - French/Industrial Revolution',
    ],
  },
  {
    subject: 'geography',
    label: 'Geography (NCERT)',
    mocks: 3,
    ncertBooks: [
      'Class 6: The Earth Our Habitat',
      'Class 7: Our Environment',
      'Class 8: Resource and Development',
      'Class 9: Contemporary India I',
      'Class 10: Contemporary India II',
      'Class 11: Fundamentals of Physical Geography, India Physical Environment',
      'Class 12: Fundamentals of Human Geography, India - People and Economy',
    ],
    subTopics: [
      'Physical Geography - Geomorphology',
      'Physical Geography - Climatology',
      'Physical Geography - Oceanography',
      'Indian Geography - Physiography & Drainage',
      'Indian Geography - Climate & Soils',
      'Human Geography - Population & Settlement',
      'Economic Geography - Resources & Industries',
    ],
  },
  {
    subject: 'polity',
    label: 'Polity & Governance (NCERT)',
    mocks: 2,
    ncertBooks: [
      'Class 9: Democratic Politics I',
      'Class 10: Democratic Politics II',
      'Class 11: Indian Constitution at Work, Political Theory',
      'Class 12: Politics in India since Independence, Contemporary World Politics',
    ],
    subTopics: [
      'Constitutional Framework & Preamble',
      'Fundamental Rights & DPSP',
      'Parliament & State Legislature',
      'Judiciary & Judicial Review',
      'Federalism & Centre-State Relations',
      'Local Government & Panchayati Raj',
    ],
  },
  {
    subject: 'economics',
    label: 'Economics (NCERT)',
    mocks: 2,
    ncertBooks: [
      'Class 9: Economics',
      'Class 10: Understanding Economic Development',
      'Class 11: Indian Economic Development, Statistics for Economics',
      'Class 12: Introductory Macroeconomics, Introductory Microeconomics',
    ],
    subTopics: [
      'Microeconomics - Demand, Supply & Markets',
      'Macroeconomics - National Income & GDP',
      'Indian Economy - Agriculture & Rural Dev',
      'Indian Economy - Industry & Infrastructure',
      'Money, Banking & Fiscal Policy',
      'International Trade & BoP',
    ],
  },
  {
    subject: 'science',
    label: 'Science & Technology (NCERT)',
    mocks: 2,
    ncertBooks: [
      'Class 9: Science',
      'Class 10: Science',
      'Class 11: Physics I & II, Chemistry I & II, Biology',
      'Class 12: Physics I & II, Chemistry I & II, Biology',
    ],
    subTopics: [
      'Physics - Mechanics & Optics',
      'Chemistry - Basic Concepts & Materials',
      'Biology - Cell Biology & Genetics',
      'Biology - Ecology & Environment',
      'Space & Nuclear Technology',
      'IT & Emerging Technologies',
    ],
  },
  {
    subject: 'environment',
    label: 'Environment & Ecology (NCERT)',
    mocks: 2,
    ncertBooks: [
      'Class 12: Biology (Ecology chapters)',
      'Class 11: Biology (Environmental chapters)',
      'Class 7-10: Science chapters on environment',
    ],
    subTopics: [
      'Ecology - Ecosystems & Biodiversity',
      'Environment - Pollution & Climate Change',
      'Conservation - Protected Areas & Acts',
      'Sustainable Development',
    ],
  },
  {
    subject: 'art_culture',
    label: 'Art & Culture (NCERT)',
    mocks: 2,
    ncertBooks: [
      'Class 11: An Introduction to Indian Art',
      'Class 11: Living Craft Traditions of India',
      'NCERT: India Cultural Heritage (supplementary)',
    ],
    subTopics: [
      'Architecture - Temple & Mughal',
      'Painting - Miniature & Modern',
      'Performing Arts - Dance & Music',
      'Literature & Languages',
    ],
  },
  {
    subject: 'society',
    label: 'Indian Society (NCERT)',
    mocks: 2,
    ncertBooks: [
      'Class 11: Understanding Society (Sociology)',
      'Class 12: Indian Society, Social Change in India',
    ],
    subTopics: [
      'Social Structure - Caste & Class',
      'Social Issues - Gender & Poverty',
      'Social Movements & Change',
      'Population & Urbanization',
    ],
  },
];

async function generateBatch(subject: typeof NCERT_SUBJECTS[0], mockNum: number, batchStart: number, batchSize: number): Promise<any[]> {
  const prompt = `You are a UPSC exam question setter. Generate ${batchSize} NCERT-based multiple-choice questions for UPSC Prelims preparation.

SUBJECT: ${subject.label}
NCERT TEXTBOOKS TO DRAW FROM:
${subject.ncertBooks.map(b => `- ${b}`).join('\n')}

SUB-TOPICS TO COVER (distribute evenly):
${subject.subTopics.map(s => `- ${s}`).join('\n')}

REQUIREMENTS:
1. Questions must test NCERT-level concepts, not current affairs
2. Focus on fundamental concepts, definitions, and facts from NCERT textbooks
3. Use standard UPSC patterns: "Consider the following statements", "Which is correct/incorrect", "Match the following"
4. For "Consider the following statements" type, include numbered statements IN the question text
5. Each question must have exactly 4 options (A, B, C, D) — all DIFFERENT
6. Include difficulty level: "easy" (40%), "medium" (40%), "hard" (20%)
7. Include a clear explanation referencing the NCERT source
8. Sub-topic must be one of: ${subject.subTopics.map(s => `"${s}"`).join(', ')}

Return a JSON array of ${batchSize} objects:
[{
  "question": "...",
  "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...",
  "correct_answer": "a|b|c|d",
  "explanation": "As per NCERT Class X, Chapter Y: ...",
  "difficulty": "easy|medium|hard",
  "sub_topic": "..."
}]

Return ONLY the JSON array, no markdown.`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  if (text.includes('```json')) text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  if (text.includes('```')) text = text.replace(/```\n?/g, '');
  return JSON.parse(text);
}

async function generateMock(subject: typeof NCERT_SUBJECTS[0], mockNum: number) {
  const totalQs = 100;
  const batchSize = 25;
  const batches = totalQs / batchSize;
  const allQuestions: any[] = [];

  for (let batch = 0; batch < batches; batch++) {
    const start = batch * batchSize + 1;
    process.stdout.write(`   Batch ${batch + 1}/${batches} (Q${start}-${start + batchSize - 1})...`);
    
    try {
      const questions = await generateBatch(subject, mockNum, start, batchSize);
      allQuestions.push(...questions);
      console.log(` ✅ ${questions.length} Qs`);
    } catch (err: any) {
      console.log(` ❌ ${err.message?.substring(0, 60)}`);
      // Wait and retry once
      await new Promise(r => setTimeout(r, 5000));
      try {
        const questions = await generateBatch(subject, mockNum, start, batchSize);
        allQuestions.push(...questions);
        console.log(`   ↳ Retry ✅ ${questions.length} Qs`);
      } catch (err2: any) {
        console.log(`   ↳ Retry ❌ ${err2.message?.substring(0, 60)}`);
      }
    }
    // Rate limit pause
    await new Promise(r => setTimeout(r, 3000));
  }

  // Build mock file
  const mockId = `ncert_${subject.subject}-mock-${mockNum}`;
  const mockData = {
    id: mockId,
    title: `${subject.label} Mock Test ${mockNum}`,
    total_questions: allQuestions.length,
    time_minutes: 120,
    marks_correct: 2,
    marks_wrong: -0.66,
    questions: allQuestions,
  };

  const outPath = path.join(mocksDir, `${mockId}.json`);
  fs.writeFileSync(outPath, JSON.stringify(mockData, null, 2));
  console.log(`   💾 Saved: ${mockId}.json (${allQuestions.length} questions)\n`);
  return allQuestions.length;
}

async function main() {
  console.log('\n📚 NCERT Mock Test Generator');
  console.log('═'.repeat(50));

  let totalGenerated = 0;
  let totalMocks = 0;

  for (const subject of NCERT_SUBJECTS) {
    console.log(`\n📘 ${subject.label} — ${subject.mocks} mocks`);
    console.log('─'.repeat(40));

    for (let m = 1; m <= subject.mocks; m++) {
      console.log(`  Mock ${m}/${subject.mocks}:`);
      const count = await generateMock(subject, m);
      totalGenerated += count;
      totalMocks++;
    }
  }

  console.log('\n═'.repeat(50));
  console.log(`✅ Generation Complete!`);
  console.log(`   📝 ${totalMocks} NCERT mocks generated`);
  console.log(`   📊 ${totalGenerated} total questions`);
  console.log('═'.repeat(50) + '\n');
}

main().catch(console.error);
