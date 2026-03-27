/**
 * API Route: POST /api/payments/create-order
 *
 * Creates a Razorpay order for any product type:
 * - Single tests, test packs, or pro subscriptions
 * - Supports promo codes
 * - Works in TEST mode on localhost (no real charges)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPaymentRecord, PLAN_PRICING, PaymentPlan } from '@/lib/db/payments';
import { getProductById, applyPromo } from '@/config/pricing';
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

        const body = await request.json();
        const { plan, productId, promoCode } = body;

        // Resolve product — support both legacy `plan` and new `productId`
        let productLabel: string;
        let amountPaise: number;
        let resolvedPlan: string;

        if (productId) {
            // New 3-tier system
            const product = getProductById(productId);
            if (!product) {
                return NextResponse.json({
                    error: 'Invalid product. Check available plans on the pricing page.',
                }, { status: 400 });
            }
            productLabel = product.label;
            amountPaise = product.amountPaise;
            resolvedPlan = product.id;
        } else if (plan && PLAN_PRICING[plan as PaymentPlan]) {
            // Legacy billing period support
            const planInfo = PLAN_PRICING[plan as PaymentPlan];
            productLabel = planInfo.label;
            amountPaise = planInfo.amount_paise;
            resolvedPlan = plan;
        } else {
            return NextResponse.json({
                error: 'Invalid plan or product. Provide a valid productId or plan.',
            }, { status: 400 });
        }

        // Apply promo code if provided
        let appliedPromo: string | undefined;
        if (promoCode) {
            const promoResult = applyPromo(amountPaise, promoCode);
            if (promoResult) {
                amountPaise = promoResult.finalPaise;
                appliedPromo = promoCode.toUpperCase();
            }
            // Silently ignore invalid promo codes (don't block payment)
        }

        const userId = (session.user as any).id;
        const receipt = `rcpt_${userId.slice(0, 8)}_${Date.now()}`;

        // Create Razorpay order
        let razorpayOrder;
        try {
            const razorpay = getRazorpayInstance();
            razorpayOrder = await razorpay.orders.create({
                amount: amountPaise,
                currency: 'INR',
                receipt,
                notes: {
                    userId,
                    plan: resolvedPlan,
                    userEmail: session.user.email || '',
                    ...(appliedPromo ? { promoCode: appliedPromo } : {}),
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
            plan: resolvedPlan,
            razorpay_order_id: razorpayOrder.id,
            amount_paise: amountPaise,
            receipt,
            promo_code: appliedPromo,
        });

        return NextResponse.json({
            orderId: razorpayOrder.id,
            amount: amountPaise,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
            plan: resolvedPlan,
            planLabel: productLabel,
            ...(appliedPromo ? { promoApplied: appliedPromo } : {}),
        });

    } catch (error: any) {
        console.error('[payments/create-order] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
