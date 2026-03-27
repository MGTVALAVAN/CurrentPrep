/**
 * Extract CSAT questions from all daily ePaper JSON files
 * and produce a unified CSAT question bank at mock-engine/data/unified-csat-questions.json
 *
 * Usage: npx tsx scripts/extract-csat-questions.ts
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ─── Types ─────────────────────────────────────────────────────────────

interface CSATQuestion {
    uid: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;  // A | B | C | D
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    subject: string;         // comprehension | logical_reasoning | data_interpretation | basic_numeracy | decision_making | english_comprehension
    sub_topic: string;       // syllogism, blood_relation, coding_decoding, etc.
    passage?: string;        // for comprehension questions
    source_date: string;     // yyyy-mm-dd
}

// ─── Category Mapping ─────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, { subject: string; sub_topic: string }> = {
    syllogism:           { subject: 'logical_reasoning', sub_topic: 'Syllogism' },
    statement_assumption: { subject: 'logical_reasoning', sub_topic: 'Statement & Assumption' },
    statement_conclusion: { subject: 'logical_reasoning', sub_topic: 'Statement & Conclusion' },
    blood_relation:      { subject: 'logical_reasoning', sub_topic: 'Blood Relation' },
    seating_arrangement: { subject: 'logical_reasoning', sub_topic: 'Seating Arrangement' },
    direction_sense:     { subject: 'logical_reasoning', sub_topic: 'Direction Sense' },
    coding_decoding:     { subject: 'logical_reasoning', sub_topic: 'Coding & Decoding' },
    series_sequence:     { subject: 'logical_reasoning', sub_topic: 'Series & Sequence' },
    puzzle:              { subject: 'logical_reasoning', sub_topic: 'Puzzle' },
    analogy:             { subject: 'logical_reasoning', sub_topic: 'Analogy' },
    classification:      { subject: 'logical_reasoning', sub_topic: 'Classification' },
    order_ranking:       { subject: 'logical_reasoning', sub_topic: 'Order & Ranking' },
    venn_diagram:        { subject: 'logical_reasoning', sub_topic: 'Venn Diagram' },
    logical:             { subject: 'logical_reasoning', sub_topic: 'Logical Reasoning' },
    verbal:              { subject: 'logical_reasoning', sub_topic: 'Verbal Reasoning' },
    decision_making:     { subject: 'decision_making', sub_topic: 'Decision Making' },
    quantitative:        { subject: 'basic_numeracy', sub_topic: 'Quantitative Aptitude' },
    percentage:          { subject: 'basic_numeracy', sub_topic: 'Percentage' },
    ratio:               { subject: 'basic_numeracy', sub_topic: 'Ratio & Proportion' },
    time_work:           { subject: 'basic_numeracy', sub_topic: 'Time & Work' },
    speed_distance:      { subject: 'basic_numeracy', sub_topic: 'Speed, Distance & Time' },
    profit_loss:         { subject: 'basic_numeracy', sub_topic: 'Profit & Loss' },
    data_interpretation: { subject: 'data_interpretation', sub_topic: 'Data Interpretation' },
};

// ─── Option Parsing ───────────────────────────────────────────────────

function parseOptions(options: any[]): { option_a: string; option_b: string; option_c: string; option_d: string } {
    const result = { option_a: '', option_b: '', option_c: '', option_d: '' };
    const keys = ['option_a', 'option_b', 'option_c', 'option_d'] as const;

    for (let i = 0; i < Math.min(4, options.length); i++) {
        let text = String(options[i]);
        // Remove leading "A. ", "B. ", "(a) " etc.
        text = text.replace(/^[A-Da-d][\.\)\s]+\s*/, '').trim();
        result[keys[i]] = text;
    }

    return result;
}

function parseAnswer(answer: string): string {
    if (!answer) return 'A';
    const cleaned = answer.toUpperCase().trim();
    // Handle "A", "(A)", "A.", "Option A", etc.
    const match = cleaned.match(/[ABCD]/);
    return match ? match[0] : 'A';
}

