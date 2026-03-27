import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ─── Types ─────────────────────────────────────────────────────────────

interface UnifiedQuestion {
    uid: string;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    subject: string;
    sub_topic: string;
    mock_id?: string;
    passage?: string;            // for CSAT comprehension questions
    passage_id?: string;         // groups questions that share a passage
}

interface GenerateRequest {
    type: 'custom' | 'full_length';
    paper?: 'gs' | 'csat';       // which paper (default: gs)
    subjects?: string[];         // for custom
    difficulty?: string;         // for custom: easy | medium | hard | mixed
    questionCount?: number;      // for custom: 10 | 25 | 50 | 100
    seenQuestionIds?: string[];  // for repeat tracking
}

// UPSC Full-Length GS Subject Distribution (100 questions)
const GS_FULL_LENGTH_DISTRIBUTION: Record<string, number> = {
    current_affairs: 28,
    polity: 14,
    economics: 13,
    environment: 13,
    history: 8,
    art_culture: 4,
    geography: 10,
    science: 8,
    society: 2,
};

// UPSC Full-Length CSAT Subject Distribution (80 questions)
// Based on 2024 UPSC CSAT PYQ analysis: Maths 46%, Comprehension 34%, Reasoning 20%
const CSAT_FULL_LENGTH_DISTRIBUTION: Record<string, number> = {
    maths: 37,                  // 46% — Number System, Percentage, DI, etc.
    comprehension: 27,          // 34% — Reading Comprehension passages
    reasoning: 16,              // 20% — Puzzle, Statements, Order Ranking, etc.
};

// Difficulty mix for full length: 25% easy, 50% medium, 25% hard
const FULL_LENGTH_DIFFICULTY_MIX = { easy: 0.25, medium: 0.50, hard: 0.25 };

// Time per question in seconds
const GS_SECONDS_PER_QUESTION = 72;
const CSAT_SECONDS_PER_QUESTION = 90;  // CSAT needs more time per question

// Marking schemes
const GS_MARKING = { marksPerCorrect: 2, negativeMarks: 0.67 };
const CSAT_MARKING = { marksPerCorrect: 2.5, negativeMarks: 0.83 };

