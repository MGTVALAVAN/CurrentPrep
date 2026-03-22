// ============================================================
// Current Affairs Question Generator
// Uses Frontline news database (past 2 years) as context
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
const generatedDir = path.resolve(dataDir, 'generated');

// Load API key
const apiKey = process.env.GEMINI_API_KEY || fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf-8')
  .split('\n').find(l => l.startsWith('GEMINI_API_KEY'))?.split('=')[1]?.trim() || '';

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Ensure output dir
if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

// ============================================================
// Load Frontline news database
// ============================================================
function loadFrontlineNews(): Record<string, Array<{date: string, text: string, keywords: string}>> {
  const filepath = path.join(dataDir, 'frontline_current_affairs.json');
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

// ============================================================
// Map Frontline categories to Current Affairs sub-topics
// ============================================================
interface SubTopicConfig {
  id: string;
  label: string;
  count_per_mock: number;
  frontline_categories: string[];
  extra_context: string;
}

const SUB_TOPICS: SubTopicConfig[] = [
  {
    id: 'ca-national',
    label: 'National Affairs',
    count_per_mock: 35,
    frontline_categories: ['Polity', 'General', 'Economy', 'Social Issues'],
    extra_context: `Focus on:
- Government schemes and policies announced/modified in 2024-2026
- Constitutional amendments and judicial verdicts
- Elections, political events, governance reforms
- Economic policy changes, budget highlights
- Social welfare programmes and their impact
- Education policy (NEP 2020), health policy changes`,
  },
  {
    id: 'ca-international',
    label: 'International Relations & Organisations',
    count_per_mock: 30,
    frontline_categories: ['International Relations'],
    extra_context: `Focus on:
- UN organisations: UNGA, UNSC, UNESCO, UNHCR, UNICEF, WHO, ILO, FAO, UNEP, UNDP — their mandates, headquarters, heads, recent decisions
- International forums: G20 (India presidency 2023, Brazil 2024, South Africa 2025), G7, BRICS expansion (new members: Egypt, Ethiopia, Iran, UAE, Saudi Arabia), SCO, QUAD, ASEAN
- Treaties and agreements: Paris Agreement updates, UNFCCC COP28/29, Nuclear treaties (NPT, CTBT), trade agreements (India-EFTA TEPA, RCEP)
- International courts: ICJ, ICC — recent cases
- Multilateral banks: World Bank, IMF, ADB, NDB, AIIB — recent lending, reforms
- India's bilateral relations: India-US, India-China, India-Russia, India-Japan, India-Middle East
- Regional organisations: SAARC, BIMSTEC, Indian Ocean Rim Association (IORA)
- Key geopolitical events: Russia-Ukraine, Israel-Palestine, Red Sea crisis
- India at international stage: UNSC non-permanent membership bid, Voice of Global South Summit`,
  },
  {
    id: 'ca-awards',
    label: 'Awards, Appointments & Events',
    count_per_mock: 15,
    frontline_categories: ['History & Culture', 'General'],
    extra_context: `Focus on:
- Padma awards (Bharat Ratna, Padma Vibhushan, Padma Bhushan, Padma Shri) — recent recipients
- Nobel Prizes 2024, 2025 — winners, fields, significance
- Sports: Olympics Paris 2024, Asian Games, Commonwealth Games, Cricket World Cup
- Literary awards: Sahitya Akademi, Jnanpith, Booker Prize, Pulitzer
- Key appointments: CJI, CAG, Election Commissioner, RBI Governor, Chiefs of Staff
- National and international days/events
- Cultural events, UNESCO heritage designations for India`,
  },
  {
    id: 'ca-reports',
    label: 'Reports, Indices & UN Bodies',
    count_per_mock: 20,
    frontline_categories: ['Environment', 'Science & Technology', 'General'],
    extra_context: `Focus on:
- HDI (UNDP): India's ranking, components (life expectancy, education, GNI per capita)
- Global Hunger Index (Concern Worldwide + Welthungerhilfe): India's position, methodology
- World Happiness Report: rankings, Gallup surveys
- Ease of Doing Business (World Bank — now B-READY): India's ranking
- Gender Gap Report (WEF): India's position
- Climate Change Performance Index
- Environmental Performance Index (Yale)
- NITI Aayog reports: SDG India Index, Multidimensional Poverty Index
- WHO reports: disease surveillance, health indicators
- World Bank/IMF: GDP projections, WEO, Global Financial Stability Report  
- IPCC Assessment Reports
- State of World's Children (UNICEF)
- Global Peace Index
- Know which organisation publishes which report — very high UPSC probability`,
  },
];

// ============================================================
// Build prompt with actual news context
// ============================================================
function buildPrompt(subTopic: SubTopicConfig, newsItems: string[], batchNum: number, count: number): string {
  const newsContext = newsItems.join('\n');
  
  return `You are a senior UPSC Civil Services Preliminary Examination question setter with 20 years of experience.

Generate exactly ${count} unique MCQ questions for:
- Subject: Current Affairs
- Sub-topic: ${subTopic.label} (tag as "${subTopic.id}")
- Difficulty mix: approximately 30% Easy, 40% Medium, 30% Hard

REAL NEWS CONTEXT (from Frontline Magazine, past 2 years):
These are actual news items that were covered. Frame questions based on these topics and related subject areas:
${newsContext}

${subTopic.extra_context}

IMPORTANT RULES:
1. Each question MUST be based on or inspired by a real event/topic from the news context above
2. Don't just ask "what happened" — ask about the underlying concept, organisation, law, or treaty
3. For international relations: always test knowledge of the organisation's structure, mandate, and membership
4. Frame questions as factual MCQs testing knowledge, NOT current affairs recall
5. Use "assertion-reason" format for 10% of questions
6. Use "which of the following is/are correct" format for 20% of questions
7. DO NOT mention "recently" or "in the news" in question text

Return a JSON object:
{
  "questions": [
    {
      "question": "...",
      "options": { "a": "...", "b": "...", "c": "...", "d": "..." },
      "correct_answer": "a|b|c|d",
      "explanation": "Detailed explanation with factual basis",
      "difficulty": "easy|medium|hard",
      "sub_topic": "${subTopic.id}",
      "source_context": "Brief note on which news topic inspired this question"
    }
  ]
}

Return ONLY the JSON object, no markdown formatting.
Batch ${batchNum} — ensure all ${count} questions are unique and different from previous batches.`;
}

// ============================================================
// Generate questions for one batch
// ============================================================
async function generateBatch(subTopic: SubTopicConfig, newsItems: string[], batchNum: number, count: number): Promise<number> {
  const prompt = buildPrompt(subTopic, newsItems, batchNum, count);
  
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean JSON
    let jsonStr = text;
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    jsonStr = jsonStr.trim();
    
    const data = JSON.parse(jsonStr);
    const questions = data.questions || [];
    
    // Validate
    const valid = questions.filter((q: any) => 
      q.question && q.options && q.correct_answer && q.explanation && q.difficulty && q.sub_topic
    );
    
    // Force correct sub_topic
    valid.forEach((q: any) => { q.sub_topic = subTopic.id; });
    
    // Save
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `current_affairs_${subTopic.id}_${timestamp}.json`;
    fs.writeFileSync(
      path.join(generatedDir, filename),
      JSON.stringify({ questions: valid }, null, 2)
    );
    
    return valid.length;
  } catch (err: any) {
    console.error(`   ❌ Error: ${err.message?.substring(0, 80)}`);
    return 0;
  }
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('\n🧠 UPSC Mock Test — Current Affairs Generator');
  console.log('══════════════════════════════════════════════════');
  console.log('📰 Using Frontline news database (past 2 years)\n');
  
  const news = loadFrontlineNews();
  
  // Show available news
  for (const [cat, items] of Object.entries(news)) {
    console.log(`   ${cat}: ${items.length} items`);
  }
  console.log();
  
  let grandValid = 0;
  let grandInvalid = 0;
  
  for (const subTopic of SUB_TOPICS) {
    // Gather relevant news items
    const relevantNews: string[] = [];
    for (const cat of subTopic.frontline_categories) {
      const items = news[cat] || [];
      for (const item of items) {
        relevantNews.push(`[${item.date}] ${item.text.substring(0, 150)}`);
      }
    }
    
    console.log(`\n📚 ${subTopic.label} — ${relevantNews.length} news items, generating ${subTopic.count_per_mock * 5} Qs`);
    
    const totalNeeded = subTopic.count_per_mock * 5;
    const batchSize = 25;
    const numBatches = Math.ceil(totalNeeded / batchSize);
    
    let subTopicValid = 0;
    
    for (let i = 0; i < numBatches; i++) {
      const count = Math.min(batchSize, totalNeeded - (i * batchSize));
      
      // Rotate through news items to give different context per batch
      const startIdx = (i * 30) % relevantNews.length;
      const batchNews = [];
      for (let j = 0; j < Math.min(20, relevantNews.length); j++) {
        batchNews.push(relevantNews[(startIdx + j) % relevantNews.length]);
      }
      
      process.stdout.write(`[${i + 1}/${numBatches}] Generating ${count} Qs for ${subTopic.label}...`);
      
      const valid = await generateBatch(subTopic, batchNews, i + 1, count);
      subTopicValid += valid;
      grandValid += valid;
      
      console.log(`\n   ✅ ${valid} valid`);
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 5000));
    }
    
    console.log(`   📊 ${subTopic.label} total: ${subTopicValid}/${totalNeeded} generated`);
  }
  
  console.log('\n══════════════════════════════════════════════════');
  console.log(`📊 Current Affairs Generation Complete`);
  console.log(`   ✅ Valid: ${grandValid}`);
  console.log(`   💾 Saved to: ${generatedDir}`);
  console.log('══════════════════════════════════════════════════\n');
}

main().catch(console.error);