function classifyUnknown(question: string): { subject: string; sub_topic: string } {
    const q = question.toLowerCase();

    // Comprehension clues
    if (q.includes('passage') || q.includes('according to the author') || q.includes('the author')) {
        return { subject: 'comprehension', sub_topic: 'Reading Comprehension' };
    }

    // Syllogism clues
    if (q.includes('syllogism') || (q.includes('statements:') && q.includes('conclusions:'))) {
        return { subject: 'logical_reasoning', sub_topic: 'Syllogism' };
    }

    // Statement/assumption
    if (q.includes('assumption') && q.includes('statement')) {
        return { subject: 'logical_reasoning', sub_topic: 'Statement & Assumption' };
    }

    // Blood relation
    if (q.includes('father') || q.includes('mother') || q.includes('brother') || q.includes('sister') || q.includes('son') || q.includes('daughter')) {
        if (q.includes('relation') || q.includes('family')) {
            return { subject: 'logical_reasoning', sub_topic: 'Blood Relation' };
        }
    }

    // Direction sense
    if (q.includes('direction') && (q.includes('north') || q.includes('south') || q.includes('east') || q.includes('west'))) {
        return { subject: 'logical_reasoning', sub_topic: 'Direction Sense' };
    }

    // Seating / arrangement
    if (q.includes('seating') || q.includes('arrangement') || q.includes('sitting in a row') || q.includes('circular')) {
        return { subject: 'logical_reasoning', sub_topic: 'Seating Arrangement' };
    }

    // Coding/decoding
    if (q.includes('coded') || q.includes('coding') || q.includes('code language')) {
        return { subject: 'logical_reasoning', sub_topic: 'Coding & Decoding' };
    }

    // Series / sequence / pattern
    if (q.includes('series') || q.includes('next number') || q.includes('pattern') || q.includes('sequence')) {
        return { subject: 'logical_reasoning', sub_topic: 'Series & Sequence' };
    }

    // Numeracy clues
    if (q.includes('percentage') || q.includes('ratio') || q.includes('profit') || q.includes('loss') ||
        q.includes('speed') || q.includes('time and work') || q.includes('average') || q.includes('calculate')) {
        return { subject: 'basic_numeracy', sub_topic: 'Quantitative Aptitude' };
    }

    // Data interpretation
    if (q.includes('table') || q.includes('graph') || q.includes('chart') || q.includes('data')) {
        return { subject: 'data_interpretation', sub_topic: 'Data Interpretation' };
    }

    // Decision making
    if (q.includes('decision') || q.includes('dilemma') || q.includes('course of action') || q.includes('should')) {
        return { subject: 'decision_making', sub_topic: 'Decision Making' };
    }

    // Default to logical reasoning
    return { subject: 'logical_reasoning', sub_topic: 'General Reasoning' };
}

function generateUID(dateStr: string, type: string, index: number, question: string): string {
    const hash = crypto.createHash('md5').update(question).digest('hex').slice(0, 8);
    return `csat-${type}-${dateStr}-${index}-${hash}`;
}

function guessDifficulty(question: string, category: string): 'easy' | 'medium' | 'hard' {
    const q = question.toLowerCase();
    const wordCount = q.split(/\s+/).length;

    // Long questions tend to be harder
    if (wordCount > 100) return 'hard';
    if (wordCount > 60) return 'medium';

    // Categories that are typically harder
    if (['data_interpretation', 'decision_making'].includes(category)) return 'medium';
    if (['syllogism', 'coding_decoding'].includes(category)) return 'easy';

    return 'medium';
}

// ─── Main Extraction ──────────────────────────────────────────────────