// ─── API Handler ───────────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        const body: GenerateRequest = await request.json();
        const { type, paper = 'gs', subjects, difficulty, questionCount, seenQuestionIds = [] } = body;
        const subtopics = (body as any).subtopics as string[] | undefined;

        const isCSAT = paper === 'csat';

        // Load the appropriate question bank
        let allQuestions: UnifiedQuestion[];

        if (isCSAT) {
            allQuestions = loadCSATQuestionBank();
        } else {
            const unifiedPath = path.join(process.cwd(), 'mock-engine', 'data', 'unified-questions.json');
            if (!fs.existsSync(unifiedPath)) {
                return NextResponse.json({ error: 'Question bank not found' }, { status: 500 });
            }
            const unifiedData = JSON.parse(fs.readFileSync(unifiedPath, 'utf-8'));
            allQuestions = unifiedData.questions || [];
            // Also load daily GS mock questions from ePaper files
            const dailyMockQuestions = loadDailyMockQuestions();
            allQuestions = [...allQuestions, ...dailyMockQuestions];
        }

        // For full length GS: exclude PYQ from last 3 years
        if (type === 'full_length' && !isCSAT) {
            const pyqTexts = loadPYQTexts();
            allQuestions = allQuestions.filter(q => {
                const qNorm = normalizeText(q.question);
                return !pyqTexts.some(pyq => textSimilarity(qNorm, pyq) > 0.85);
            });
        }

        // Split into seen and unseen
        const seenSet = new Set(seenQuestionIds);
        const unseenQuestions = allQuestions.filter(q => !seenSet.has(q.uid));
        const seenQuestions = allQuestions.filter(q => seenSet.has(q.uid));

        const distribution = isCSAT ? CSAT_FULL_LENGTH_DISTRIBUTION : GS_FULL_LENGTH_DISTRIBUTION;

        let selectedQuestions: UnifiedQuestion[];

        if (type === 'full_length') {
            selectedQuestions = assembleFullLength(unseenQuestions, seenQuestions, distribution);
        } else {
            const count = questionCount || 25;
            const subjectFilter = subjects && subjects.length > 0 ? subjects : undefined;
            const difficultyFilter = difficulty && difficulty !== 'mixed' ? difficulty : undefined;
            selectedQuestions = assembleCustom(
                unseenQuestions, seenQuestions, count, subjectFilter, difficultyFilter, subtopics
            );
        }

        // For CSAT comprehension: group passage questions together
        if (isCSAT) {
            selectedQuestions = groupPassageQuestions(selectedQuestions);
        } else {
            selectedQuestions = shuffleArray(selectedQuestions);
        }

        // Calculate timer
        const secsPerQ = isCSAT ? CSAT_SECONDS_PER_QUESTION : GS_SECONDS_PER_QUESTION;
        const totalSeconds = selectedQuestions.length * secsPerQ;
        const durationMinutes = Math.ceil(totalSeconds / 60);

        // Format response
        const marking = isCSAT ? CSAT_MARKING : GS_MARKING;

        const questions = selectedQuestions.map((q, i) => ({
            id: `q-${i + 1}`,
            uid: q.uid,
            question: q.question,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            subject: q.subject,
            sub_topic: q.sub_topic || '',
            ...(q.passage ? { passage: q.passage } : {}),
            ...(q.passage_id ? { passage_id: q.passage_id } : {}),
        }));

        // Subject distribution for analysis
        const subjectDistribution: Record<string, number> = {};
        const difficultyDistribution: Record<string, number> = {};
        for (const q of questions) {
            subjectDistribution[q.subject] = (subjectDistribution[q.subject] || 0) + 1;
            difficultyDistribution[q.difficulty] = (difficultyDistribution[q.difficulty] || 0) + 1;
        }

        const repeatCount = questions.filter(q => seenSet.has(q.uid)).length;

        return NextResponse.json({
            success: true,
            testType: type,
            paper,
            questions,
            metadata: {
                totalQuestions: questions.length,
                durationMinutes,
                durationSeconds: totalSeconds,
                marksPerCorrect: marking.marksPerCorrect,
                negativeMarks: marking.negativeMarks,
                subjectDistribution,
                difficultyDistribution,
                repeatCount,
                repeatPercentage: questions.length > 0 ? Math.round((repeatCount / questions.length) * 100) : 0,
                generatedAt: new Date().toISOString(),
            },
        });

    } catch (error: any) {
        console.error('[mock-tests/generate] Error:', error.message);
        return NextResponse.json({ error: 'Failed to generate mock test' }, { status: 500 });
    }
}

// ─── Assembly Functions ────────────────────────────────────────────────

function assembleFullLength(
    unseen: UnifiedQuestion[],
    seen: UnifiedQuestion[],
    distribution: Record<string, number>
): UnifiedQuestion[] {
    const result: UnifiedQuestion[] = [];
    const maxRepeat = 20; // 20% of 100
    const passageSubjects = new Set(['comprehension']);

    for (const [subject, count] of Object.entries(distribution)) {
        const subjectUnseen = unseen.filter(q => q.subject === subject);
        const subjectSeen = seen.filter(q => q.subject === subject);

        if (passageSubjects.has(subject)) {
            // ── Passage-based selection: pick whole passage groups ──
            const picked = pickByPassageGroups(subjectUnseen, subjectSeen, count);
            result.push(...picked);
        } else {
            // ── Standard per-question selection with difficulty mix ──
            const easyCount = Math.round(count * FULL_LENGTH_DIFFICULTY_MIX.easy);
            const hardCount = Math.round(count * FULL_LENGTH_DIFFICULTY_MIX.hard);
            const mediumCount = count - easyCount - hardCount;

            const picked: UnifiedQuestion[] = [];

            for (const [diff, targetCount] of [['easy', easyCount], ['medium', mediumCount], ['hard', hardCount]] as [string, number][]) {
                const pool = shuffleArray(subjectUnseen.filter(q => q.difficulty === diff));
                const remaining = targetCount - picked.filter(q => q.difficulty === diff && q.subject === subject).length;

                for (let i = 0; i < Math.min(remaining, pool.length); i++) {
                    if (!picked.some(p => p.uid === pool[i].uid)) {
                        picked.push(pool[i]);
                    }
                }
            }

            if (picked.length < count) {
                const deficit = count - picked.length;
                const seenPool = shuffleArray(subjectSeen);
                for (let i = 0; i < Math.min(deficit, seenPool.length); i++) {
                    if (!picked.some(p => p.uid === seenPool[i].uid)) {
                        picked.push(seenPool[i]);
                    }
                }
            }

            if (picked.length < count) {
                const fallbackPool = shuffleArray(subjectUnseen.filter(q => !picked.some(p => p.uid === q.uid)));
                for (let i = 0; i < Math.min(count - picked.length, fallbackPool.length); i++) {
                    picked.push(fallbackPool[i]);
                }
            }

            result.push(...picked.slice(0, count));
        }
    }

    // Enforce max 20% repeat
    const resultSeenSet = new Set(seen.map(q => q.uid));
    const repeatInResult = result.filter(q => resultSeenSet.has(q.uid)).length;

    if (repeatInResult > maxRepeat) {
        const excessCount = repeatInResult - maxRepeat;
        const allUsedUids = new Set(result.map(q => q.uid));
        const replacementPool = shuffleArray(unseen.filter(q => !allUsedUids.has(q.uid)));

        let replaced = 0;
        for (let i = result.length - 1; i >= 0 && replaced < excessCount; i--) {
            if (resultSeenSet.has(result[i].uid) && replacementPool.length > replaced) {
                result[i] = replacementPool[replaced];
                replaced++;
            }
        }
    }

    return result;
}

