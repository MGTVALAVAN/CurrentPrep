/**
 * Pricing Configuration — "Netflix of UPSC Tests"
 *
 * 3-tier model: Single Tests → Test Packs → Pro Unlimited
 * Referenced by: pricing page, payment API, feature gating, admin panel.
 */

// ── Product Types ──────────────────────────────────────────────────────

export type ProductType = 'single_test' | 'test_pack' | 'pro_subscription';

export interface SingleTestProduct {
    id: string;
    type: 'single_test';
    label: string;
    questionCount: number;
    price: number;           // in ₹
    amountPaise: number;     // for Razorpay
    description?: string;
}

export interface TestPackProduct {
    id: string;
    type: 'test_pack';
    label: string;
    testCount: number;
    price: number;
    amountPaise: number;
    originalPrice: number;   // before discount
    savings: string;         // e.g. "Save 20%"
    description?: string;
}

export type ProBillingPeriod = 'monthly' | 'yearly';

export interface ProSubscriptionProduct {
    id: string;
    type: 'pro_subscription';
    billingPeriod: ProBillingPeriod;
    label: string;
    price: number;
    amountPaise: number;
    pricePerMonth: number;
    months: number;
    savings?: string;
    popular?: boolean;
    features: string[];
}

export type PricingProduct = SingleTestProduct | TestPackProduct | ProSubscriptionProduct;

// ── Single Tests ───────────────────────────────────────────────────────

export const SINGLE_TESTS: SingleTestProduct[] = [
    {
        id: 'single_10q',
        type: 'single_test',
        label: '10 Questions',
        questionCount: 10,
        price: 39,
        amountPaise: 3900,
    },
    {
        id: 'single_25q',
        type: 'single_test',
        label: '25 Questions',
        questionCount: 25,
        price: 79,
        amountPaise: 7900,
    },
    {
        id: 'single_50q',
        type: 'single_test',
        label: '50 Questions',
        questionCount: 50,
        price: 119,
        amountPaise: 11900,
    },
    {
        id: 'single_100q',
        type: 'single_test',
        label: '100 Questions',
        questionCount: 100,
        price: 162,
        amountPaise: 16200,
    },
    {
        id: 'single_full',
        type: 'single_test',
        label: 'Full Length',
        questionCount: 200,
        price: 249,
        amountPaise: 24900,
        description: 'Complete UPSC-style paper',
    },
];

// ── Test Packs ─────────────────────────────────────────────────────────

export const TEST_PACKS: TestPackProduct[] = [
    {
        id: 'pack_5',
        type: 'test_pack',
        label: '5 Tests (any size)',
        testCount: 5,
        price: 399,
        amountPaise: 39900,
        originalPrice: 499,
        savings: 'Save 20%',
    },
    {
        id: 'pack_15',
        type: 'test_pack',
        label: '15 Tests',
        testCount: 15,
        price: 999,
        amountPaise: 99900,
        originalPrice: 1332,
        savings: 'Save 25%',
        description: 'Best for serious practice',
    },
    {
        id: 'pack_csat',
        type: 'test_pack',
        label: 'CSAT Pack (10 tests)',
        testCount: 10,
        price: 299,
        amountPaise: 29900,
        originalPrice: 399,
        savings: 'CSAT Special',
        description: 'Paper II focused',
    },
];

// ── Pro Unlimited ──────────────────────────────────────────────────────

const PRO_FEATURES = [
    'Unlimited all tests + CSAT',
    'Detailed solutions & analytics',
    'Full June–May cycle coverage',
    'Easy / Medium / Hard levels',
    'Priority support',
    'Daily ePaper & mock access',
];

export const PRO_PLANS: ProSubscriptionProduct[] = [
    {
        id: 'pro_monthly',
        type: 'pro_subscription',
        billingPeriod: 'monthly',
        label: 'Monthly',
        price: 599,
        amountPaise: 59900,
        pricePerMonth: 599,
        months: 1,
        features: PRO_FEATURES,
    },
    {
        id: 'pro_yearly',
        type: 'pro_subscription',
        billingPeriod: 'yearly',
        label: 'Yearly',
        price: 3999,
        amountPaise: 399900,
        pricePerMonth: 333,
        months: 12,
        savings: 'Save 44%',
        popular: true,
        features: PRO_FEATURES,
    },
];

// ── Competitor Comparison ──────────────────────────────────────────────

export interface ComparisonRow {
    feature: string;
    others: string;
    ours: string;
    highlight?: boolean;
}

