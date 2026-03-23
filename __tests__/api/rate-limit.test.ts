/**
 * Rate Limiter Unit Tests
 * 
 * Tests the core rate limiting logic: sliding window,
 * request counting, expiry, and pre-configured limiters.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    checkRateLimit,
    getClientIP,
    checkAuthRateLimit,
    checkContactRateLimit,
    checkQuizRateLimit,
    checkCronRateLimit,
    rateLimitResponse,
} from '@/lib/rate-limit';

describe('Rate Limiter', () => {
    beforeEach(() => {
        // Reset the internal rate limit store between tests
        // by advancing time past any existing windows
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('checkRateLimit', () => {
        it('allows first request', () => {
            const result = checkRateLimit('test:first', 5, 60_000);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(4);
        });

        it('counts requests correctly', () => {
            const key = 'test:count';
            checkRateLimit(key, 3, 60_000);
            const r2 = checkRateLimit(key, 3, 60_000);
            expect(r2.remaining).toBe(1);

            const r3 = checkRateLimit(key, 3, 60_000);
            expect(r3.remaining).toBe(0);
            expect(r3.allowed).toBe(true);
        });

        it('blocks requests over the limit', () => {
            const key = 'test:block';
            for (let i = 0; i < 3; i++) {
                checkRateLimit(key, 3, 60_000);
            }
            const result = checkRateLimit(key, 3, 60_000);
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('resets after window expires', () => {
            const key = 'test:expire';
            for (let i = 0; i < 5; i++) {
                checkRateLimit(key, 5, 60_000);
            }
            // Should be blocked now
            expect(checkRateLimit(key, 5, 60_000).allowed).toBe(false);

            // Advance time past the window
            vi.advanceTimersByTime(61_000);

            // Should be allowed again
            const result = checkRateLimit(key, 5, 60_000);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(4);
        });

        it('returns correct resetAt timestamp', () => {
            const now = Date.now();
            const result = checkRateLimit('test:reset', 5, 60_000);
            expect(result.resetAt).toBeGreaterThanOrEqual(now + 60_000);
        });
    });

    describe('getClientIP', () => {
        it('extracts IP from x-forwarded-for', () => {
            const req = new Request('http://localhost', {
                headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
            });
            expect(getClientIP(req)).toBe('192.168.1.1');
        });

        it('extracts IP from x-real-ip', () => {
            const req = new Request('http://localhost', {
                headers: { 'x-real-ip': '203.0.113.5' },
            });
            expect(getClientIP(req)).toBe('203.0.113.5');
        });

        it('returns unknown when no IP headers present', () => {
            const req = new Request('http://localhost');
            expect(getClientIP(req)).toBe('unknown');
        });
    });

    describe('Pre-configured rate limiters', () => {
        it('checkAuthRateLimit allows 10 requests', () => {
            for (let i = 0; i < 10; i++) {
                const r = checkAuthRateLimit(`auth-test-${Date.now()}-limit`);
                expect(r.allowed).toBe(true);
            }
        });

        it('checkContactRateLimit has 5 request limit', () => {
            const key = `contact-test-${Date.now()}`;
            for (let i = 0; i < 5; i++) {
                expect(checkContactRateLimit(key).allowed).toBe(true);
            }
            expect(checkContactRateLimit(key).allowed).toBe(false);
        });

        it('checkQuizRateLimit has 20 request limit', () => {
            const key = `quiz-test-${Date.now()}`;
            for (let i = 0; i < 20; i++) {
                expect(checkQuizRateLimit(key).allowed).toBe(true);
            }
            expect(checkQuizRateLimit(key).allowed).toBe(false);
        });

        it('checkCronRateLimit has 1 request limit', () => {
            const key = `cron-test-${Date.now()}`;
            expect(checkCronRateLimit(key).allowed).toBe(true);
            expect(checkCronRateLimit(key).allowed).toBe(false);
        });
    });

    describe('rateLimitResponse', () => {
        it('returns 429 status', () => {
            const resetAt = Date.now() + 60_000;
            const response = rateLimitResponse(resetAt);
            expect(response.status).toBe(429);
        });

        it('includes Retry-After header', () => {
            const resetAt = Date.now() + 30_000;
            const response = rateLimitResponse(resetAt);
            const retryAfter = response.headers.get('Retry-After');
            expect(retryAfter).toBeTruthy();
            expect(parseInt(retryAfter!)).toBeGreaterThan(0);
        });

        it('includes rate limit remaining header', () => {
            const response = rateLimitResponse(Date.now() + 60_000);
            expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
        });
    });
});
