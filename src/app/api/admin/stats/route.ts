/**
 * API Route: GET /api/admin/stats
 * 
 * Returns aggregated stats for the admin dashboard.
 * Protected by middleware (admin role required).
 */

import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
    if (!isSupabaseConfigured()) {
        // Return mock data for dev mode
        return NextResponse.json({
            users: { total: 0, premium: 0, newThisWeek: 0 },
            content: { epapers: 0, mockDays: 0, quizzesTaken: 0 },
            contact: { total: 0, unread: 0 },
        });
    }

    const supabase = getSupabaseAdmin();

    // Fetch user stats
    const [
        { count: totalUsers },
        { count: premiumUsers },
        { count: newThisWeek },
    ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_premium', true),
        supabase.from('users').select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Fetch content stats
    const [
        { count: epapers },
        { count: contactTotal },
        { count: contactUnread },
    ] = await Promise.all([
        supabase.from('epapers').select('*', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('*', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    ]);

    return NextResponse.json({
        users: {
            total: totalUsers || 0,
            premium: premiumUsers || 0,
            newThisWeek: newThisWeek || 0,
        },
        content: {
            epapers: epapers || 0,
            mockDays: 0,
            quizzesTaken: 0,
        },
        contact: {
            total: contactTotal || 0,
            unread: contactUnread || 0,
        },
    });
}
