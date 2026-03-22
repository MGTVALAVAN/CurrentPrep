import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MOCK_DIR = path.join(process.cwd(), 'mock-engine', 'data', 'mocks');

// GET /api/mock-tests — list all subjects and their mocks
// GET /api/mock-tests?subject=polity — list mocks for a subject
// GET /api/mock-tests?mock=polity-mock-1 — get a specific mock with questions
// GET /api/mock-tests?quiz=true&subject=polity&count=10&difficulty=medium — random quiz from database
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const mockId = searchParams.get('mock');
    const quiz = searchParams.get('quiz');
    const count = parseInt(searchParams.get('count') || '10');
    const difficulty = searchParams.get('difficulty');

    try {
        // ─── MODE 1: Get a specific mock test ───
        if (mockId) {
            const filePath = path.join(MOCK_DIR, `${mockId}.json`);
            if (!fs.existsSync(filePath)) {
                return NextResponse.json({ error: 'Mock test not found' }, { status: 404 });
            }
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            return NextResponse.json(data);
        }

        // ─── MODE 2: Quiz mode — random questions from database ───
        if (quiz === 'true') {
            const subjects = subject ? [subject] : getAllSubjects();
            let allQuestions: any[] = [];

            for (const subj of subjects) {
                const indexPath = path.join(MOCK_DIR, `${subj}-index.json`);
                if (!fs.existsSync(indexPath)) continue;
                const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

                for (const mock of index) {
                    const mockPath = path.join(MOCK_DIR, `${mock.mock_id}.json`);
                    if (!fs.existsSync(mockPath)) continue;
                    const mockData = JSON.parse(fs.readFileSync(mockPath, 'utf-8'));
                    const qs = mockData.questions.map((q: any) => ({
                        ...q,
                        subject: subj,
                        mockSource: mock.mock_id,
                    }));
                    allQuestions = allQuestions.concat(qs);
                }
            }

            // Filter by difficulty if specified
            if (difficulty && difficulty !== 'all') {
                allQuestions = allQuestions.filter(q => q.difficulty === difficulty);
            }

            // Shuffle and pick
            allQuestions = shuffleArray(allQuestions);
            const selectedQuestions = allQuestions.slice(0, Math.min(count, allQuestions.length));

            // Normalize format for the quiz UI
            const normalizedQuestions = selectedQuestions.map((q, i) => ({
                id: i + 1,
                question: q.question,
                options: {
                    a: q.option_a,
                    b: q.option_b,
                    c: q.option_c,
                    d: q.option_d,
                },
                correct: q.correct_answer?.toLowerCase() || 'a',
                explanation: q.explanation || '',
                difficulty: q.difficulty || 'medium',
                topic: q.subject || subject || '',
                subtopic: q.sub_topic || '',
                originalId: q.id,
            }));

            return NextResponse.json({
                success: true,
                questions: normalizedQuestions,
                metadata: {
                    subject: subject || 'mixed',
                    difficulty: difficulty || 'all',
                    count: normalizedQuestions.length,
                    totalAvailable: allQuestions.length + normalizedQuestions.length,
                    generatedAt: new Date().toISOString(),
                },
            });
        }

        // ─── MODE 3: List mocks for a specific subject ───
        if (subject) {
            const indexPath = path.join(MOCK_DIR, `${subject}-index.json`);
            if (!fs.existsSync(indexPath)) {
                return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
            }
            const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
            return NextResponse.json({ subject, mocks: index });
        }

        // ─── MODE 4: List all subjects with summary ───
        const subjects = getAllSubjects();
        const summary = subjects.map(subj => {
            const indexPath = path.join(MOCK_DIR, `${subj}-index.json`);
            const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
            const totalQuestions = index.reduce((sum: number, m: any) => sum + (m.total_questions || 100), 0);
            return {
                subject: subj,
                label: SUBJECT_LABELS[subj] || subj,
                icon: SUBJECT_ICONS[subj] || '📚',
                mockCount: index.length,
                totalQuestions,
                mocks: index.map((m: any) => ({
                    mock_id: m.mock_id,
                    title: m.title,
                    total_questions: m.total_questions,
                    difficulty_summary: m.difficulty_summary,
                })),
            };
        });

        return NextResponse.json({
            subjects: summary,
            totalSubjects: summary.length,
            totalMocks: summary.reduce((s, subj) => s + subj.mockCount, 0),
            totalQuestions: summary.reduce((s, subj) => s + subj.totalQuestions, 0),
        });
    } catch (error: any) {
        console.error('[mock-tests] Error:', error.message);
        return NextResponse.json({ error: 'Failed to load mock tests' }, { status: 500 });
    }
}

function getAllSubjects(): string[] {
    if (!fs.existsSync(MOCK_DIR)) return [];
    return fs.readdirSync(MOCK_DIR)
        .filter(f => f.endsWith('-index.json'))
        .map(f => f.replace('-index.json', ''))
        .sort();
}

function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

const SUBJECT_LABELS: Record<string, string> = {
    'art_culture': 'Art & Culture',
    'current_affairs': 'Current Affairs',
    'economics': 'Indian Economy',
    'environment': 'Environment & Ecology',
    'geography': 'Geography',
    'history': 'Indian History',
    'polity': 'Indian Polity & Governance',
    'science': 'Science & Technology',
    'society': 'Society & Social Issues',
};

const SUBJECT_ICONS: Record<string, string> = {
    'art_culture': '🎭',
    'current_affairs': '📰',
    'economics': '💰',
    'environment': '🌿',
    'geography': '🌍',
    'history': '📜',
    'polity': '🏛️',
    'science': '🔬',
    'society': '👥',
};
