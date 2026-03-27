/**
 * API Route: POST /api/admin/grant-access
 *
 * Admin-only endpoint to grant complementary Pro access to any user.
 * Used for promo campaigns, influencer partnerships, or special requests.
 *
 * Body: { email: string, months?: number, reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// Admin emails — add yours here or manage via env
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

export async function POST(request: NextRequest) {
    try {
        // 1. Auth check
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // 2. Admin check
        const callerEmail = session.user.email.toLowerCase();
        if (!ADMIN_EMAILS.includes(callerEmail)) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // 3. Parse body
        const { email, months = 12, reason = 'Admin grant' } = await request.json();
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        if (!isSupabaseConfigured()) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
        }

        // 4. Find user by email
        const { data: user, error: findErr } = await supabaseAdmin
            .from('users')
            .select('id, email, is_premium, premium_expires_at')
            .eq('email', email.toLowerCase())
            .single();

        if (findErr || !user) {
            return NextResponse.json({ error: `User with email ${email} not found` }, { status: 404 });
        }

        // 5. Grant access
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + months);

        const { error: updateErr } = await supabaseAdmin
            .from('users')
            .update({
                is_premium: true,
                premium_expires_at: expiresAt.toISOString(),
            })
            .eq('id', user.id);

        if (updateErr) {
            console.error('[admin/grant-access] Update error:', updateErr.message);
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
        }

        // 6. Log complementary payment for audit
        await supabaseAdmin
            .from('payments')
            .insert({
                user_id: user.id,
                plan: 'pro_yearly',
                amount_paise: 0,
                receipt: `comp_${Date.now()}`,
                status: 'paid',
                razorpay_order_id: `COMP_${Date.now()}`,
            });

        console.log(`[admin/grant-access] Granted ${months}mo Pro to ${email} by ${callerEmail}. Reason: ${reason}`);

        return NextResponse.json({
            success: true,
            email,
            months,
            expiresAt: expiresAt.toISOString(),
            reason,
        });

    } catch (error: any) {
        console.error('[admin/grant-access] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