function extractCSATQuestions(): CSATQuestion[] {
    const epaperDir = path.join(process.cwd(), 'src', 'data', 'epaper');
    if (!fs.existsSync(epaperDir)) {
        console.error('❌ ePaper directory not found');
        return [];
    }

    const files = fs.readdirSync(epaperDir)
        .filter(f => f.startsWith('epaper-') && f.endsWith('.json') && f !== 'epaper-index.json')
        .sort();

    const allQuestions: CSATQuestion[] = [];
    const seenHashes = new Set<string>();
    let filesProcessed = 0;
    let filesWithCSAT = 0;

    for (const file of files) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(epaperDir, file), 'utf-8'));
            const dateStr = file.replace('epaper-', '').replace('.json', '');
            const csat = data.csatMocks;

            if (!csat) continue;

            let found = false;

            // ── Extract Comprehension Questions ────────────────────────
            const comprehension = csat.comprehension || csat.comprehensionPassages || [];
            for (let pIdx = 0; pIdx < comprehension.length; pIdx++) {
                const passage = comprehension[pIdx];
                const passageText = passage.passage || '';
                const questions = passage.questions || [];

                for (let qIdx = 0; qIdx < questions.length; qIdx++) {
                    const q = questions[qIdx];
                    if (!q.question || !q.options || q.options.length < 4) continue;

                    const qHash = crypto.createHash('md5').update(q.question).digest('hex');
                    if (seenHashes.has(qHash)) continue;
                    seenHashes.add(qHash);

                    const options = parseOptions(q.options);
                    const uid = generateUID(dateStr, 'comp', qIdx, q.question);

                    allQuestions.push({
                        uid,
                        question: q.question,
                        ...options,
                        correct_answer: parseAnswer(q.answer),
                        explanation: q.explanation || '',
                        difficulty: guessDifficulty(q.question + passageText, 'comprehension'),
                        subject: 'comprehension',
                        sub_topic: 'Reading Comprehension',
                        passage: passageText,
                        source_date: dateStr,
                    });
                    found = true;
                }
            }

            // ── Extract Reasoning / Other Questions ───────────────────
            const reasoning = csat.reasoning || csat.reasoningQuestions || [];
            for (let rIdx = 0; rIdx < reasoning.length; rIdx++) {
                const q = reasoning[rIdx];
                if (!q.question || !q.options || q.options.length < 4) continue;

                const qHash = crypto.createHash('md5').update(q.question).digest('hex');
                if (seenHashes.has(qHash)) continue;
                seenHashes.add(qHash);

                const category = (q.category || 'unknown').toLowerCase().replace(/\s+/g, '_');
                const mapping = CATEGORY_MAP[category] || classifyUnknown(q.question);
                const options = parseOptions(q.options);
                const uid = generateUID(dateStr, 'reas', rIdx, q.question);

                allQuestions.push({
                    uid,
                    question: q.question,
                    ...options,
                    correct_answer: parseAnswer(q.answer),
                    explanation: q.explanation || '',
                    difficulty: guessDifficulty(q.question, category),
                    subject: mapping.subject,
                    sub_topic: mapping.sub_topic,
                    source_date: dateStr,
                });
                found = true;
            }

            if (found) filesWithCSAT++;
            filesProcessed++;
        } catch {
            // skip malformed
        }
    }

    return allQuestions;
}

// ─── Run ──────────────────────────────────────────────────────────────

const questions = extractCSATQuestions();

// Stats
const subjectCounts: Record<string, number> = {};
const subTopicCounts: Record<string, number> = {};
const difficultyCounts: Record<string, number> = {};
const withPassage = questions.filter(q => q.passage).length;

for (const q of questions) {
    subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
    subTopicCounts[q.sub_topic] = (subTopicCounts[q.sub_topic] || 0) + 1;
    difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
}

// Save
const outputDir = path.join(process.cwd(), 'mock-engine', 'data');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const output = {
    paper: 'csat',
    generatedAt: new Date().toISOString(),
    totalQuestions: questions.length,
    subjectDistribution: subjectCounts,
    questions: questions.map(({ source_date, ...rest }) => rest), // strip source_date from output
};

const outputPath = path.join(outputDir, 'unified-csat-questions.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('\n✅ CSAT Question Bank Generated');
console.log(`   📁 Output: ${outputPath}`);
console.log(`   📊 Total questions: ${questions.length}`);
console.log(`   📖 With passages: ${withPassage}`);
console.log('\n   Subject Distribution:');
for (const [s, c] of Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${s}: ${c}`);
}
console.log('\n   Sub-topic Distribution:');
for (const [s, c] of Object.entries(subTopicCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${s}: ${c}`);
}
console.log('\n   Difficulty Distribution:');
for (const [d, c] of Object.entries(difficultyCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${d}: ${c}`);
}
