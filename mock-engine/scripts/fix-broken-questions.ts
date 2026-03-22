// ============================================================
// Fix broken questions by regenerating them with AI
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

// Load quality report
const report = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/quality-report.json'), 'utf-8'));
const criticalIssues = report.issues.filter((i: any) => i.severity === 'critical');

console.log(`\n🔧 Fixing ${criticalIssues.length} critical questions\n`);

// Group by mock file
const byMock: Record<string, number[]> = {};
for (const issue of criticalIssues) {
  if (!byMock[issue.mock]) byMock[issue.mock] = [];
  if (!byMock[issue.mock].includes(issue.qIndex)) {
    byMock[issue.mock].push(issue.qIndex);
  }
}

async function fixQuestion(mockFile: string, qIndex: number): Promise<any> {
  const data = JSON.parse(fs.readFileSync(path.join(mocksDir, mockFile), 'utf-8'));
  const broken = data.questions[qIndex - 1];
  const subTopic = broken.sub_topic;
  const difficulty = broken.difficulty;

  const prompt = `You are a UPSC question setter. The following question is BROKEN or INCOMPLETE. 
Generate a COMPLETE replacement question on the SAME topic and difficulty.

BROKEN QUESTION:
"${broken.question}"
Options: A: ${broken.option_a} | B: ${broken.option_b} | C: ${broken.option_c} | D: ${broken.option_d}

Requirements:
- Same sub_topic: "${subTopic}"
- Same difficulty: "${difficulty}"
- If using "Consider the following statements", include numbered statements IN the question text
- If using "Arrange chronologically", include the items to arrange IN the question text
- All 4 options must be DIFFERENT from each other
- Include a detailed explanation

Return ONLY a JSON object (no markdown):
{
  "question": "Complete question text with numbered statements if needed",
  "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...",
  "correct_answer": "a|b|c|d",
  "explanation": "Detailed explanation",
  "difficulty": "${difficulty}",
  "sub_topic": "${subTopic}"
}`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  if (text.includes('```json')) text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  return JSON.parse(text);
}

async function main() {
  for (const [mockFile, indices] of Object.entries(byMock)) {
    console.log(`📄 ${mockFile} — fixing ${indices.length} questions: Q${indices.join(', Q')}`);
    
    const data = JSON.parse(fs.readFileSync(path.join(mocksDir, mockFile), 'utf-8'));
    
    for (const qi of indices) {
      try {
        process.stdout.write(`   Q${qi}...`);
        const fixed = await fixQuestion(mockFile, qi);
        
        // Replace in data
        data.questions[qi - 1] = {
          ...data.questions[qi - 1],
          question: fixed.question,
          option_a: fixed.option_a,
          option_b: fixed.option_b,
          option_c: fixed.option_c,
          option_d: fixed.option_d,
          correct_answer: fixed.correct_answer,
          explanation: fixed.explanation,
        };
        console.log(' ✅ fixed');
        await new Promise(r => setTimeout(r, 2000));
      } catch (err: any) {
        console.log(` ❌ ${err.message?.substring(0, 60)}`);
      }
    }

    // Save
    fs.writeFileSync(path.join(mocksDir, mockFile), JSON.stringify(data, null, 2));
    console.log(`   💾 Saved ${mockFile}\n`);
  }

  console.log('✅ All fixes applied!\n');
}

main().catch(console.error);
