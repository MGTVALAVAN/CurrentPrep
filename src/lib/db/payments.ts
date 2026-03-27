/**
 * Payments Data Access Layer
 *
 * Supports 3-tier pricing: single tests, test packs, pro subscriptions.
 * Also handles promo codes and admin-granted complementary access.
 * Used by the payment API routes.
 */

import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import type { ProductType, ProBillingPeriod } from '@/config/pricing';

// ── Types ──────────────────────────────────────────────────────────────

export type PaymentPlan = 'monthly' | 'quarterly' | 'annual';
export type PaymentStatus = 'created' | 'paid' | 'failed' | 'refunded';

/** Extended plan type that includes new product IDs */
export type ExtendedPlan = PaymentPlan | string; // product ID from pricing config

export interface Payment {
    id?: string;
    user_id: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    amount_paise: number;
    currency?: string;
    plan: string;              // product ID (e.g., 'single_10q', 'pack_5', 'pro_monthly')
    product_type?: ProductType;
    status: PaymentStatus;
    receipt?: string;
    promo_code?: string;
    notes?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

// ── Legacy plan pricing (backward compat) ──────────────────────────────

export const PLAN_PRICING: Record<PaymentPlan, { amount_paise: number; label: string; months: number }> = {
    monthly:   { amount_paise: 59900,  label: '₹599/month', months: 1 },
    quarterly: { amount_paise: 59900,  label: '₹599/month', months: 1 }, // deprecated, maps to monthly
    annual:    { amount_paise: 399900, label: '₹3,999/year', months: 12 },
};

// ── Functions ──────────────────────────────────────────────────────────

/** Create a payment record (when Razorpay order is created) */
export async function createPaymentRecord(payment: {
    user_id: string;
    plan: string;
    product_type?: ProductType;
    razorpay_order_id: string;
    amount_paise: number;
    receipt: string;
    promo_code?: string;
}): Promise<Payment | null> {
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

    // For pro subscriptions, update user premium status
    if (data && (data.plan === 'pro_monthly' || data.plan === 'pro_yearly' ||
                 data.plan === 'monthly' || data.plan === 'annual')) {
        const monthsMap: Record<string, number> = {
            pro_monthly: 1, monthly: 1,
            pro_yearly: 12, annual: 12,
        };
        const months = monthsMap[data.plan] || 1;
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + months);

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

// ── Admin: Complementary / Promo ───────────────────────────────────────

/** Grant complementary Pro access to a user (admin action) */
export async function grantComplementaryAccess(
    userId: string,
    months: number = 12,
    reason: string = 'Admin complementary'
): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    const { error } = await supabaseAdmin
        .from('users')
        .update({
            is_premium: true,
            premium_expires_at: expiresAt.toISOString(),
        })
        .eq('id', userId);

    if (error) {
        console.error('[db/payments] Grant complementary error:', error.message);
        return false;
    }

    // Log it as a payment record for audit trail
    await supabaseAdmin
        .from('payments')
        .insert({
            user_id: userId,
            plan: 'pro_yearly',
            amount_paise: 0,
            receipt: `comp_${Date.now()}`,
            status: 'paid',
            razorpay_order_id: `COMP_${Date.now()}`,
        });

    return true;
}
