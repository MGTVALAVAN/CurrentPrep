/**
 * API Route: GET /api/admin/payments
 *
 * Returns payment stats and recent transactions for the admin dashboard.
 * Protected by middleware (admin role required).
 *
 * Query params:
 *   - page: pagination (default: 1)
 *   - limit: items per page (default: 20, max: 100)
 *   - status: filter by payment status (paid, failed, created, refunded)
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({
            summary: {
                totalRevenue: 0,
                totalPaid: 0,
                totalFailed: 0,
                totalPending: 0,
                avgOrderValue: 0,
            },
            byPlan: [],
            recent: [],
            total: 0,
        });
    }

    const supabase = getSupabaseAdmin();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const statusFilter = url.searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    try {
        // 1. Aggregate stats — fetch all payments for aggregation
        const { data: allPayments } = await supabase
            .from('payments')
            .select('amount_paise, status, plan');

        const payments = allPayments || [];

        const totalRevenue = payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + (p.amount_paise || 0), 0);

        const totalPaid = payments.filter(p => p.status === 'paid').length;
        const totalFailed = payments.filter(p => p.status === 'failed').length;
        const totalPending = payments.filter(p => p.status === 'created').length;
        const avgOrderValue = totalPaid > 0 ? Math.round(totalRevenue / totalPaid) : 0;

        // 2. Revenue by plan
        const planMap: Record<string, { count: number; revenue: number }> = {};
        for (const p of payments.filter(p => p.status === 'paid')) {
            const plan = p.plan || 'unknown';
            if (!planMap[plan]) planMap[plan] = { count: 0, revenue: 0 };
            planMap[plan].count++;
            planMap[plan].revenue += p.amount_paise || 0;
        }
        const byPlan = Object.entries(planMap)
            .map(([plan, data]) => ({ plan, ...data }))
            .sort((a, b) => b.revenue - a.revenue);

        // 3. Recent transactions with user info
        let query = supabase
            .from('payments')
            .select('id, user_id, plan, amount_paise, status, receipt, razorpay_order_id, created_at, users!inner(name, email)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (statusFilter && statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data: recent, count, error } = await query;

        if (error) {
            console.error('[admin/payments] Query error:', error.message);
        }

        const recentTransactions = (recent || []).map((p: any) => ({
            id: p.id,
            userName: p.users?.name || '—',
            userEmail: p.users?.email || '—',
            plan: p.plan,
            amount: p.amount_paise,
            status: p.status,
            receipt: p.receipt,
            orderId: p.razorpay_order_id,
            date: p.created_at,
        }));

        return NextResponse.json({
            summary: {
                totalRevenue,
                totalPaid,
                totalFailed,
                totalPending,
                avgOrderValue,
            },
            byPlan,
            recent: recentTransactions,
            total: count || 0,
            page,
            limit,
        });

    } catch (error: any) {
        console.error('[admin/payments] Error:', error.message);
        return NextResponse.json({ error: 'Failed to fetch payment data' }, { status: 500 });
    }
}
