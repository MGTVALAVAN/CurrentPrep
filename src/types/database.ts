/**
 * Database Types
 * 
 * Shared TypeScript types for all Supabase tables.
 * These match the schema defined in supabase/migrations/.
 */

// ── Users ──────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin' | 'moderator';

export interface DbUser {
    id: string;
    email: string;
    password_hash: string | null;  // null for OAuth-only users
    name: string | null;
    avatar_url: string | null;
    role: UserRole;
    language_pref: 'en' | 'ta';
    is_premium: boolean;
    premium_expires_at: string | null;  // ISO timestamp
    created_at: string;
    updated_at: string;
}

/** Safe user object (no password_hash) for client-side use */
export interface SafeUser {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    role: UserRole;
    language_pref: 'en' | 'ta';
    is_premium: boolean;
    premium_expires_at: string | null;
    created_at: string;
}

// ── Quiz Attempts ──────────────────────────────────────────────────────

export interface DbQuizAttempt {
    id: string;
    user_id: string;
    quiz_type: 'prelims_mcq' | 'mains_descriptive' | 'csat' | 'current_affairs';
    subject: string | null;
    topic_id: string | null;
    total_questions: number;
    correct_answers: number;
    score_percentage: number;
    time_taken_seconds: number | null;
    questions: Record<string, unknown> | null;  // JSONB — stores full quiz data
    completed_at: string;
}

// ── ePaper Editions ────────────────────────────────────────────────────

export interface DbEpaperEdition {
    id: string;
    date: string;         // YYYY-MM-DD, unique
    title: string;
    content: Record<string, unknown>;  // JSONB — full ePaper data
    pdf_url: string | null;
    created_at: string;
}

// ── Current Affairs ────────────────────────────────────────────────────

export interface DbCurrentAffair {
    id: string;
    date: string;
    title: string;
    summary: string | null;
    content: Record<string, unknown>;  // JSONB
    category: string;
    source: string | null;
    tags: string[] | null;
    created_at: string;
}

// ── Forum Posts ────────────────────────────────────────────────────────

export type ForumCategory = 'prelims' | 'mains' | 'optional' | 'strategy' | 'current_affairs' | 'general';

export interface DbForumPost {
    id: string;
    user_id: string;
    title: string;
    content: string;
    category: ForumCategory;
    upvotes: number;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
}

export interface DbForumComment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    upvotes: number;
    created_at: string;
}

// ── Payments ───────────────────────────────────────────────────────────

export type PaymentStatus = 'created' | 'paid' | 'failed' | 'refunded';
export type PlanType = 'free' | 'pro_monthly' | 'pro_quarterly' | 'pro_yearly';

export interface DbPayment {
    id: string;
    user_id: string;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    amount_paise: number;
    plan: PlanType;
    status: PaymentStatus;
    created_at: string;
}

// ── Bookmarks ──────────────────────────────────────────────────────────

export type ContentType = 'current_affair' | 'epaper' | 'quiz' | 'forum_post';

export interface DbBookmark {
    id: string;
    user_id: string;
    content_type: ContentType;
    content_id: string;
    created_at: string;
}

// ── Badges ─────────────────────────────────────────────────────────────

export interface DbUserBadge {
    id: string;
    user_id: string;
    badge_name: string;
    badge_description: string;
    earned_at: string;
}

// ── Study Sessions ─────────────────────────────────────────────────────

export interface DbStudySession {
    id: string;
    user_id: string;
    started_at: string;
    ended_at: string | null;
    duration_minutes: number | null;
    subject: string | null;
    activity_type: string | null;
}

// ── Contact Messages ───────────────────────────────────────────────────

export interface DbContactMessage {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    is_read: boolean;
    replied_at: string | null;
    created_at: string;
}

// ── Admin Audit Log ────────────────────────────────────────────────────

export interface DbAdminAuditLog {
    id: string;
    admin_id: string;
    action: string;
    target_type: string | null;
    target_id: string | null;
    details: Record<string, unknown> | null;
    created_at: string;
}

// ── NextAuth extended types ────────────────────────────────────────────

/** Extended session user to include role and premium info */
export interface SessionUser {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    is_premium: boolean;
    image?: string | null;
}
