/**
 * Next.js Middleware — Route Protection
 * 
 * Issue 1.6: No middleware existed. Dashboard and authenticated pages
 * were accessible without login.
 * 
 * This middleware runs on EVERY matched request and:
 *   - Redirects unauthenticated users to /login for protected pages
 *   - Returns 401 for protected API routes
 *   - Allows public access to landing, auth, and content pages
 * 
 * Note: Admin role checks are done at the page/API level since
 * middleware only has access to the JWT token, not decoded session.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ── Route Classification ───────────────────────────────────────────────

/** Pages that require authentication (redirect to /login if not logged in) */
const PROTECTED_PAGES = [
    '/dashboard',
    '/profile',
];

/** API routes that require authentication (return 401) */
const PROTECTED_APIS = [
    '/api/quiz/generate',
    '/api/quiz/custom',
];

/** API routes that require CRON_SECRET (handled in the routes themselves) */
const CRON_APIS = [
    '/api/epaper/generate',
    '/api/current-affairs/update',
    '/api/csat-backfill',
    '/api/generate-images',
];

/** Admin-only pages (require role: 'admin') */
const ADMIN_PAGES = [
    '/admin',
];

/** Admin-only APIs (require role: 'admin') */
const ADMIN_APIS = [
    '/api/admin',
];

/** Pages/routes that are ALWAYS public — no auth check */
const PUBLIC_PATHS = [
    '/',
    '/login',
    '/register',
    '/about',
    '/contact',
    '/current-affairs',
    '/daily-epaper',
    '/daily-mock',
    '/mock-tests',
    '/syllabus',
    '/pricing',
    '/blog',
    '/features',
    '/privacy-policy',
    '/terms',
    '/api/auth',    // NextAuth routes
    '/api/contact', // Public contact form
    '/api/current-affairs', // Public read (GET)
    '/api/epaper',  // Public read (GET)
    '/api/daily-mock', // Public read (GET)
    '/api/mock-tests', // Public read (GET)
];

// ── Helper: Check if path starts with any of the given prefixes ────────

function matchesAny(path: string, prefixes: string[]): boolean {
    return prefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'));
}

// ── Middleware ──────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip static files, images, and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/icons') ||
        pathname.startsWith('/images') ||
        pathname.includes('.') // files like favicon.ico, manifest.json, sw.js
    ) {
        return NextResponse.next();
    }

    // ── Public paths: always allow ──────────────────────────────
    if (matchesAny(pathname, PUBLIC_PATHS)) {
        return NextResponse.next();
    }

    // ── Get session token ──────────────────────────────────────
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    // ── Admin routes: require admin role ────────────────────────
    if (matchesAny(pathname, ADMIN_PAGES)) {
        if (!token) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
        if (token.role !== 'admin') {
            // Non-admin user trying to access admin — redirect to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    if (matchesAny(pathname, ADMIN_APIS)) {
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (token.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
        }
        return NextResponse.next();
    }

    // ── Protected pages: require any valid session ─────────────
    if (matchesAny(pathname, PROTECTED_PAGES)) {
        if (!token) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
        return NextResponse.next();
    }

    // ── Protected APIs: require valid session ──────────────────
    if (matchesAny(pathname, PROTECTED_APIS)) {
        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required. Please log in.' },
                { status: 401 }
            );
        }
        return NextResponse.next();
    }

    // ── Cron APIs: handled by the routes themselves ────────────
    if (matchesAny(pathname, CRON_APIS)) {
        return NextResponse.next();  // Auth check is in the route handler
    }

    // ── Default: allow (public content) ────────────────────────
    return NextResponse.next();
}

// ── Matcher: which routes this middleware runs on ───────────────────────
export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT:
         *   - _next/static (static files)
         *   - _next/image (image optimization)
         *   - favicon.ico
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
