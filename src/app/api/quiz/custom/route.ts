import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkQuizRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'mock-engine', 'data', 'unified-questions.json');

let cachedDB: any = null;
let cacheTime = 0;

function getDB() {
    const now = Date.now();
    if (cachedDB && now - cacheTime < 60000) return cachedDB;
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    cachedDB = JSON.parse(raw);
    cacheTime = now;
    return cachedDB;
}

function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// UPSC Prelims GS-1 realistic subject distribution (out of 100)
const UPSC_FULL_LENGTH_WEIGHTAGE: Record<string, number> = {
    polity: 18,
    economics: 15,
    environment: 14,
    geography: 12,
    history: 12,
    science: 10,
    current_affairs: 10,
    art_culture: 5,
    society: 4,
};

// POST /api/quiz/custom — accepts body with attempted UIDs for repeat control
export async function POST(request: Request) {
    try {
        // --- Auth check (Issue 1.4) ---
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required. Please log in.' },
                { status: 401 }
            );
        }

        const userId = (session.user as any).id || session.user.email || 'unknown';

        // --- Rate limit check (Issue 1.7) ---
        const rateCheck = checkQuizRateLimit(userId);
        if (!rateCheck.allowed) {
            return rateLimitResponse(rateCheck.resetAt);
        }

        const body = await request.json();
        const {
            subjects = [],        // string[]
            difficulty = [],      // string[] — empty means all
            count = 25,           // number
            weightage = null,     // Record<string, number> or null
            fullLength = false,   // boolean — UPSC-style 100Q
            attemptedUIDs = [],   // string[] — previously attempted UIDs
            source = 'all',       // string
        } = body;

        const db = getDB();
        let pool = [...db.questions];

        // ─── Filter by subjects ───
        if (subjects.length > 0 && !subjects.includes('all')) {
            pool = pool.filter((q: any) => subjects.includes(q.subject));
        }

        // ─── Filter by difficulty ───
        if (difficulty.length > 0 && !difficulty.includes('all')) {
            pool = pool.filter((q: any) => difficulty.includes(q.difficulty));
        }

        // ─── Filter by source ───
        if (source && source !== 'all') {
            pool = pool.filter((q: any) => q.source === source);
        }

        const totalAvailable = pool.length;
        const targetCount = fullLength ? 100 : Math.min(count, 100);

        // ─── Split into fresh and repeat pools ───
        const attemptedSet = new Set(attemptedUIDs);
        const freshPool = pool.filter((q: any) => !attemptedSet.has(q.uid));
        const repeatPool = pool.filter((q: any) => attemptedSet.has(q.uid));

        // Max 20% repeats
        const maxRepeats = Math.floor(targetCount * 0.2);

        let selected: any[] = [];

        if (fullLength) {
            // ─── Full Length Paper — UPSC-style distribution ───
            const wt = UPSC_FULL_LENGTH_WEIGHTAGE;
            const totalWeight = Object.values(wt).reduce((s, w) => s + w, 0);

            for (const [subj, weight] of Object.entries(wt)) {
                const subjCount = Math.round((weight / totalWeight) * targetCount);
                const subjFresh = shuffleArray(freshPool.filter((q: any) => q.subject === subj));
                const subjRepeat = shuffleArray(repeatPool.filter((q: any) => q.subject === subj));

                // Take fresh first, then fill with repeats (up to 20% of subjCount)
                const subjMaxRepeat = Math.ceil(subjCount * 0.2);
                const fromFresh = subjFresh.slice(0, subjCount);
                const needed = subjCount - fromFresh.length;
                const fromRepeat = needed > 0 ? subjRepeat.slice(0, Math.min(needed, subjMaxRepeat)) : [];

                selected.push(...fromFresh, ...fromRepeat);
            }

            // Ensure we hit exactly 100
            if (selected.length < targetCount) {
                const usedIds = new Set(selected.map((q: any) => q.uid));
                const extra = shuffleArray(freshPool.filter((q: any) => !usedIds.has(q.uid)))
                    .slice(0, targetCount - selected.length);
                selected.push(...extra);
            }

            selected = shuffleArray(selected).slice(0, targetCount);
        } else if (weightage && Object.keys(weightage).length > 0) {
            // ─── Custom weightage ───
            const totalWeight = Object.values(weightage as Record<string, number>).reduce((s: number, w: number) => s + w, 0);

            for (const [subj, weight] of Object.entries(weightage as Record<string, number>)) {
                const subjCount = Math.round((weight / totalWeight) * targetCount);
                const subjFresh = shuffleArray(freshPool.filter((q: any) => q.subject === subj));
                const subjRepeat = shuffleArray(repeatPool.filter((q: any) => q.subject === subj));

                const subjMaxRepeat = Math.ceil(subjCount * 0.2);
                const fromFresh = subjFresh.slice(0, subjCount);
                const needed = subjCount - fromFresh.length;
                const fromRepeat = needed > 0 ? subjRepeat.slice(0, Math.min(needed, subjMaxRepeat)) : [];

                selected.push(...fromFresh, ...fromRepeat);
            }

            if (selected.length < targetCount) {
                const usedIds = new Set(selected.map((q: any) => q.uid));
                const extra = shuffleArray(freshPool.filter((q: any) => !usedIds.has(q.uid)))
                    .slice(0, targetCount - selected.length);
                selected.push(...extra);
            }

            selected = shuffleArray(selected).slice(0, targetCount);
        } else {
            // ─── No weightage — simple selection with repeat control ───
            const fromFresh = shuffleArray(freshPool).slice(0, targetCount);
            const needed = targetCount - fromFresh.length;
            const fromRepeat = needed > 0 ? shuffleArray(repeatPool).slice(0, Math.min(needed, maxRepeats)) : [];
            selected = shuffleArray([...fromFresh, ...fromRepeat]).slice(0, targetCount);
        }

        // Count repeats
        const repeatCount = selected.filter((q: any) => attemptedSet.has(q.uid)).length;

        // Normalize for frontend
        const normalized = selected.map((q: any, i: number) => ({
            id: i + 1,
            uid: q.uid,
            question: q.question,
            options: {
                a: q.option_a,
                b: q.option_b,
                c: q.option_c,
                d: q.option_d,
            },
            correct: q.correct_answer?.toLowerCase() || 'a',
            explanation: q.explanation || '',
            difficulty: q.difficulty,
            topic: q.subject,
            topicLabel: q.subject_label,
            subtopic: q.sub_topic_label || q.sub_topic || '',
            source: q.source,
        }));

        return NextResponse.json({
            success: true,
            questions: normalized,
            metadata: {
                count: normalized.length,
                totalAvailable,
                totalDatabase: db.total_questions,
                repeatCount,
                repeatPercent: normalized.length > 0 ? Math.round((repeatCount / normalized.length) * 100) : 0,
                fullLength,
                filters: { subjects, difficulty, source },
            },
        });
    } catch (error: any) {
        console.error('[custom-quiz] POST Error:', error.message);
        return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
    }
}

// GET — stats mode only
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    try {
        const db = getDB();
        const questions = db.questions;

        const bySubject: Record<string, number> = {};
        const byDifficulty: Record<string, number> = {};
        const bySource: Record<string, number> = {};

        for (const q of questions) {
            bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
            byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
            bySource[q.source] = (bySource[q.source] || 0) + 1;
        }

        return NextResponse.json({
            totalQuestions: db.total_questions,
            subjects: db.subjects,
            stats: { bySubject, byDifficulty, bySource },
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
    }
}