/**
 * Pick questions by passage groups for comprehension/DI.
 * Selects whole passages (3-4 Qs each) to approximately fill `targetCount`.
 * Prioritizes generated passages (with passage_id) over old ePaper standalone questions.
 */
function pickByPassageGroups(
    unseen: UnifiedQuestion[],
    seen: UnifiedQuestion[],
    targetCount: number
): UnifiedQuestion[] {
    const allPool = [...unseen, ...seen];

    // Group by passage_id (proper passage groups with 2+ questions)
    const passageGroups = new Map<string, UnifiedQuestion[]>();
    const standalone: UnifiedQuestion[] = [];

    for (const q of allPool) {
        if (q.passage_id) {
            if (!passageGroups.has(q.passage_id)) passageGroups.set(q.passage_id, []);
            passageGroups.get(q.passage_id)!.push(q);
        } else {
            standalone.push(q);
        }
    }

    const result: UnifiedQuestion[] = [];

    // Pick from proper passage groups (2-4 Qs each, matching UPSC format)
    // Only use groups with 2+ questions (skip broken single-question passages)
    const validGroups = Array.from(passageGroups.values()).filter(g => g.length >= 2);
    const shuffledGroups = shuffleArray(validGroups);

    for (const group of shuffledGroups) {
        if (result.length >= targetCount) break;
        // Cap at 4 questions per passage
        const capped = group.slice(0, 4);
        result.push(...capped);
    }

    // If still under target, fill with standalone questions
    if (result.length < targetCount) {
        const shuffledStandalone = shuffleArray(standalone);
        for (const q of shuffledStandalone) {
            if (result.length >= targetCount) break;
            result.push(q);
        }
    }

    return result;
}

