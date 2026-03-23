/**
 * Environment & Supabase Configuration Tests
 * 
 * Tests that the Supabase client library handles
 * missing/present configuration correctly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Supabase Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('isSupabaseConfigured returns false when env vars are missing', async () => {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        const { isSupabaseConfigured } = await import('@/lib/supabase');
        expect(isSupabaseConfigured()).toBe(false);
    });

    it('isSupabaseConfigured returns true for any non-empty values', async () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your-anon-key';

        const { isSupabaseConfigured } = await import('@/lib/supabase');
        // Function only checks presence, not validity
        expect(isSupabaseConfigured()).toBe(true);
    });

    it('isSupabaseConfigured returns true when real values are set', async () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdef.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.real-key';

        const { isSupabaseConfigured } = await import('@/lib/supabase');
        expect(isSupabaseConfigured()).toBe(true);
    });
});

describe('Required Environment Variables', () => {
    it('NEXTAUTH_SECRET is set in test environment', () => {
        expect(process.env.NEXTAUTH_SECRET).toBeTruthy();
    });

    it('NEXTAUTH_SECRET is not a default/placeholder', () => {
        expect(process.env.NEXTAUTH_SECRET).not.toBe('');
        expect(process.env.NEXTAUTH_SECRET).not.toBe('change-me');
    });
});
