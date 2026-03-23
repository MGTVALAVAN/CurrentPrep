/**
 * User Data Access Layer
 * 
 * All user-related database operations.
 * Uses supabaseAdmin (server-side, bypasses RLS) for auth operations.
 */

import bcryptjs from 'bcryptjs';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import type { DbUser, SafeUser, UserRole } from '@/types/database';

const SALT_ROUNDS = 12;

// ── Read Operations ────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<DbUser | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return null;
    return data as DbUser;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

    if (error || !data) return null;
    return data as DbUser;
}

/**
 * Get a safe user object (no password_hash) for client-side use.
 */
export async function getSafeUserById(id: string): Promise<SafeUser | null> {
    const user = await getUserById(id);
    if (!user) return null;
    return toSafeUser(user);
}

// ── Write Operations ───────────────────────────────────────────────────

/**
 * Create a new user with email + hashed password.
 * Returns the created user or null if email already exists.
 */
export async function createUser(params: {
    email: string;
    password: string;
    name: string;
}): Promise<DbUser | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabaseAdmin();
    const email = params.email.toLowerCase().trim();

    // Check if user already exists
    const existing = await getUserByEmail(email);
    if (existing) return null;  // caller should handle "email already registered"

    // Hash password
    const password_hash = await bcryptjs.hash(params.password, SALT_ROUNDS);

    const { data, error } = await supabase
        .from('users')
        .insert({
            email,
            password_hash,
            name: params.name.trim(),
            role: 'user' as UserRole,
            language_pref: 'en',
            is_premium: false,
        })
        .select()
        .single();

    if (error) {
        console.error('[db/users] Create user error:', error.message);
        return null;
    }

    return data as DbUser;
}

/**
 * Create or update a user from OAuth (Google).
 * If user exists, update name/avatar. If not, create new.
 */
export async function upsertOAuthUser(params: {
    email: string;
    name: string | null;
    avatar_url: string | null;
}): Promise<DbUser | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabaseAdmin();
    const email = params.email.toLowerCase().trim();

    const { data, error } = await supabase
        .from('users')
        .upsert(
            {
                email,
                name: params.name,
                avatar_url: params.avatar_url,
                // Don't set password_hash for OAuth users
                // Don't override role or premium if user already exists
            },
            {
                onConflict: 'email',
                ignoreDuplicates: false,
            }
        )
        .select()
        .single();

    if (error) {
        console.error('[db/users] Upsert OAuth user error:', error.message);
        // Try fetching existing user if upsert had conflict issues
        return getUserByEmail(email);
    }

    return data as DbUser;
}

/**
 * Update user fields. Only provided fields are updated.
 */
export async function updateUser(
    id: string,
    updates: Partial<Pick<DbUser, 'name' | 'avatar_url' | 'language_pref' | 'is_premium' | 'premium_expires_at' | 'role'>>
): Promise<DbUser | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('[db/users] Update user error:', error.message);
        return null;
    }

    return data as DbUser;
}

// ── Auth Helpers ───────────────────────────────────────────────────────

/**
 * Validate email + password credentials.
 * Returns the user if valid, null if invalid.
 */
export async function validateCredentials(
    email: string,
    password: string
): Promise<DbUser | null> {
    const user = await getUserByEmail(email);
    if (!user || !user.password_hash) return null;

    const isValid = await bcryptjs.compare(password, user.password_hash);
    return isValid ? user : null;
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Strip password_hash from user object */
function toSafeUser(user: DbUser): SafeUser {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        role: user.role,
        language_pref: user.language_pref,
        is_premium: user.is_premium,
        premium_expires_at: user.premium_expires_at,
        created_at: user.created_at,
    };
}
