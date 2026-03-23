/**
 * Pricing Plans Configuration
 * 
 * Central config for all pricing tiers, feature lists, and billing periods.
 * Referenced by: pricing page, payment API, feature gating, admin panel.
 */

export type BillingPeriod = 'monthly' | 'quarterly' | 'annual';

export interface PricingPlan {
    id: BillingPeriod;
    label: string;
    price: number;          // in ₹
    pricePerMonth: number;  // effective monthly rate
    amountPaise: number;    // for Razorpay
    duration: string;
    months: number;
    savings?: string;       // e.g. "Save 11%"
    popular?: boolean;
}

export const PLANS: PricingPlan[] = [
    {
        id: 'monthly',
        label: 'Monthly',
        price: 299,
        pricePerMonth: 299,
        amountPaise: 29900,
        duration: '1 month',
        months: 1,
    },
    {
        id: 'quarterly',
        label: 'Quarterly',
        price: 799,
        pricePerMonth: 267,
        amountPaise: 79900,
        duration: '3 months',
        months: 3,
        savings: 'Save 11%',
        popular: true,
    },
    {
        id: 'annual',
        label: 'Annual',
        price: 2499,
        pricePerMonth: 209,
        amountPaise: 249900,
        duration: '12 months',
        months: 12,
        savings: 'Save 30%',
    },
];

// ── Features by tier ───────────────────────────────────────────────────

export interface Feature {
    text: string;
    free: boolean;
    pro: boolean;
    highlight?: boolean;  // visually emphasize in pro column
}

export const FEATURES: Feature[] = [
    { text: 'Daily Current Affairs Digest',           free: true,  pro: true },
    { text: 'UPSC Syllabus Hub with PDFs',            free: true,  pro: true },
    { text: 'Community Forum (read-only)',             free: true,  pro: true },
    { text: 'AI Quiz Practice (5/day)',                free: true,  pro: false },
    { text: 'Bilingual Support (EN/Tamil)',            free: true,  pro: true },
    { text: 'Daily ePaper with Explainers',            free: false, pro: true, highlight: true },
    { text: 'Unlimited AI Quiz Generation',            free: false, pro: true, highlight: true },
    { text: 'Daily Mock Tests (Prelims + Mains)',      free: false, pro: true, highlight: true },
    { text: 'PYQ Database & Analytics',                free: false, pro: true },
    { text: 'Custom Mock Builder',                     free: false, pro: true },
    { text: 'Full Forum Access (post & reply)',        free: false, pro: true },
    { text: 'Bookmarks & Study Lists',                free: false, pro: true },
    { text: 'AI Answer Evaluation',                    free: false, pro: true },
    { text: 'Personalized Study Roadmap',              free: false, pro: true },
    { text: 'Priority Support',                        free: false, pro: true },
];

// ── Convenience helpers ────────────────────────────────────────────────

export function getPlanById(id: BillingPeriod): PricingPlan | undefined {
    return PLANS.find(p => p.id === id);
}

export function formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}
