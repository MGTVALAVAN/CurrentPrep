/**
 * PYQ Ingestion Pipeline — Extracts, parses, and categorizes UPSC Prelims
 * questions from 30 years of PDF papers using pdf-parse + Gemini AI.
 *
 * Usage: npx tsx src/data/pyq/ingest-pyq.ts
 *
 * Output: src/data/pyq/pyq-database.json
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const { PDFParse } = require('pdf-parse');

const PDF_DIR = path.join(process.cwd(), 'src', 'data', 'pyq', 'pdfs');
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'data', 'pyq', 'pyq-database.json');
const PROGRESS_FILE = path.join(process.cwd(), 'src', 'data', 'pyq', 'ingest-progress.json');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not set.');
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PYQuestion {
    id: string;
    year: number;
    paper: string;
    questionNumber: number;
    question: string;
    options: string[];
    answer?: string;
    topic: string;
    subtopic: string;
    gsPaper: string;
    entities: string[];
    keywords: string[];
}

interface PYQDatabase {
    metadata: {
        totalQuestions: number;
        yearRange: string;
        lastUpdated: string;
        papers: number;
    };
    questions: PYQuestion[];
}

// ---------------------------------------------------------------------------
// PDF Text Extraction
// ---------------------------------------------------------------------------

async function extractPdfText(filePath: string): Promise<string> {
    const buf = readFileSync(filePath);
    const uint8 = new Uint8Array(buf);
    const parser = new PDFParse(uint8, { verbosity: 0 });
    const result = await parser.getText();
    return result.text || '';
}

// ---------------------------------------------------------------------------
// Extract year from filename
// ---------------------------------------------------------------------------

function extractYear(filename: string): number {
    // Match patterns like "1995-GS1", "upsc-cse-2011", "2024-GS1"
    const match = filename.match(/(19|20)\d{2}/);
    return match ? parseInt(match[0]) : 0;
}

// ---------------------------------------------------------------------------
// Split raw text into individual questions
// ---------------------------------------------------------------------------

function splitIntoQuestions(text: string, year: number): Array<{ question: string; options: string[]; answer?: string; questionNumber: number }> {
    const questions: Array<{ question: string; options: string[]; answer?: string; questionNumber: number }> = [];

    // Clean up the text
    let cleaned = text
        .replace(/Education Province.*?\n/gi, '')
        .replace(/https?:\/\/[^\s]+/g, '')
        .replace(/Page \d+ of \d+/gi, '')
        .replace(/UPSC-CSE Prelims.*?\n/gi, '')
        .replace(/UPSC Prelims.*?\n/gi, '')
        .replace(/Previous Year.*?\n/gi, '')
        .replace(/General Studies.*?Paper\s*/gi, '')
        .trim();

    // Split by question numbers: "1.", "2.", etc. at start of line or after newline
    // Use regex to find question boundaries
    const questionRegex = /(?:^|\n)\s*(\d{1,3})\.\s+/g;
    const boundaries: { index: number; num: number }[] = [];
    let match;

    while ((match = questionRegex.exec(cleaned)) !== null) {
        const num = parseInt(match[1]);
        // Only accept sequential or near-sequential question numbers
        if (num >= 1 && num <= 200) {
            boundaries.push({ index: match.index, num });
        }
    }

    for (let i = 0; i < boundaries.length; i++) {
        const start = boundaries[i].index;
        const end = i < boundaries.length - 1 ? boundaries[i + 1].index : cleaned.length;
        const qBlock = cleaned.substring(start, end).trim();
        const qNum = boundaries[i].num;

        // Extract options (a), b), c), d) or (a), (b), (c), (d) or A., B., C., D.
        const optionRegex = /(?:^|\n)\s*(?:\(?([a-dA-D1-4])\)?[\.\):]?\s+)/g;
        const optionMatches: { index: number; letter: string }[] = [];
        let optMatch;

        while ((optMatch = optionRegex.exec(qBlock)) !== null) {
            optionMatches.push({ index: optMatch.index, letter: optMatch[1].toLowerCase() });
        }

        // Extract the question text (before first option)
        let questionText = qBlock;
        const options: string[] = [];

        if (optionMatches.length >= 3) {
            questionText = qBlock.substring(0, optionMatches[0].index).trim();

            for (let j = 0; j < optionMatches.length; j++) {
                const optStart = optionMatches[j].index;
                const optEnd = j < optionMatches.length - 1 ? optionMatches[j + 1].index : qBlock.length;
                let optText = qBlock.substring(optStart, optEnd).trim();
                // Clean option prefix
                optText = optText.replace(/^\(?\s*[a-dA-D1-4]\s*\)?[\.\):]\s*/, '').trim();

                // Check if answer is embedded
                if (optText.match(/^Ans/i)) break;
                options.push(optText);
            }
        }

        // Remove question number from text
        questionText = questionText.replace(/^\d{1,3}\.\s*/, '').trim();

        // Extract answer if present
        const ansMatch = qBlock.match(/Ans(?:wer)?[:\s]*\(?([a-dA-D1-4])\)?/i);
        const answer = ansMatch ? ansMatch[1].toLowerCase() : undefined;

        // Clean up newlines
        questionText = questionText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

        if (questionText.length > 15) {
            questions.push({
                question: questionText,
                options: options.slice(0, 4),
                answer,
                questionNumber: qNum,
            });
        }
    }

    return questions;
}

