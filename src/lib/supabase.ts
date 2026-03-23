/**
 * Supabase Client Library
 * 
 * Two clients:
 *   supabaseClient  — uses anon key, respects RLS (for client-side)
 *   supabaseAdmin   — uses service role key, bypasses RLS (for server-side only)
 * 
 * Issue 7.2: Establishes the data layer needed by auth, APIs, and pages.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Client-side Supabase (anon key, RLS enforced) ─────────────────────

let _supabaseClient: SupabaseClient | null = null;

/**
 * Get the client-side Supabase instance.
 * Uses the anon key — all queries are constrained by RLS policies.
 * Safe to use in both client and server components.
 */
export function getSupabaseClient(): SupabaseClient {
    if (_supabaseClient) return _supabaseClient;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error(
            'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
        );
    }

    _supabaseClient = createClient(url, anonKey, {
        auth: {
            persistSession: false, // NextAuth handles sessions, not Supabase Auth
        },
    });

    return _supabaseClient;
}

// ── Server-side Supabase (service role key, bypasses RLS) ──────────────

let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Get the server-side admin Supabase instance.
 * Uses the service role key — bypasses all RLS policies.
 * 
 * ⚠️ ONLY use in:
 *   - API routes (server-side)
 *   - Server components
 *   - Scripts
 * 
 * NEVER expose this to the client.
 */
export function getSupabaseAdmin(): SupabaseClient {
    if (_supabaseAdmin) return _supabaseAdmin;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error(
            'Missing Supabase admin env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.\n' +
            'The service role key is found in Supabase Dashboard → Settings → API.'
        );
    }

    _supabaseAdmin = createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return _supabaseAdmin;
}

/**
 * Helper: Check if Supabase is configured.
 * Returns false during development if env vars aren't set.
 * Use this for graceful degradation.
 */
export function isSupabaseConfigured(): boolean {
    return !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
}

/**
 * Convenience getter: lazily create and return the admin Supabase client.
 * Safe to use at module-level because it throws only when actually called
 * (not at import time).
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return (getSupabaseAdmin() as any)[prop];
    },
});

