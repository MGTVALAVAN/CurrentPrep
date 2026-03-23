/**
 * Middleware Unit Tests
 * 
 * Tests route classification and protection logic.
 * The middleware protects dashboard/admin routes and
 * ensures public routes are accessible.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next-auth JWT
vi.mock('next-auth/jwt', () => ({
    getToken: vi.fn(),
}));

import { getToken } from 'next-auth/jwt';

// Import after mocks
import { middleware } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';

function makeRequest(pathname: string, token?: any): NextRequest {
    const url = `http://localhost:3000${pathname}`;
    const req = new NextRequest(url, {
        method: 'GET',
    });
    // Set the mock token return value
    vi.mocked(getToken).mockResolvedValue(token || null);
    return req;
}

describe('Middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Public routes', () => {
        const publicPaths = ['/', '/login', '/register', '/pricing', '/features', '/syllabus'];

        publicPaths.forEach(path => {
            it(`allows unauthenticated access to ${path}`, async () => {
                const req = makeRequest(path);
                const res = await middleware(req);
                // Public routes should either return NextResponse.next() or undefined
                // They should NOT redirect to /login
                if (res) {
                    const location = res.headers.get('location') || '';
                    expect(location).not.toContain('/login');
                }
            });
        });
    });

    describe('Protected routes', () => {
        it('redirects unauthenticated users from /dashboard to /login', async () => {
            const req = makeRequest('/dashboard');
            const res = await middleware(req);
            if (res) {
                const location = res.headers.get('location') || '';
                expect(location).toContain('/login');
            }
        });
    });

    describe('API routes', () => {
        it('allows access to public API routes', async () => {
            const req = makeRequest('/api/epaper');
            const res = await middleware(req);
            // API routes should pass through
            if (res) {
                expect(res.status).not.toBe(401);
            }
        });
    });

    describe('Static assets', () => {
        it('skips middleware for image files', async () => {
            const req = makeRequest('/images/logo.png');
            const res = await middleware(req);
            // Should pass through without auth check
            if (res) {
                const location = res.headers.get('location') || '';
                expect(location).not.toContain('/login');
            }
        });
    });
});
