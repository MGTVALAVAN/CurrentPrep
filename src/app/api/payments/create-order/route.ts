/**
 * API Route: POST /api/payments/create-order
 * 
 * Creates a Razorpay order for the selected plan.
 * Requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PLAN_PRICING, PaymentPlan } from '@/lib/db/payments';
import { createPaymentRecord } from '@/lib/db/payments';
import Razorpay from 'razorpay';

function getRazorpayInstance() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials not configured');
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { plan } = await request.json();

        if (!plan || !PLAN_PRICING[plan as PaymentPlan]) {
            return NextResponse.json({
                error: 'Invalid plan. Choose: monthly, quarterly, or annual',
            }, { status: 400 });
        }

        const planInfo = PLAN_PRICING[plan as PaymentPlan];
        const userId = (session.user as any).id;
        const receipt = `rcpt_${userId.slice(0, 8)}_${Date.now()}`;

        // Create Razorpay order
        let razorpayOrder;
        try {
            const razorpay = getRazorpayInstance();
            razorpayOrder = await razorpay.orders.create({
                amount: planInfo.amount_paise,
                currency: 'INR',
                receipt,
                notes: {
                    userId,
                    plan,
                    userEmail: session.user.email || '',
                },
            });
        } catch (err: any) {
            console.error('[payments/create-order] Razorpay error:', err.message);
            return NextResponse.json({
                error: 'Payment service unavailable. Please try again later.',
            }, { status: 503 });
        }

        // Save payment record to DB
        await createPaymentRecord({
            user_id: userId,
            plan: plan as PaymentPlan,
            razorpay_order_id: razorpayOrder.id,
            amount_paise: planInfo.amount_paise,
            receipt,
        });

        return NextResponse.json({
            orderId: razorpayOrder.id,
            amount: planInfo.amount_paise,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
            plan,
            planLabel: planInfo.label,
        });

    } catch (error: any) {
        console.error('[payments/create-order] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
