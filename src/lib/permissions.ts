/**
 * Feature Gating / Permissions Module
 * 
 * Controls access to premium features based on user subscription status.
 * Used by API routes and UI components to enforce feature limits.
 */

// ── Feature Definitions ────────────────────────────────────────────────

export type GatedFeature =
    | 'unlimited_quiz'
    | 'epaper_full'
    | 'daily_mock'
    | 'custom_mock'
    | 'pyq_database'
    | 'forum_write'
    | 'bookmarks'
    | 'ai_evaluation'
    | 'study_roadmap'
    | 'priority_support';

/** Features available to free-tier users */
const FREE_FEATURES: GatedFeature[] = [];

/** Daily limits for free-tier users */
export const FREE_LIMITS = {
    quizzes_per_day: 5,
    bookmarks: 0,
    forum_posts_per_day: 0,
} as const;

/** Premium users get unlimited access */
export const PREMIUM_LIMITS = {
    quizzes_per_day: Infinity,
    bookmarks: Infinity,
    forum_posts_per_day: Infinity,
} as const;

// ── Core Gating Functions ──────────────────────────────────────────────

/**
 * Check if a user has access to a specific gated feature.
 */
export function hasAccess(
    feature: GatedFeature,
    user: { is_premium?: boolean; role?: string } | null
): boolean {
    // Admins always have full access
    if (user?.role === 'admin') return true;

    // Premium users have access to all features
    if (user?.is_premium) return true;

    // Free users only have access to free features
    return FREE_FEATURES.includes(feature);
}

/**
 * Get the daily limit for a resource based on user's subscription.
 */
export function getDailyLimit(
    resource: keyof typeof FREE_LIMITS,
    user: { is_premium?: boolean; role?: string } | null
): number {
    if (user?.role === 'admin' || user?.is_premium) {
        return PREMIUM_LIMITS[resource];
    }
    return FREE_LIMITS[resource];
}

/**
 * Check if an action should be blocked and return the reason.
 * Returns null if action is allowed, or a user-friendly message if blocked.
 */
export function getGateMessage(
    feature: GatedFeature,
    user: { is_premium?: boolean; role?: string } | null
): string | null {
    if (hasAccess(feature, user)) return null;

    const messages: Record<GatedFeature, string> = {
        unlimited_quiz: 'Upgrade to Pro for unlimited AI quiz generation (free: 5/day)',
        epaper_full: 'Upgrade to Pro to access the full daily ePaper with explainers',
        daily_mock: 'Upgrade to Pro for daily Prelims & Mains mock tests',
        custom_mock: 'Upgrade to Pro to build custom mock tests',
        pyq_database: 'Upgrade to Pro for full PYQ database access & analytics',
        forum_write: 'Upgrade to Pro to post and reply in the community forum',
        bookmarks: 'Upgrade to Pro to save bookmarks and study lists',
        ai_evaluation: 'Upgrade to Pro for AI-powered answer evaluation',
        study_roadmap: 'Upgrade to Pro for a personalized study roadmap',
        priority_support: 'Upgrade to Pro for priority email support',
    };

    return messages[feature];
}

/**
 * Server-side middleware helper: check access and return 403 if blocked.
 * Use in API routes.
 */
export function requirePremium(
    feature: GatedFeature,
    user: { is_premium?: boolean; role?: string } | null
): { allowed: true } | { allowed: false; message: string; status: 403 } {
    const msg = getGateMessage(feature, user);
    if (msg) {
        return { allowed: false, message: msg, status: 403 };
    }
    return { allowed: true };
}
