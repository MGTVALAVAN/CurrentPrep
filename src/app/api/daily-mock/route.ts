/**
 * API Route: GET /api/daily-mock
 *
 * Returns aggregated Prelims, CSAT & Mains mock data across all available dates.
 * Query params:
 *  - date: specific date (YYYY-MM-DD), returns only that day's mocks
 *  - type: 'prelims' | 'csat' | 'mains' | 'all' (default: 'all')
 *  - limit: max number of dates to return (default: 30)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEpaperDates, loadEpaper } from '@/lib/epaper-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
};

interface CsatCompQ {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

interface CsatComprehension {
    passage: string;
    source?: string;
    questions: CsatCompQ[];
}

interface CsatReasoning {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    category: string;
}

interface MockDay {
    date: string;
    dateFormatted: string;
    prelimsMocks: Array<{
        question: string;
        options: string[];
        answer: string;
        explanation: string;
    }>;
    mainsMocks: Array<{
        question: string;
        syllabusMatch: string;
        approach: string;
    }>;
    csatMocks: {
        comprehension: CsatComprehension[];
        reasoning: CsatReasoning[];
    };
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const specificDate = searchParams.get('date');
        const type = searchParams.get('type') || 'all';
        const limit = parseInt(searchParams.get('limit') || '30', 10);

        let dates: string[];

        if (specificDate) {
            dates = [specificDate];
        } else {
            dates = getEpaperDates(limit);
        }

        const days: MockDay[] = [];

        for (const d of dates) {
            const ep = loadEpaper(d);
            if (!ep) continue;

            const prelims = (type === 'all' || type === 'prelims')
                ? (ep.prelimsMocks || []).map(q => ({ ...q, options: q.options || [] }))
                : [];
            const mains = (type === 'all' || type === 'mains') ? (ep.mainsMocks || []) : [];
            const csat = (type === 'all' || type === 'csat') ? (ep.csatMocks || { comprehension: [], reasoning: [] }) : { comprehension: [], reasoning: [] };

            const csatQCount = (csat.comprehension || []).reduce((s: number, c: CsatComprehension) => s + (c.questions?.length || 0), 0) + (csat.reasoning || []).length;

            if (prelims.length === 0 && mains.length === 0 && csatQCount === 0) continue;

            days.push({
                date: d,
                dateFormatted: new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                }),
                prelimsMocks: prelims,
                mainsMocks: mains,
                csatMocks: {
                    comprehension: csat.comprehension || [],
                    reasoning: csat.reasoning || [],
                },
            });
        }

        // Sort newest first
        days.sort((a, b) => b.date.localeCompare(a.date));

        const totalPrelims = days.reduce((s, d) => s + d.prelimsMocks.length, 0);
        const totalMains = days.reduce((s, d) => s + d.mainsMocks.length, 0);
        const totalCsat = days.reduce((s, d) => {
            const compQs = d.csatMocks.comprehension.reduce((cs, c) => cs + (c.questions?.length || 0), 0);
            return s + compQs + d.csatMocks.reasoning.length;
        }, 0);

        return NextResponse.json({
            days,
            totalDays: days.length,
            totalPrelims,
            totalMains,
            totalCsat,
            availableDates: days.map(d => d.date),
        }, { headers: NO_CACHE_HEADERS });
    } catch (err: any) {
        console.error('[api/daily-mock] Error:', err.message);
        return NextResponse.json(
            { error: 'Failed to load mock data' },
            { status: 500, headers: NO_CACHE_HEADERS }
        );
    }
}
