import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

const apiKey = fs.readFileSync('.env', 'utf-8').split('\n').find(l => l.startsWith('GEMINI_API_KEY'))?.split('=')[1]?.trim() || '';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function test() {
  try {
    const result = await model.generateContent('Say hello in 5 words');
    console.log('✅ API works:', result.response.text());
  } catch (err: any) {
    console.log('❌ API error:', err.message?.substring(0, 100));
  }
}
test();