// ---------------------------------------------------------------------------
// Gemini AI Categorization
// ---------------------------------------------------------------------------

async function categorizeWithGemini(questions: Array<{ question: string; year: number; questionNumber: number }>): Promise<Array<{
    topic: string;
    subtopic: string;
    gsPaper: string;
    entities: string[];
    keywords: string[];
}>> {
    const questionsText = questions.map((q, i) =>
        `Q${i + 1} (${q.year}, #${q.questionNumber}): ${q.question.substring(0, 300)}`
    ).join('\n\n');

    const prompt = `You are a UPSC syllabus expert. Categorize each of these UPSC Prelims questions.

For each question, provide:
1. topic: One of: Polity, Economy, Environment, History, Geography, Science & Technology, International Relations, Society, Defence & Security, Art & Culture
2. subtopic: Specific subtopic (e.g., "Constitutional Bodies", "Monetary Policy", "Biodiversity", "Medieval History")
3. gsPaper: Which Mains GS paper it maps to: GS1, GS2, GS3, or GS4
4. entities: Key named entities (Acts, Articles, organizations, species, treaties, places, etc.) — max 5
5. keywords: General UPSC-relevant keywords — max 5

QUESTIONS:
${questionsText}

Return ONLY valid JSON array:
[
  { "topic": "...", "subtopic": "...", "gsPaper": "...", "entities": ["..."], "keywords": ["..."] },
  ...
]
Return exactly ${questions.length} objects, one per question, in order.`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.8,
                    responseMimeType: 'application/json',
                },
            }),
        }
    );

    if (response.status === 429) {
        const body = await response.text();
        const retryMatch = body.match(/retry.*?(\d+\.?\d*)\s*s/i);
        const delay = retryMatch ? parseFloat(retryMatch[1]) : 15;
        console.log(`  ⏳ Rate limited, waiting ${delay}s...`);
        await new Promise(r => setTimeout(r, delay * 1000));
        return categorizeWithGemini(questions); // retry
    }

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No text from Gemini');

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) throw new Error('Expected array from Gemini');

    return parsed;
}

// ---------------------------------------------------------------------------
// Progress tracking (resume capability)
// ---------------------------------------------------------------------------

function loadProgress(): Set<string> {
    if (existsSync(PROGRESS_FILE)) {
        try {
            const data = JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
            return new Set(data.completedFiles || []);
        } catch { }
    }
    return new Set();
}

function saveProgress(completedFiles: Set<string>) {
    writeFileSync(PROGRESS_FILE, JSON.stringify({ completedFiles: Array.from(completedFiles) }, null, 2));
}