function assembleCustom(
    unseen: UnifiedQuestion[],
    seen: UnifiedQuestion[],
    count: number,
    subjects?: string[],
    difficulty?: string,
    subtopics?: string[]
): UnifiedQuestion[] {
    // Filter by subject
    let unseenPool = subjects && subjects.length > 0
        ? unseen.filter(q => subjects.includes(q.subject))
        : unseen;
    let seenPool = subjects && subjects.length > 0
        ? seen.filter(q => subjects.includes(q.subject))
        : seen;

    // Filter by specific sub-topics (e.g., "Number System", "Puzzle")
    if (subtopics && subtopics.length > 0) {
        unseenPool = unseenPool.filter(q => subtopics.includes(q.sub_topic || ''));
        seenPool = seenPool.filter(q => subtopics.includes(q.sub_topic || ''));
    }

    // Filter by difficulty
    if (difficulty) {
        unseenPool = unseenPool.filter(q => q.difficulty === difficulty);
        seenPool = seenPool.filter(q => q.difficulty === difficulty);
    }

    // Check if passage-based subjects are involved
    const passageSubjects = new Set(['comprehension']);
    const requestedPassageSubjects = subjects
        ? subjects.filter(s => passageSubjects.has(s))
        : [];

    const result: UnifiedQuestion[] = [];

    if (requestedPassageSubjects.length > 0) {
        // ── Passage-based selection ──
        // Determine how many questions should come from passage-based subjects
        const nonPassageSubjects = subjects
            ? subjects.filter(s => !passageSubjects.has(s))
            : [];
        const onlyPassage = nonPassageSubjects.length === 0;
        const passageTarget = onlyPassage ? count : Math.ceil(count * (requestedPassageSubjects.length / subjects!.length));
        const standaloneTarget = count - passageTarget;

        // Pick passage-based questions by passage groups
        const passagePoolUnseen = unseenPool.filter(q => passageSubjects.has(q.subject));
        const passagePoolSeen = seenPool.filter(q => passageSubjects.has(q.subject));
        const passageQs = pickByPassageGroups(passagePoolUnseen, passagePoolSeen, passageTarget);
        result.push(...passageQs);

        // Pick standalone (non-passage) questions
        if (standaloneTarget > 0 && !onlyPassage) {
            const standaloneUnseen = shuffleArray(unseenPool.filter(q => !passageSubjects.has(q.subject)));
            for (const q of standaloneUnseen) {
                if (result.length >= count) break;
                result.push(q);
            }
        }
    } else {
        // ── No passage subjects — standard per-question selection ──
        const maxRepeat = Math.floor(count * 0.2);

        const shuffledUnseen = shuffleArray(unseenPool);
        const shuffledSeen = shuffleArray(seenPool);

        for (const q of shuffledUnseen) {
            if (result.length >= count) break;
            result.push(q);
        }

        let seenAdded = 0;
        for (const q of shuffledSeen) {
            if (result.length >= count) break;
            if (seenAdded >= maxRepeat) break;
            if (!result.some(r => r.uid === q.uid)) {
                result.push(q);
                seenAdded++;
            }
        }
    }

    // For passage-based, allow slightly over count (complete the last passage group)
    // For standalone, trim to exact count
    if (requestedPassageSubjects.length > 0) {
        return result; // Keep all — passage groups shouldn't be broken
    }
    return result.slice(0, count);
}

// ─── Helper Functions ──────────────────────────────────────────────────

function loadDailyMockQuestions(): UnifiedQuestion[] {
    const epaperDir = path.join(process.cwd(), 'src', 'data', 'epaper');
    if (!fs.existsSync(epaperDir)) return [];

    const questions: UnifiedQuestion[] = [];
    const files = fs.readdirSync(epaperDir).filter(f => f.startsWith('epaper-') && f.endsWith('.json') && f !== 'epaper-index.json');

    for (const file of files) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(epaperDir, file), 'utf-8'));
            const dateStr = file.replace('epaper-', '').replace('.json', '');

            // Extract prelims mock questions (array format: prelimsMocks)
            const prelims = data.prelimsMocks || (data.prelimsMock?.questions ? data.prelimsMock.questions : []);
            for (let i = 0; i < prelims.length; i++) {
                const q = prelims[i];
                const question = q.question;
                const opts = q.options;
                if (!question) continue;

                // Handle both formats: { option_a, option_b } and { options: ['A. ...', 'B. ...'] }
                if (q.option_a) {
                    questions.push({
                        uid: `daily-prelims-${dateStr}-${q.id || i}`,
                        question,
                        option_a: q.option_a,
                        option_b: q.option_b,
                        option_c: q.option_c,
                        option_d: q.option_d,
                        correct_answer: q.correct_answer || 'A',
                        explanation: q.explanation || '',
                        difficulty: q.difficulty || 'medium',
                        subject: q.subject || 'current_affairs',
                        sub_topic: q.sub_topic || 'Daily Current Affairs',
                    });
                } else if (opts && Array.isArray(opts) && opts.length >= 4) {
                    questions.push({
                        uid: `daily-prelims-${dateStr}-${i}`,
                        question,
                        option_a: String(opts[0]).replace(/^[A-Da-d][.)\s]+\s*/, ''),
                        option_b: String(opts[1]).replace(/^[A-Da-d][.)\s]+\s*/, ''),
                        option_c: String(opts[2]).replace(/^[A-Da-d][.)\s]+\s*/, ''),
                        option_d: String(opts[3]).replace(/^[A-Da-d][.)\s]+\s*/, ''),
                        correct_answer: parseAnswerLetter(q.answer || q.correct_answer || 'A'),
                        explanation: q.explanation || '',
                        difficulty: q.difficulty || 'medium',
                        subject: q.subject || 'current_affairs',
                        sub_topic: q.sub_topic || 'Daily Current Affairs',
                    });
                }
            }
        } catch {
            // Skip malformed files
        }
    }

    return questions;
}

