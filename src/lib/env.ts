/**
 * Environment Variable Validation
 * 
 * Uses Zod to validate all required env vars at startup/import time.
 * If any required variable is missing, this throws immediately —
 * no silent fallbacks, no hardcoded defaults for secrets.
 * 
 * Issue 1.1: Replaces the dangerous hardcoded NEXTAUTH_SECRET fallback.
 */

import { z } from 'zod';

// ── Server-side env schema (validated at startup) ──────────────────────
const serverEnvSchema = z.object({
    // NextAuth
    NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
    NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET must be at least 16 characters. Generate with: openssl rand -base64 32'),

    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required').optional(),

    // Google OAuth (optional during dev, required in production)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // Gemini AI
    GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required for AI features'),

    // Cron
    CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),

    // SMTP (optional — email features degrade gracefully)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    CONTACT_EMAIL_TO: z.string().email().optional(),

    // Razorpay (optional until payments are enabled)
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});

// ── Client-side env schema (only NEXT_PUBLIC_ vars) ────────────────────
const clientEnvSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// ── Validation function ────────────────────────────────────────────────

/**
 * Validates server environment variables.
 * Call this in API routes or server components.
 * Throws a descriptive error if any required var is missing.
 */
export function validateServerEnv() {
    const result = serverEnvSchema.safeParse(process.env);

    if (!result.success) {
        const missing = result.error.issues
            .map((issue) => `  ✗ ${issue.path.join('.')}: ${issue.message}`)
            .join('\n');

        throw new Error(
            `\n❌ Missing/invalid environment variables:\n${missing}\n\n` +
            `Copy .env.local.example to .env.local and fill in the values.\n`
        );
    }

    return result.data;
}

/**
 * Validates client-side environment variables.
 * Safe to call from 'use client' components.
 */
export function validateClientEnv() {
    return clientEnvSchema.parse({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
}

// ── Typed getters (use these instead of process.env directly) ──────────

/**
 * Get a validated server env object.
 * Lazy-validated: only validates on first access, then caches.
 * Won't throw during build if env vars aren't available yet.
 */
let _cachedServerEnv: z.infer<typeof serverEnvSchema> | null = null;

export function getServerEnv() {
    if (!_cachedServerEnv) {
        _cachedServerEnv = validateServerEnv();
    }
    return _cachedServerEnv;
}

/**
 * Get a single env var with a type-safe key.
 * For use in non-critical paths where you want a graceful fallback.
 */
export function getEnvVar(key: keyof z.infer<typeof serverEnvSchema>): string | undefined {
    return process.env[key];
}

// Export the schema type for use elsewhere
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
