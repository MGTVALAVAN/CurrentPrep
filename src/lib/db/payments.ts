/**
 * Payments Data Access Layer
 * 
 * Day 5: Handles Razorpay payment records in Supabase.
 * Used by the payment API routes (Day 10).
 */

import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────

export type PaymentPlan = 'monthly' | 'quarterly' | 'annual';
export type PaymentStatus = 'created' | 'paid' | 'failed' | 'refunded';

export interface Payment {
    id?: string;
    user_id: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    amount_paise: number;
    currency?: string;
    plan: PaymentPlan;
    status: PaymentStatus;
    receipt?: string;
    notes?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

// Plan pricing in paise (₹1 = 100 paise)
export const PLAN_PRICING: Record<PaymentPlan, { amount_paise: number; label: string; months: number }> = {
    monthly:   { amount_paise: 29900,  label: '₹299/month',   months: 1 },
    quarterly: { amount_paise: 79900,  label: '₹799/quarter', months: 3 },
    annual:    { amount_paise: 249900, label: '₹2,499/year',  months: 12 },
};

// ── Functions ──────────────────────────────────────────────────────────

/** Create a payment record (when Razorpay order is created) */
export async function createPaymentRecord(payment: Pick<Payment, 'user_id' | 'plan' | 'razorpay_order_id' | 'amount_paise' | 'receipt'>): Promise<Payment | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabaseAdmin
        .from('payments')
        .insert({
            user_id: payment.user_id,
            plan: payment.plan,
            razorpay_order_id: payment.razorpay_order_id,
            amount_paise: payment.amount_paise,
            receipt: payment.receipt || `rcpt_${Date.now()}`,
            status: 'created',
        })
        .select()
        .single();

    if (error) {
        console.error('[db/payments] Create record error:', error.message);
        return null;
    }
    return data;
}

/** Update payment after Razorpay callback (verify + mark as paid) */
export async function markPaymentPaid(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
): Promise<Payment | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabaseAdmin
        .from('payments')
        .update({
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
            status: 'paid',
        })
        .eq('razorpay_order_id', razorpayOrderId)
        .select()
        .single();

    if (error) {
        console.error('[db/payments] Mark paid error:', error.message);
        return null;
    }

    // Also update user's premium status
    if (data) {
        const planInfo = PLAN_PRICING[data.plan as PaymentPlan];
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + planInfo.months);

        await supabaseAdmin
            .from('users')
            .update({
                is_premium: true,
                premium_expires_at: expiresAt.toISOString(),
            })
            .eq('id', data.user_id);
    }

    return data;
}

/** Mark a payment as failed */
export async function markPaymentFailed(razorpayOrderId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabaseAdmin
        .from('payments')
        .update({ status: 'failed' })
        .eq('razorpay_order_id', razorpayOrderId);

    if (error) {
        console.error('[db/payments] Mark failed error:', error.message);
        return false;
    }
    return true;
}

/** Get payment history for a user */
export async function getPaymentHistory(userId: string): Promise<Payment[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
}

/** Get the latest active subscription for a user */
export async function getActiveSubscription(userId: string): Promise<Payment | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) return null;
    return data;
}
