/**
 * Auth Configuration Tests
 * 
 * Tests the NextAuth configuration: providers, callbacks, session strategy.
 */

import { describe, it, expect, vi } from 'vitest';

// Must mock before importing
vi.mock('@/lib/db/users', () => ({
    validateCredentials: vi.fn(),
    upsertOAuthUser: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
    isSupabaseConfigured: vi.fn(() => false),
    supabase: null,
}));

import { authOptions } from '@/lib/auth';

describe('Auth Configuration', () => {
    it('uses JWT session strategy', () => {
        expect(authOptions.session?.strategy).toBe('jwt');
    });

    it('has 30-day session maxAge', () => {
        expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60);
    });

    it('has custom sign-in page set to /login', () => {
        expect(authOptions.pages?.signIn).toBe('/login');
    });

    it('has error page set to /login', () => {
        expect(authOptions.pages?.error).toBe('/login');
    });

    it('has credentials provider configured', () => {
        const credsProv = authOptions.providers.find(
            (p: any) => p.name === 'CurrentPrep' || p.id === 'credentials'
        );
        expect(credsProv).toBeDefined();
    });

    it('has a secret set from env', () => {
        expect(authOptions.secret).toBeTruthy();
    });

    it('has jwt callback', () => {
        expect(authOptions.callbacks?.jwt).toBeDefined();
    });

    it('has session callback', () => {
        expect(authOptions.callbacks?.session).toBeDefined();
    });

    describe('JWT callback', () => {
        it('populates token with user data on sign-in', async () => {
            const jwtCallback = authOptions.callbacks!.jwt!;
            const token = await (jwtCallback as any)({
                token: {},
                user: { id: 'user-123', role: 'admin', is_premium: true },
                account: null,
            });
            expect(token.userId).toBe('user-123');
            expect(token.role).toBe('admin');
            expect(token.is_premium).toBe(true);
        });

        it('preserves existing token when no user', async () => {
            const jwtCallback = authOptions.callbacks!.jwt!;
            const token = await (jwtCallback as any)({
                token: { userId: 'existing', role: 'user' },
                user: undefined,
                account: null,
            });
            expect(token.userId).toBe('existing');
            expect(token.role).toBe('user');
        });
    });

    describe('Session callback', () => {
        it('exposes userId and role in session', async () => {
            const sessionCallback = authOptions.callbacks!.session!;
            const session = await (sessionCallback as any)({
                session: { user: { name: 'Test', email: 'test@test.com' } },
                token: { userId: 'u-456', role: 'admin', is_premium: true },
            });
            expect((session.user as any).id).toBe('u-456');
            expect((session.user as any).role).toBe('admin');
            expect((session.user as any).is_premium).toBe(true);
        });
    });
});
