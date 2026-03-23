/**
 * API Route: GET /api/payments/subscription
 * 
 * Returns current subscription status and payment history for the logged-in user.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveSubscription, getPaymentHistory } from '@/lib/db/payments';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const [active, history] = await Promise.all([
            getActiveSubscription(userId),
            getPaymentHistory(userId),
        ]);

        return NextResponse.json({
            active: active || null,
            history: history.map(p => ({
                plan: p.plan,
                status: p.status,
                amount_paise: p.amount_paise,
                created_at: p.created_at,
            })),
        });
    } catch (error: any) {
        console.error('[payments/subscription] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
