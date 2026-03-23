/**
 * API Route: GET /api/admin/content
 * 
 * Returns content stats for the admin dashboard.
 * Protected by middleware (admin role required).
 */

import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({
            epapers: { total: 0, latest: null },
            mocks: { totalDays: 0, totalPrelims: 0, totalMains: 0, totalCsat: 0 },
        });
    }

    const supabase = getSupabaseAdmin();

    // ePaper stats
    const [
        { count: epaperTotal },
        { data: latestEpaper },
    ] = await Promise.all([
        supabase.from('epapers').select('*', { count: 'exact', head: true }),
        supabase.from('epapers')
            .select('date')
            .order('date', { ascending: false })
            .limit(1)
            .single(),
    ]);

    // Mock test stats — count questions by category from daily_mock_days
    const { count: mockDays } = await supabase
        .from('daily_mock_days')
        .select('*', { count: 'exact', head: true });

    return NextResponse.json({
        epapers: {
            total: epaperTotal || 0,
            latest: latestEpaper?.date || null,
        },
        mocks: {
            totalDays: mockDays || 0,
            totalPrelims: 0,
            totalMains: 0,
            totalCsat: 0,
        },
    });
}