export const COMPETITOR_COMPARISON: ComparisonRow[] = [
    { feature: 'Tests Available', others: '30–60 tests', ours: 'Unlimited', highlight: true },
    { feature: 'Price', others: '₹3,000–₹9,000', ours: '₹3,999/yr', highlight: true },
    { feature: 'Cycle Coverage', others: 'Limited', ours: 'Full June–May' },
    { feature: 'Difficulty Levels', others: 'Fixed', ours: 'Easy / Med / Hard' },
    { feature: 'CSAT Coverage', others: 'Extra charge', ours: 'Included' },
    { feature: 'Support', others: 'Basic', ours: 'Priority' },
];

// ── FAQ ────────────────────────────────────────────────────────────────

export interface FAQItem {
    question: string;
    answer: string;
}

export const PRICING_FAQ: FAQItem[] = [
    {
        question: 'Is there really a free test I can try first?',
        answer: 'Yes! Click "Start Free Test" to take a 10-question easy-level test. No credit card needed — just your email so we can show you your results.',
    },
    {
        question: 'How does Pro Unlimited work? Can I cancel anytime?',
        answer: 'Pro gives you unlimited access to all tests, CSAT papers, detailed solutions, and analytics. Cancel anytime from your dashboard — no lock-in, no hidden charges.',
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept UPI, all major debit & credit cards, net banking, and popular wallets via Razorpay — India\'s most trusted payment gateway. All transactions are 100% secure.',
    },
    {
        question: 'How are your tests different from free YouTube mocks?',
        answer: 'Our questions are curated by UPSC subject experts, difficulty-calibrated (Easy/Med/Hard), and come with detailed solutions + performance analytics. YouTube mocks don\'t tell you WHERE you\'re weak.',
    },
    {
        question: 'I already bought 3 single tests. Can I upgrade to Pro?',
        answer: 'Absolutely! When you upgrade to Pro, you get unlimited everything. If you bought tests in the last 7 days, we\'ll credit the difference towards your Pro subscription.',
    },
];

// ── Promo & Complementary ──────────────────────────────────────────────

export interface PromoCode {
    code: string;
    discountPercent: number;
    maxUses?: number;
    expiresAt?: string;       // ISO date
    applicableTo: ProductType[];
    description: string;
}

// Admin-managed promo codes (extend via admin panel or DB in production)
export const DEFAULT_PROMOS: PromoCode[] = [
    {
        code: 'LAUNCH50',
        discountPercent: 50,
        applicableTo: ['single_test', 'test_pack'],
        description: 'Launch offer — 50% off single tests & packs',
    },
    {
        code: 'FIRSTTEST',
        discountPercent: 50,
        applicableTo: ['single_test'],
        description: 'First test 50% off',
    },
];

// ── Helpers ────────────────────────────────────────────────────────────

export function getProductById(id: string): PricingProduct | undefined {
    return [
        ...SINGLE_TESTS,
        ...TEST_PACKS,
        ...PRO_PLANS,
    ].find(p => p.id === id);
}

export function formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function applyPromo(amountPaise: number, promoCode: string): { finalPaise: number; discount: number } | null {
    const promo = DEFAULT_PROMOS.find(p => p.code === promoCode.toUpperCase());
    if (!promo) return null;
    const discount = Math.round(amountPaise * promo.discountPercent / 100);
    return { finalPaise: amountPaise - discount, discount };
}

/**
 * Legacy re-exports for backward compatibility with existing PaymentButton.
 * Maps old BillingPeriod → new product IDs.
 */
export type BillingPeriod = 'monthly' | 'quarterly' | 'annual';

export interface PricingPlan {
    id: BillingPeriod;
    label: string;
    price: number;
    pricePerMonth: number;
    amountPaise: number;
    duration: string;
    months: number;
    savings?: string;
    popular?: boolean;
}

export const PLANS: PricingPlan[] = [
    {
        id: 'monthly',
        label: 'Monthly',
        price: 599,
        pricePerMonth: 599,
        amountPaise: 59900,
        duration: '1 month',
        months: 1,
    },
    {
        id: 'annual',
        label: 'Annual',
        price: 3999,
        pricePerMonth: 333,
        amountPaise: 399900,
        duration: '12 months',
        months: 12,
        savings: 'Save 44%',
        popular: true,
    },
];

export function getPlanById(id: BillingPeriod): PricingPlan | undefined {
    return PLANS.find(p => p.id === id);
}
