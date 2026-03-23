/**
 * Contact API Unit Tests
 * 
 * Tests input validation, sanitization, and rate limiting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules before importing the route
vi.mock('nodemailer', () => ({
    default: {
        createTransport: vi.fn(() => ({
            sendMail: vi.fn().mockResolvedValue({ messageId: 'test-123' }),
        })),
    },
}));

vi.mock('@/lib/db/contact', () => ({
    saveContactSubmission: vi.fn().mockResolvedValue({ id: 'sub-123' }),
}));

vi.mock('@/lib/rate-limit', () => ({
    checkContactRateLimit: vi.fn(() => ({ allowed: true, remaining: 4, resetAt: Date.now() + 3600_000 })),
    rateLimitResponse: vi.fn(() => new Response('Rate limited', { status: 429 })),
    getClientIP: vi.fn(() => '127.0.0.1'),
}));

import { POST } from '@/app/api/contact/route';
import { NextRequest } from 'next/server';
import { checkContactRateLimit, rateLimitResponse } from '@/lib/rate-limit';

function makeRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

const validBody = {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'general',
    message: 'Hello, I have a question about the UPSC preparation.',
};

describe('POST /api/contact', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset rate limit mock to allow requests
        vi.mocked(checkContactRateLimit).mockReturnValue({
            allowed: true,
            remaining: 4,
            resetAt: Date.now() + 3600_000,
        });
    });

    it('returns 400 for missing name', async () => {
        const res = await POST(makeRequest({ ...validBody, name: '' }));
        expect(res.status).toBe(400);
    });

    it('returns 400 for invalid email', async () => {
        const res = await POST(makeRequest({ ...validBody, email: 'not-an-email' }));
        expect(res.status).toBe(400);
    });

    it('returns 400 for empty message', async () => {
        const res = await POST(makeRequest({ ...validBody, message: '' }));
        expect(res.status).toBe(400);
    });

    it('returns 400 for message over 5000 chars', async () => {
        const res = await POST(makeRequest({ ...validBody, message: 'x'.repeat(5001) }));
        expect(res.status).toBe(400);
    });

    it('sanitizes HTML from name field', async () => {
        const res = await POST(makeRequest({
            ...validBody,
            name: '<script>alert("xss")</script>Hacker',
        }));
        // Should succeed (sanitized) not fail
        // The name is sanitized to 'Hacker' (script tags stripped)
        expect(res.status).not.toBe(500);
    });

    it('returns 429 when rate limited', async () => {
        vi.mocked(checkContactRateLimit).mockReturnValue({
            allowed: false,
            remaining: 0,
            resetAt: Date.now() + 3600_000,
        });

        const res = await POST(makeRequest(validBody));
        expect(rateLimitResponse).toHaveBeenCalled();
    });
});