function loadCSATQuestionBank(): UnifiedQuestion[] {
    const questions: UnifiedQuestion[] = [];
    const dataDir = path.join(process.cwd(), 'mock-engine', 'data');

    // 1. Load Maths bank
    const mathsPath = path.join(dataDir, 'csat-maths-bank.json');
    if (fs.existsSync(mathsPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(mathsPath, 'utf-8'));
            questions.push(...(data.questions || []));
        } catch { /* skip */ }
    }

    // 2. Load Comprehension bank (passages with linked questions)
    const compPath = path.join(dataDir, 'csat-comprehension-bank.json');
    if (fs.existsSync(compPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(compPath, 'utf-8'));
            for (const passage of (data.passages || [])) {
                for (const q of (passage.questions || [])) {
                    questions.push(q);
                }
            }
        } catch { /* skip */ }
    }

    // 3. Load Reasoning bank
    const reasonPath = path.join(dataDir, 'csat-reasoning-bank.json');
    if (fs.existsSync(reasonPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(reasonPath, 'utf-8'));
            questions.push(...(data.questions || []));
        } catch { /* skip */ }
    }

    // 4. Fallback: load old unified bank if exists (backward compatibility)
    const oldPath = path.join(dataDir, 'unified-csat-questions.json');
    if (fs.existsSync(oldPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(oldPath, 'utf-8'));
            const existingUids = new Set(questions.map(q => q.uid));
            for (const q of (data.questions || [])) {
                if (!existingUids.has(q.uid)) questions.push(q);
            }
        } catch { /* skip */ }
    }

    return questions;
}

function loadDailyCSATQuestions(): UnifiedQuestion[] {
    const epaperDir = path.join(process.cwd(), 'src', 'data', 'epaper');
    if (!fs.existsSync(epaperDir)) return [];

    const questions: UnifiedQuestion[] = [];
    const files = fs.readdirSync(epaperDir).filter(f => f.startsWith('epaper-') && f.endsWith('.json') && f !== 'epaper-index.json');

    for (const file of files) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(epaperDir, file), 'utf-8'));
            const dateStr = file.replace('epaper-', '').replace('.json', '');
            const csat = data.csatMocks;
            if (!csat) continue;

            // Comprehension passages
            const comprehension = csat.comprehension || csat.comprehensionPassages || [];
            for (let pIdx = 0; pIdx < comprehension.length; pIdx++) {
                const passage = comprehension[pIdx];
                const passageText = passage.passage || '';
                const passageQs = passage.questions || [];
                for (let qIdx = 0; qIdx < passageQs.length; qIdx++) {
                    const q = passageQs[qIdx];
                    if (!q.question || !q.options || q.options.length < 4) continue;
                    questions.push({
                        uid: `csat-comp-${dateStr}-${pIdx}-${qIdx}`,
                        question: q.question,
                        option_a: String(q.options[0]).replace(/^[A-Da-d][.)\s]+\s*/, ''),
                        option_b: String(q.options[1]).replace(/^[A-Da-d][.)\s]+\s*/, ''),
                        option_c: String(q.options[2]).replace(/^[A-Da-d][.)\s]+\s*/, ''),
                        option_d: String(q.options[3]).replace(/^[A-Da-d][.)\s]+\s*/, ''),
                        correct_answer: parseAnswerLetter(q.answer || 'A'),
                        explanation: q.explanation || '',
                        difficulty: 'medium',
                        subject: 'comprehension',
                        sub_topic: 'Reading Comprehension',
                        passage: passageText,
                    });
                }
            }

            // Reasoning questions
            const reasoning = csat.reasoning || csat.reasoningQuestions || [];
            for (let rIdx = 0; rIdx < reasoning.length; rIdx++) {
                const q = reasoning[rIdx];
                if (!q.question || !q.options || q.options.length < 4) continue;
                const cat = (q.category || 'logical').toLowerCase().replace(/\s+/g, '_');
                const subjectMap: Record<string, string> = {
                    syllogism: 'logical_reasoning', statement_assumption: 'logical_reasoning',
                    blood_relation: 'logical_reasoning', seating_arrangement: 'logical_reasoning',
                    direction_sense: 'logical_reasoning', coding_decoding: 'logical_reasoning',
                    series_sequence: 'logical_reasoning', puzzle: 'logical_reasoning',
                    decision_making: 'decision_making', quantitative: 'basic_numeracy',
                    data_interpretation: 'data_interpretation',
                };
                questions.push({
                    uid: `csat-reas-${dateStr}-${rIdx}`,
                    question: q.question,
                    option_a: String(q.options[0]).replace(/^[A-Da-d][.)\s]+\s*/, ''),
                    option_b: String(q.options[1]).replace(/^[A-Da-d][.)\s]+\s*/, ''),
                    option_c: String(q.options[2]).replace(/^[A-Da-d][.)\s]+\s*/, ''),
                    option_d: String(q.options[3]).replace(/^[A-Da-d][.)\s]+\s*/, ''),
                    correct_answer: parseAnswerLetter(q.answer || 'A'),
                    explanation: q.explanation || '',
                    difficulty: 'medium',
                    subject: subjectMap[cat] || 'logical_reasoning',
                    sub_topic: q.category || 'General Reasoning',
                });
            }
        } catch { /* skip */ }
    }

    return questions;
}

