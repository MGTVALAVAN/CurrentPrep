/**
 * Registration API Unit Tests
 * 
 * Tests input validation, duplicate detection, and success flow.
 * Database calls are mocked to isolate API logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { NextRequest } from 'next/server';

// Mock database functions
vi.mock('@/lib/db/users', () => ({
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
}));

// Mock rate limiter to always allow
vi.mock('@/lib/rate-limit', () => ({
    checkAuthRateLimit: vi.fn(() => ({ allowed: true, remaining: 9, resetAt: Date.now() + 60_000 })),
    rateLimitResponse: vi.fn(() => new Response('Rate limited', { status: 429 })),
    getClientIP: vi.fn(() => '127.0.0.1'),
}));

import { getUserByEmail, createUser } from '@/lib/db/users';

function makeRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

describe('POST /api/auth/register', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 400 for missing name', async () => {
        const res = await POST(makeRequest({ email: 'test@test.com', password: '12345678' }));
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBeTruthy();
    });

    it('returns 400 for invalid email', async () => {
        const res = await POST(makeRequest({ name: 'Test', email: 'not-email', password: '12345678' }));
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('email');
    });

    it('returns 400 for short password', async () => {
        const res = await POST(makeRequest({ name: 'Test', email: 'test@test.com', password: '1234' }));
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('8 characters');
    });

    it('returns 409 for duplicate email', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue({
            id: '123', email: 'test@test.com', name: 'Existing',
            role: 'user', is_premium: false, avatar_url: null,
            created_at: '', updated_at: '',
        } as any);

        const res = await POST(makeRequest({ name: 'Test', email: 'test@test.com', password: '12345678' }));
        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.error).toContain('already exists');
    });

    it('returns 201 on successful registration', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(null);
        vi.mocked(createUser).mockResolvedValue({
            id: 'new-user-123',
            email: 'new@test.com',
            name: 'New User',
            role: 'user',
            is_premium: false,
        } as any);

        const res = await POST(makeRequest({
            name: 'New User',
            email: 'new@test.com',
            password: 'securepassword123',
        }));
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.user.email).toBe('new@test.com');
        expect(data.user.name).toBe('New User');
        expect(data.message).toContain('success');
    });

    it('does not return password in response', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(null);
        vi.mocked(createUser).mockResolvedValue({
            id: 'new-user-123',
            email: 'new@test.com',
            name: 'New User',
        } as any);

        const res = await POST(makeRequest({
            name: 'Test', email: 'new@test.com', password: 'secretpass123',
        }));
        const data = await res.json();
        expect(data.user.password).toBeUndefined();
        expect(JSON.stringify(data)).not.toContain('secretpass');
    });

    it('returns 500 when createUser fails', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(null);
        vi.mocked(createUser).mockResolvedValue(null);

        const res = await POST(makeRequest({
            name: 'Test', email: 'fail@test.com', password: 'password123',
        }));
        expect(res.status).toBe(500);
    });
});
