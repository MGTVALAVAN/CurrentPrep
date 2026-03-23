/**
 * API Route: POST /api/payments/webhook
 * 
 * Razorpay webhook handler (server-to-server).
 * Handles payment.captured, payment.failed events.
 * Verifies webhook signature for authenticity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { markPaymentPaid, markPaymentFailed } from '@/lib/db/payments';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('[payments/webhook] RAZORPAY_WEBHOOK_SECRET not set');
            return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
        }

        // Read raw body for signature verification
        const rawBody = await request.text();
        const signature = request.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        if (expectedSignature !== signature) {
            console.warn('[payments/webhook] Invalid signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const event = JSON.parse(rawBody);
        const eventType = event.event;

        console.log(`[payments/webhook] Received event: ${eventType}`);

        if (eventType === 'payment.captured') {
            const payment = event.payload.payment.entity;
            const orderId = payment.order_id;
            const paymentId = payment.id;

            // For webhook, we don't have the client signature, so we just use the webhook verification
            await markPaymentPaid(orderId, paymentId, `webhook_${signature.slice(0, 16)}`);
            console.log(`[payments/webhook] Payment captured: ${paymentId}`);
        }

        if (eventType === 'payment.failed') {
            const payment = event.payload.payment.entity;
            const orderId = payment.order_id;
            await markPaymentFailed(orderId);
            console.log(`[payments/webhook] Payment failed for order: ${orderId}`);
        }

        // Always acknowledge receipt
        return NextResponse.json({ status: 'ok' });

    } catch (error: any) {
        console.error('[payments/webhook] Error:', error.message);
        // Still return 200 so Razorpay doesn't retry on parse errors
        return NextResponse.json({ status: 'error', message: error.message }, { status: 200 });
    }
}
