/**
 * API Route: POST /api/csat-backfill
 *
 * Generates CSAT mock questions for existing ePaper dates that don't have them yet.
 * Uses the same Gemini pipeline as the main generator.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEpaperDates, loadEpaper, saveEpaper } from '@/lib/epaper-store';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        const dates = getEpaperDates(30);
        const results: { date: string; status: string }[] = [];

        for (const date of dates) {
            const ep = loadEpaper(date);
            if (!ep) {
                results.push({ date, status: 'no epaper data' });
                continue;
            }

            // Skip if already has CSAT data
            if (ep.csatMocks && (ep.csatMocks.comprehension?.length > 0 || ep.csatMocks.reasoning?.length > 0)) {
                results.push({ date, status: 'already has CSAT' });
                continue;
            }

            // Generate CSAT for this date
            console.log(`[csat-backfill] Generating CSAT for ${date}...`);

            const editorialThemes = ep.articles
                .slice(0, 8)
                .map((a) => `- Theme: ${a.headline}\n  Context: ${typeof a.explainer === 'string' ? a.explainer.slice(0, 200) : ''}`)
                .join('\n');

            const prompt = `You are a UPSC CSAT (Civil Services Aptitude Test — Paper II) question setter. Generate questions in TWO categories based on the editorial themes below.

EDITORIAL THEMES FROM THE DAY'S NEWS:
${editorialThemes}

CATEGORY 1 — COMPREHENSION (1 passage):
- Write ONE editorial-style passage of 200-250 words on a theme from the news. The passage should be analytical, opinion-based prose (like editorials from The Hindu, The Guardian, or The Economist). Do NOT copy exact quotes — create original analytical text.
- The passage must have 3-4 MCQ questions testing: main idea, inference, author's attitude, logical conclusion, meaning in context.
- Questions should test reading comprehension skills, NOT factual recall.

CATEGORY 2 — LOGICAL REASONING (4 questions):
Generate 4 MCQs covering these CSAT Paper II patterns:
- 1 Logical reasoning (syllogisms, assumptions, conclusions, cause-effect)
- 1 Quantitative/Data interpretation (percentages, ratios, simple math word problems)
- 1 Verbal reasoning (statement-conclusion, strengthening/weakening arguments)
- 1 Decision making / problem solving
Each question should have 4 options, one correct answer, and a brief explanation.

Return ONLY valid JSON matching this exact structure:
{
  "comprehension": [
    {
      "passage": "The editorial passage text here...",
      "source": "Theme-based editorial",
      "questions": [
        { "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "The correct option text exactly", "explanation": "Why this is correct..." }
      ]
    }
  ],
  "reasoning": [
    { "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "The correct option text exactly", "explanation": "Step-by-step solution...", "category": "logical" }
  ]
}`;

            const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
            let generated = false;

            for (const model of MODELS) {
                try {
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                                generationConfig: {
                                    temperature: 0.4,
                                    topP: 0.85,
                                    maxOutputTokens: 16384,
                                    responseMimeType: 'application/json',
                                },
                            }),
                        }
                    );

                    if (!response.ok) {
                        const errText = await response.text();
                        if (response.status === 429 && errText.includes('limit: 0')) {
                            continue; // Try next model
                        }
                        throw new Error(`API ${response.status}: ${errText.slice(0, 200)}`);
                    }

                    const data = await response.json();
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!text) throw new Error('No response text');

                    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                    const parsed = JSON.parse(cleaned);

                    ep.csatMocks = {
                        comprehension: parsed.comprehension || [],
                        reasoning: parsed.reasoning || [],
                    };

                    saveEpaper(ep);
                    const compQs = (parsed.comprehension || []).reduce((s: number, c: any) => s + (c.questions?.length || 0), 0);
                    results.push({
                        date,
                        status: `Generated: ${parsed.comprehension?.length || 0} passages (${compQs} Qs), ${parsed.reasoning?.length || 0} reasoning Qs`
                    });
                    generated = true;
                    break;
                } catch (err: any) {
                    console.error(`[csat-backfill] ${model} failed for ${date}: ${err.message}`);
                }
            }

            if (!generated) {
                results.push({ date, status: 'FAILED - all models exhausted' });
            }

            // Rate limit between dates
            await new Promise(r => setTimeout(r, 3000));
        }

        return NextResponse.json({ results });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