function groupPassageQuestions(questions: UnifiedQuestion[]): UnifiedQuestion[] {
    // Group comprehension questions by passage so they appear together
    const withPassage: UnifiedQuestion[] = [];
    const withoutPassage: UnifiedQuestion[] = [];

    for (const q of questions) {
        if (q.passage_id || q.passage) withPassage.push(q);
        else withoutPassage.push(q);
    }

    // Group by passage_id first, fallback to passage text
    const passageGroups = new Map<string, UnifiedQuestion[]>();
    for (const q of withPassage) {
        const key = q.passage_id || q.passage!.slice(0, 100);
        if (!passageGroups.has(key)) passageGroups.set(key, []);
        passageGroups.get(key)!.push(q);
    }

    // Shuffle passage groups, then interleave with non-passage questions
    const groupedPassages = shuffleArray(Array.from(passageGroups.values()));
    const shuffledNonPassage = shuffleArray(withoutPassage);

    const result: UnifiedQuestion[] = [];
    let npIdx = 0;

    for (const group of groupedPassages) {
        result.push(...group);
        // Insert 2-3 non-passage questions between passage groups
        const gap = Math.min(3, shuffledNonPassage.length - npIdx);
        for (let i = 0; i < gap; i++) {
            if (npIdx < shuffledNonPassage.length) {
                result.push(shuffledNonPassage[npIdx++]);
            }
        }
    }

    // Append remaining non-passage questions
    while (npIdx < shuffledNonPassage.length) {
        result.push(shuffledNonPassage[npIdx++]);
    }

    return result;
}

function parseAnswerLetter(answer: string): string {
    if (!answer) return 'A';
    const match = answer.toUpperCase().trim().match(/[ABCD]/);
    return match ? match[0] : 'A';
}

function loadPYQTexts(): string[] {
    const pyqPath = path.join(process.cwd(), 'src', 'data', 'pyq', 'pyq-database.json');
    if (!fs.existsSync(pyqPath)) return [];

    try {
        const data = JSON.parse(fs.readFileSync(pyqPath, 'utf-8'));
        const questions = data.questions || [];
        // Only last 3 years
        const currentYear = new Date().getFullYear();
        return questions
            .filter((q: any) => {
                const year = parseInt(q.year);
                return !isNaN(year) && year >= currentYear - 3;
            })
            .map((q: any) => normalizeText(q.question || ''))
            .filter((t: string) => t.length > 20);
    } catch {
        return [];
    }
}

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function textSimilarity(a: string, b: string): number {
    // Simple Jaccard similarity on word sets
    const wordsA = new Set(a.split(' ').filter(w => w.length > 2));
    const wordsB = new Set(b.split(' ').filter(w => w.length > 2));
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    const arrA = Array.from(wordsA);
    const arrB = Array.from(wordsB);
    const intersection = arrA.filter(w => wordsB.has(w));
    const union = new Set([...arrA, ...arrB]);
    return intersection.length / union.size;
}

function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
