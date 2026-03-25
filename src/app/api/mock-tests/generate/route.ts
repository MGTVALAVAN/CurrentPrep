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
}

interface GenerateRequest {
    type: 'custom' | 'full_length';
    subjects?: string[];         // for custom
    difficulty?: string;         // for custom: easy | medium | hard | mixed
    questionCount?: number;      // for custom: 10 | 25 | 50 | 100
    seenQuestionIds?: string[];  // for repeat tracking
}

// UPSC Full-Length Subject Distribution (100 questions)
const FULL_LENGTH_DISTRIBUTION: Record<string, number> = {
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

// Difficulty mix for full length: 25% easy, 50% medium, 25% hard
const FULL_LENGTH_DIFFICULTY_MIX = { easy: 0.25, medium: 0.50, hard: 0.25 };

// Time per question in seconds (UPSC average)
const SECONDS_PER_QUESTION = 72;

// ─── API Handler ───────────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        const body: GenerateRequest = await request.json();
        const { type, subjects, difficulty, questionCount, seenQuestionIds = [] } = body;

        // Load the unified question bank
        const unifiedPath = path.join(process.cwd(), 'mock-engine', 'data', 'unified-questions.json');
        if (!fs.existsSync(unifiedPath)) {
            return NextResponse.json({ error: 'Question bank not found' }, { status: 500 });
        }

        const unifiedData = JSON.parse(fs.readFileSync(unifiedPath, 'utf-8'));
        let allQuestions: UnifiedQuestion[] = unifiedData.questions || [];

        // Also load daily mock questions from ePaper files
        const dailyMockQuestions = loadDailyMockQuestions();
        allQuestions = [...allQuestions, ...dailyMockQuestions];

        // For full length: exclude PYQ from last 3 years
        if (type === 'full_length') {
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

        let selectedQuestions: UnifiedQuestion[];

        if (type === 'full_length') {
            selectedQuestions = assembleFullLength(unseenQuestions, seenQuestions);
        } else {
            const count = questionCount || 25;
            const subjectFilter = subjects && subjects.length > 0 ? subjects : undefined;
            const difficultyFilter = difficulty && difficulty !== 'mixed' ? difficulty : undefined;
            selectedQuestions = assembleCustom(
                unseenQuestions, seenQuestions, count, subjectFilter, difficultyFilter
            );
        }

        // Shuffle final set
        selectedQuestions = shuffleArray(selectedQuestions);

        // Calculate timer
        const totalSeconds = selectedQuestions.length * SECONDS_PER_QUESTION;
        const durationMinutes = Math.ceil(totalSeconds / 60);

        // Format response
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
            questions,
            metadata: {
                totalQuestions: questions.length,
                durationMinutes,
                durationSeconds: totalSeconds,
                marksPerCorrect: 2,
                negativeMarks: 0.67,
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
    seen: UnifiedQuestion[]
): UnifiedQuestion[] {
    const result: UnifiedQuestion[] = [];
    const maxRepeat = 20; // 20% of 100

    for (const [subject, count] of Object.entries(FULL_LENGTH_DISTRIBUTION)) {
        const subjectUnseen = unseen.filter(q => q.subject === subject);
        const subjectSeen = seen.filter(q => q.subject === subject);

        // Apply difficulty mix per subject
        const easyCount = Math.round(count * FULL_LENGTH_DIFFICULTY_MIX.easy);
        const hardCount = Math.round(count * FULL_LENGTH_DIFFICULTY_MIX.hard);
        const mediumCount = count - easyCount - hardCount;

        const picked: UnifiedQuestion[] = [];

        // Pick by difficulty from unseen first
        for (const [diff, targetCount] of [['easy', easyCount], ['medium', mediumCount], ['hard', hardCount]] as [string, number][]) {
            const pool = shuffleArray(subjectUnseen.filter(q => q.difficulty === diff));
            const remaining = targetCount - picked.filter(q => q.difficulty === diff && q.subject === subject).length;

            for (let i = 0; i < Math.min(remaining, pool.length); i++) {
                if (!picked.some(p => p.uid === pool[i].uid)) {
                    picked.push(pool[i]);
                }
            }
        }

        // If not enough unseen, fill from seen (but track count)
        if (picked.length < count) {
            const deficit = count - picked.length;
            const seenPool = shuffleArray(subjectSeen);
            for (let i = 0; i < Math.min(deficit, seenPool.length); i++) {
                if (!picked.some(p => p.uid === seenPool[i].uid)) {
                    picked.push(seenPool[i]);
                }
            }
        }

        // If still not enough, fill from any unseen of same subject regardless of difficulty
        if (picked.length < count) {
            const fallbackPool = shuffleArray(subjectUnseen.filter(q => !picked.some(p => p.uid === q.uid)));
            for (let i = 0; i < Math.min(count - picked.length, fallbackPool.length); i++) {
                picked.push(fallbackPool[i]);
            }
        }

        result.push(...picked.slice(0, count));
    }

    // Enforce max 20% repeat
    const resultSeenSet = new Set(seen.map(q => q.uid));
    const repeatInResult = result.filter(q => resultSeenSet.has(q.uid)).length;

    if (repeatInResult > maxRepeat) {
        // Replace excess repeats with unseen questions
        const excessCount = repeatInResult - maxRepeat;
        const repeats = result.filter(q => resultSeenSet.has(q.uid));
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

function assembleCustom(
    unseen: UnifiedQuestion[],
    seen: UnifiedQuestion[],
    count: number,
    subjects?: string[],
    difficulty?: string
): UnifiedQuestion[] {
    // Filter by subject
    let unseenPool = subjects
        ? unseen.filter(q => subjects.includes(q.subject))
        : unseen;
    let seenPool = subjects
        ? seen.filter(q => subjects.includes(q.subject))
        : seen;

    // Filter by difficulty
    if (difficulty) {
        unseenPool = unseenPool.filter(q => q.difficulty === difficulty);
        seenPool = seenPool.filter(q => q.difficulty === difficulty);
    }

    // Pick 80%+ from unseen, up to 20% from seen
    const maxRepeat = Math.floor(count * 0.2);
    const targetUnseen = count - maxRepeat;

    const shuffledUnseen = shuffleArray(unseenPool);
    const shuffledSeen = shuffleArray(seenPool);

    const result: UnifiedQuestion[] = [];

    // Add unseen first
    for (const q of shuffledUnseen) {
        if (result.length >= count) break;
        result.push(q);
    }

    // Fill with seen if needed (up to 20%)
    let seenAdded = 0;
    for (const q of shuffledSeen) {
        if (result.length >= count) break;
        if (seenAdded >= maxRepeat) break;
        if (!result.some(r => r.uid === q.uid)) {
            result.push(q);
            seenAdded++;
        }
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

            // Extract prelims mock questions
            if (data.prelimsMock?.questions) {
                for (const q of data.prelimsMock.questions) {
                    if (q.question && q.option_a) {
                        questions.push({
                            uid: `daily-prelims-${dateStr}-${q.id || questions.length}`,
                            question: q.question,
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
                    }
                }
            }

            // Extract CSAT mock questions
            if (data.csatMock?.questions) {
                for (const q of data.csatMock.questions) {
                    if (q.question && q.option_a) {
                        questions.push({
                            uid: `daily-csat-${dateStr}-${q.id || questions.length}`,
                            question: q.question,
                            option_a: q.option_a,
                            option_b: q.option_b,
                            option_c: q.option_c,
                            option_d: q.option_d,
                            correct_answer: q.correct_answer || 'A',
                            explanation: q.explanation || '',
                            difficulty: q.difficulty || 'medium',
                            subject: q.subject || 'current_affairs',
                            sub_topic: q.sub_topic || 'CSAT',
                        });
                    }
                }
            }
        } catch {
            // Skip malformed files
        }
    }

    return questions;
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
