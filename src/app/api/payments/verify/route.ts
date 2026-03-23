/**
 * API Route: POST /api/payments/verify
 * 
 * Verifies Razorpay payment signature after successful checkout.
 * Updates payment record and activates premium subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { markPaymentPaid, markPaymentFailed } from '@/lib/db/payments';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = await request.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({
                error: 'Missing payment verification fields',
            }, { status: 400 });
        }

        // Verify signature
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            console.error('[payments/verify] RAZORPAY_KEY_SECRET not set');
            return NextResponse.json({ error: 'Payment service not configured' }, { status: 503 });
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.warn('[payments/verify] Signature mismatch for order:', razorpay_order_id);
            await markPaymentFailed(razorpay_order_id);
            return NextResponse.json({
                error: 'Payment verification failed. Signature mismatch.',
            }, { status: 400 });
        }

        // Signature valid — mark payment as paid and activate premium
        const payment = await markPaymentPaid(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!payment) {
            return NextResponse.json({
                error: 'Failed to update payment record',
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Payment verified! Premium activated.',
            plan: payment.plan,
        });

    } catch (error: any) {
        console.error('[payments/verify] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
