/**
 * API Route: POST /api/early-access/claim
 *
 * Claims a free Pro slot (first 250 users only).
 * Requires:
 *   - Authentication (must be logged in)
 *   - Feedback form submission
 *
 * On success: grants 12 months Pro access + records feedback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

const MAX_SLOTS = 250;

export async function POST(request: NextRequest) {
    try {
        // 1. Auth check
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Please sign in to claim your free Pro access.' },
                { status: 401 }
            );
        }

        // 2. Parse feedback
        const body = await request.json();
        const {
            feedbackRating,
            feedbackWhatYouLike,
            feedbackWhatToImprove,
            feedbackWouldRecommend,
        } = body;

        // Validate required fields
        if (!feedbackRating || feedbackRating < 1 || feedbackRating > 5) {
            return NextResponse.json(
                { error: 'Please provide a rating between 1 and 5.' },
                { status: 400 }
            );
        }
        if (!feedbackWhatYouLike || feedbackWhatYouLike.trim().length < 10) {
            return NextResponse.json(
                { error: 'Please tell us what you like (at least 10 characters).' },
                { status: 400 }
            );
        }
        if (!feedbackWhatToImprove || feedbackWhatToImprove.trim().length < 10) {
            return NextResponse.json(
                { error: 'Please tell us what to improve (at least 10 characters).' },
                { status: 400 }
            );
        }

        if (!isSupabaseConfigured()) {
            // Dev mode: simulate success
            return NextResponse.json({
                success: true,
                slotNumber: 1,
                message: 'Congratulations! You\'ve claimed your free Pro access (dev mode).',
            });
        }

        const userId = (session.user as any).id;
        const userEmail = session.user.email;
        const userName = session.user.name || '';

        // 3. Check if user already claimed
        const { data: existing } = await supabaseAdmin
            .from('early_access_claims')
            .select('id, slot_number')
            .eq('user_id', userId)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: `You've already claimed your free Pro (slot #${existing.slot_number}). Enjoy!` },
                { status: 409 }
            );
        }

        // 4. Check remaining slots (atomic count)
        const { count, error: countErr } = await supabaseAdmin
            .from('early_access_claims')
            .select('*', { count: 'exact', head: true });

        const claimed = countErr ? 0 : (count ?? 0);
        if (claimed >= MAX_SLOTS) {
            return NextResponse.json(
                { error: 'Sorry, all 250 early access slots have been claimed. Check out our affordable plans instead!' },
                { status: 410 }  // 410 Gone
            );
        }

        const slotNumber = claimed + 1;

        // 5. Insert claim record
        const { error: insertErr } = await supabaseAdmin
            .from('early_access_claims')
            .insert({
                user_id: userId,
                email: userEmail,
                name: userName,
                feedback_rating: feedbackRating,
                feedback_what_you_like: feedbackWhatYouLike.trim(),
                feedback_what_to_improve: feedbackWhatToImprove.trim(),
                feedback_would_recommend: feedbackWouldRecommend !== false,
                slot_number: slotNumber,
            });

        if (insertErr) {
            // Handle race condition (unique constraint violation)
            if (insertErr.message.includes('unique') || insertErr.message.includes('duplicate')) {
                return NextResponse.json(
                    { error: 'You\'ve already claimed or this slot was just taken. Please try again.' },
                    { status: 409 }
                );
            }
            console.error('[early-access/claim] Insert error:', insertErr.message);
            return NextResponse.json(
                { error: 'Something went wrong. Please try again.' },
                { status: 500 }
            );
        }

        // 6. Grant 12 months free Pro access
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 12);

        await supabaseAdmin
            .from('users')
            .update({
                is_premium: true,
                premium_expires_at: expiresAt.toISOString(),
            })
            .eq('id', userId);

        // 7. Log as complementary payment for audit trail
        await supabaseAdmin
            .from('payments')
            .insert({
                user_id: userId,
                plan: 'pro_yearly',
                amount_paise: 0,
                receipt: `early_${slotNumber}_${Date.now()}`,
                status: 'paid',
                razorpay_order_id: `EARLY_ACCESS_${slotNumber}`,
            });

        console.log(`[early-access/claim] Slot #${slotNumber} claimed by ${userEmail}`);

        return NextResponse.json({
            success: true,
            slotNumber,
            remaining: MAX_SLOTS - slotNumber,
            message: `Congratulations! You're early access user #${slotNumber}. 12 months of Pro access activated!`,
        });

    } catch (error: any) {
        console.error('[early-access/claim] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
