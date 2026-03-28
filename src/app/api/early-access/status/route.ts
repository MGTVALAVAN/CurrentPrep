/**
 * API Route: GET /api/early-access/status
 *
 * Public endpoint — returns how many of the 250 early access
 * slots have been claimed (no auth required).
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

const MAX_SLOTS = 250;

export async function GET() {
    try {
        if (!isSupabaseConfigured()) {
            // Dev fallback: simulate 0 claims so the section always shows
            return NextResponse.json({
                totalSlots: MAX_SLOTS,
                claimed: 0,
                remaining: MAX_SLOTS,
                isAvailable: true,
            });
        }

        const { count, error } = await supabaseAdmin
            .from('early_access_claims')
            .select('*', { count: 'exact', head: true });

        const claimed = error ? 0 : (count ?? 0);
        const remaining = Math.max(0, MAX_SLOTS - claimed);

        return NextResponse.json({
            totalSlots: MAX_SLOTS,
            claimed,
            remaining,
            isAvailable: remaining > 0,
        });

    } catch (err: any) {
        console.error('[early-access/status] Error:', err.message);
        return NextResponse.json({
            totalSlots: MAX_SLOTS,
            claimed: 0,
            remaining: MAX_SLOTS,
            isAvailable: true,
        });
    }
}
