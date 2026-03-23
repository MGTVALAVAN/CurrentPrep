/**
 * NextAuth.js API Route
 * 
 * SECURITY FIXES:
 *   1.1 — No hardcoded secret fallback. Throws if NEXTAUTH_SECRET is missing.
 *   1.2 — Real credential validation against Supabase users table with bcrypt.
 *         Supports both email/password and Google OAuth.
 *         JWT includes userId and role for downstream authorization.
 */

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { validateCredentials, upsertOAuthUser } from '@/lib/db/users';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { UserRole } from '@/types/database';

// ── Validate required secret at module load ────────────────────────────
if (!process.env.NEXTAUTH_SECRET) {
    throw new Error(
        '❌ NEXTAUTH_SECRET is not set.\n' +
        'This is a critical security requirement. Generate one with:\n' +
        '  openssl rand -base64 32\n' +
        'Then add it to your .env.local file.'
    );
}

// ── Auth Options ───────────────────────────────────────────────────────
export const authOptions: NextAuthOptions = {
    providers: [
        // ── Email/Password Login ───────────────────────────────────
        CredentialsProvider({
            name: 'CurrentPrep',
            credentials: {
                email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required');
                }

                // If Supabase isn't configured yet (dev mode), allow a
                // single admin account for testing purposes
                if (!isSupabaseConfigured()) {
                    console.warn(
                        '[auth] ⚠️ Supabase not configured — falling back to dev-only mode.\n' +
                        '       Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable real auth.'
                    );
                    // Dev-only: allow admin@currentprep.in with the NEXTAUTH_SECRET as password
                    if (
                        credentials.email === 'admin@currentprep.in' &&
                        credentials.password === process.env.NEXTAUTH_SECRET
                    ) {
                        return {
                            id: 'dev-admin-001',
                            name: 'Dev Admin',
                            email: 'admin@currentprep.in',
                            role: 'admin' as UserRole,
                            is_premium: true,
                        };
                    }
                    throw new Error('Invalid credentials. In dev mode, use admin@currentprep.in.');
                }

                // Production: validate against Supabase
                const user = await validateCredentials(
                    credentials.email,
                    credentials.password
                );

                if (!user) {
                    throw new Error('Invalid email or password');
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    is_premium: user.is_premium,
                    image: user.avatar_url,
                };
            },
        }),

        // ── Google OAuth ───────────────────────────────────────────
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                GoogleProvider({
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                }),
            ]
            : []),
    ],

    // ── Custom Pages ───────────────────────────────────────────────
    pages: {
        signIn: '/login',
        // signUp: '/register',  // uncomment when register page is built
        error: '/login',  // redirect auth errors to login page
    },

    // ── Session Strategy ───────────────────────────────────────────
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,  // 30 days
    },

    // ── Callbacks ──────────────────────────────────────────────────
    callbacks: {
        /**
         * JWT callback: Add custom fields to the token.
         * Runs on sign-in and on every request that reads the session.
         */
        async jwt({ token, user, account }) {
            // On initial sign-in, populate the token with user data
            if (user) {
                token.userId = user.id;
                token.role = (user as any).role || 'user';
                token.is_premium = (user as any).is_premium || false;
            }

            // On Google OAuth sign-in, upsert user in database
            if (account?.provider === 'google' && user && isSupabaseConfigured()) {
                const dbUser = await upsertOAuthUser({
                    email: user.email!,
                    name: user.name || null,
                    avatar_url: user.image || null,
                });

                if (dbUser) {
                    token.userId = dbUser.id;
                    token.role = dbUser.role;
                    token.is_premium = dbUser.is_premium;
                }
            }

            return token;
        },

        /**
         * Session callback: Expose custom token fields in the session.
         * This is what getServerSession() and useSession() return.
         */
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.userId;
                (session.user as any).role = token.role || 'user';
                (session.user as any).is_premium = token.is_premium || false;
            }
            return session;
        },
    },

    // ── Secret (validated at module load above) ────────────────────
    secret: process.env.NEXTAUTH_SECRET,
};

// ── Export Handler ──────────────────────────────────────────────────────
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