function loadExistingDb(): PYQDatabase {
    if (existsSync(OUTPUT_FILE)) {
        try {
            return JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8'));
        } catch { }
    }
    return {
        metadata: { totalQuestions: 0, yearRange: '', lastUpdated: '', papers: 0 },
        questions: [],
    };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    console.log('🎯 PYQ Ingestion Pipeline');
    console.log('=' .repeat(60));

    const files = readdirSync(PDF_DIR)
        .filter(f => f.endsWith('.pdf'))
        .sort((a, b) => extractYear(a) - extractYear(b));

    console.log(`📄 Found ${files.length} PDF files`);

    const completedFiles = loadProgress();
    const db = loadExistingDb();

    let totalProcessed = db.questions.length;
    let filesProcessed = completedFiles.size;

    for (const file of files) {
        if (completedFiles.has(file)) {
            console.log(`⏭️  Skipping ${file} (already processed)`);
            continue;
        }

        const year = extractYear(file);
        if (!year) {
            console.log(`⚠️  Skipping ${file} (can't determine year)`);
            continue;
        }

        console.log(`\n📖 Processing: ${file} (Year: ${year})`);

        // Step 1: Extract text from PDF
        let text: string;
        try {
            text = await extractPdfText(path.join(PDF_DIR, file));
            console.log(`  📝 Extracted ${text.length} characters`);
        } catch (err: any) {
            console.error(`  ❌ PDF extraction failed: ${err.message}`);
            continue;
        }

        // Step 2: Split into individual questions
        const rawQuestions = splitIntoQuestions(text, year);
        console.log(`  🔢 Found ${rawQuestions.length} questions`);

        if (rawQuestions.length === 0) {
            console.warn(`  ⚠️  No questions extracted from ${file}`);
            completedFiles.add(file);
            saveProgress(completedFiles);
            continue;
        }

        // Step 3: Categorize with Gemini in batches of 10
        const BATCH_SIZE = 10;
        const questionsForYear: PYQuestion[] = [];

        for (let i = 0; i < rawQuestions.length; i += BATCH_SIZE) {
            const batch = rawQuestions.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(rawQuestions.length / BATCH_SIZE);

            console.log(`  🤖 Categorizing batch ${batchNum}/${totalBatches} (Q${batch[0].questionNumber}-Q${batch[batch.length - 1].questionNumber})...`);

            try {
                const categories = await categorizeWithGemini(
                    batch.map(q => ({ question: q.question, year, questionNumber: q.questionNumber }))
                );

                for (let j = 0; j < batch.length; j++) {
                    const q = batch[j];
                    const cat = categories[j] || {
                        topic: 'Unknown',
                        subtopic: 'Unknown',
                        gsPaper: 'GS1',
                        entities: [],
                        keywords: [],
                    };

                    questionsForYear.push({
                        id: `P${year}-Q${q.questionNumber}`,
                        year,
                        paper: 'Prelims GS1',
                        questionNumber: q.questionNumber,
                        question: q.question,
                        options: q.options,
                        answer: q.answer,
                        topic: cat.topic || 'Unknown',
                        subtopic: cat.subtopic || 'Unknown',
                        gsPaper: cat.gsPaper || 'GS1',
                        entities: cat.entities || [],
                        keywords: cat.keywords || [],
                    });
                }

                // Small delay between batches to avoid rate limits
                if (i + BATCH_SIZE < rawQuestions.length) {
                    await new Promise(r => setTimeout(r, 2000));
                }
            } catch (err: any) {
                console.error(`  ❌ Categorization error: ${err.message}`);
                // Save what we have so far and retry later
                console.log(`  💾 Saving progress before continuing...`);
                
                // Save uncategorized questions with defaults
                for (const q of batch) {
                    questionsForYear.push({
                        id: `P${year}-Q${q.questionNumber}`,
                        year,
                        paper: 'Prelims GS1',
                        questionNumber: q.questionNumber,
                        question: q.question,
                        options: q.options,
                        answer: q.answer,
                        topic: 'Uncategorized',
                        subtopic: 'Uncategorized',
                        gsPaper: 'Unknown',
                        entities: [],
                        keywords: [],
                    });
                }
            }
        }

        // Add to database
        // Remove any existing questions for this year (in case of re-run)
        db.questions = db.questions.filter(q => q.year !== year);
        db.questions.push(...questionsForYear);

        totalProcessed = db.questions.length;
        filesProcessed++;

        console.log(`  ✅ ${questionsForYear.length} questions processed for ${year}`);

        // Mark file as completed and save
        completedFiles.add(file);
        saveProgress(completedFiles);

        // Save database after each file
        const years = Array.from(new Set(db.questions.map(q => q.year))).sort();
        db.metadata = {
            totalQuestions: db.questions.length,
            yearRange: `${years[0]}-${years[years.length - 1]}`,
            lastUpdated: new Date().toISOString(),
            papers: filesProcessed,
        };
        writeFileSync(OUTPUT_FILE, JSON.stringify(db, null, 2));
        console.log(`  💾 Database saved: ${db.questions.length} total questions`);

        // Brief pause between files
        await new Promise(r => setTimeout(r, 1000));
    }

    // Final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 INGESTION COMPLETE`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Total questions: ${db.questions.length}`);
    console.log(`📄 Papers processed: ${filesProcessed}`);
    console.log(`📅 Year range: ${db.metadata.yearRange}`);

    // Topic distribution
    const topicCounts: Record<string, number> = {};
    for (const q of db.questions) {
        topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    }
    console.log(`\n📑 Topic Distribution:`);
    Object.entries(topicCounts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([topic, count]) => {
            const pct = ((count / db.questions.length) * 100).toFixed(1);
            console.log(`  ${topic}: ${count} (${pct}%)`);
        });

    console.log(`\n💾 Output: ${OUTPUT_FILE}`);
}

main().catch(console.error);
