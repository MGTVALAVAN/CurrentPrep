import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const TOPICS = {
    'indian-polity': 'Indian Polity & Governance (Constitution, Parliament, Judiciary, Federalism, Local Government, Fundamental Rights, DPSPs)',
    'indian-history': 'Indian History (Ancient, Medieval, Modern India, Freedom Struggle, Post-Independence)',
    'geography': 'Geography (Indian & World Physical Geography, Climate, Resources, Human Geography, Oceanography)',
    'indian-economy': 'Indian Economy (GDP, Fiscal Policy, Monetary Policy, Banking, Trade, Agriculture, Industry, Budget)',
    'environment': 'Environment & Ecology (Biodiversity, Climate Change, Pollution, Conservation, Environmental Laws)',
    'science-technology': 'Science & Technology (Space, Defence, IT, Biotechnology, Nuclear Technology, Recent Developments)',
    'international-relations': 'International Relations (India & Neighbours, International Organizations, Agreements, Geopolitics)',
    'art-culture': 'Art & Culture (Indian Architecture, Music, Dance, Literature, Festivals, Heritage)',
    'social-issues': 'Social Issues (Education, Health, Poverty, Women Empowerment, Welfare Schemes, Demographics)',
    'current-affairs': 'Current Affairs (Recent Events in India & World relevant to UPSC CSE)',
    'ethics': 'Ethics, Integrity & Aptitude (Ethical theories, Public service values, Case studies)',
    'internal-security': 'Internal Security (Border Management, Terrorism, Cyber Security, Money Laundering, Organized Crime)',
};

export async function POST(request: Request) {
    try {
        const { topic, difficulty, count, subtopic } = await request.json();

        if (!topic || !difficulty || !count) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const topicName = TOPICS[topic as keyof typeof TOPICS] || topic;
        const questionCount = Math.min(Math.max(parseInt(count) || 5, 3), 25);

        const difficultyGuide = {
            easy: 'Focus on NCERT-level factual questions. Test basic recall of facts, dates, definitions, and fundamental concepts. Questions should be straightforward with clearly distinguishable options.',
            medium: 'Focus on application and analytical questions typical of UPSC Prelims. Include questions requiring understanding of concepts, comparison between related topics, and application of knowledge. Options should be closer in nature, requiring careful reasoning.',
            hard: 'Focus on advanced, UPSC-level analytical questions. Include questions with multiple correct-sounding options, "consider the following statements" format, questions requiring synthesis of multiple concepts, and tricky elimination-based questions. These should challenge even well-prepared aspirants.',
        };

        const prompt = `You are a UPSC Civil Services Examination expert question setter. Generate exactly ${questionCount} high-quality Multiple Choice Questions (MCQs) suitable for UPSC CSE Prelims practice.

TOPIC: ${topicName}
${subtopic ? `SUB-TOPIC FOCUS: ${subtopic}` : ''}
DIFFICULTY: ${difficulty.toUpperCase()}
${difficultyGuide[difficulty as keyof typeof difficultyGuide] || ''}

RULES:
1. Each question must have EXACTLY 4 options labeled (a), (b), (c), (d)
2. Only ONE option should be correct
3. Questions must follow authentic UPSC question patterns:
   - "Consider the following statements" format
   - "Which of the following" format
   - Direct factual questions
   - Match the following / Arrange chronologically
4. Every question must be factually accurate and verifiable
5. Each question should test a different sub-concept within the topic
6. Explanations must be detailed (2-3 sentences) citing facts, articles, or concepts
7. NEVER leave any question incomplete or truncated

OUTPUT FORMAT — Return ONLY a valid JSON array with NO markdown formatting, NO code fences:
[
  {
    "id": 1,
    "question": "The full question text",
    "options": {
      "a": "Option A text",
      "b": "Option B text",
      "c": "Option C text",
      "d": "Option D text"
    },
    "correct": "b",
    "explanation": "Detailed explanation of why the correct answer is correct and why others are wrong.",
    "difficulty": "${difficulty}",
    "topic": "${topic}",
    "subtopic": "Specific sub-topic this question covers"
  }
]

Generate EXACTLY ${questionCount} questions. Ensure the JSON is complete and valid.`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Parse the JSON from the response
        let questions;
        try {
            // Try direct parse first
            questions = JSON.parse(text);
        } catch {
            // Try extracting JSON from markdown code blocks
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                questions = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Failed to parse AI response as JSON');
            }
        }

        // Validate structure
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('No questions generated');
        }

        // Ensure each question has all required fields
        questions = questions.map((q: any, i: number) => ({
            id: i + 1,
            question: q.question || '',
            options: q.options || {},
            correct: q.correct || 'a',
            explanation: q.explanation || '',
            difficulty: q.difficulty || difficulty,
            topic: q.topic || topic,
            subtopic: q.subtopic || '',
        }));

        return NextResponse.json({
            success: true,
            questions,
            metadata: {
                topic: topicName,
                difficulty,
                count: questions.length,
                generatedAt: new Date().toISOString(),
            }
        });
    } catch (error: any) {
        console.error('[quiz] Generation error:', error.message);
        return NextResponse.json(
            { error: 'Failed to generate quiz. Please try again.' },
            { status: 500 }
        );
    }
}
