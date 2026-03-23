/**
 * Rate Limiting Module
 * 
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach with configurable limits.
 * 
 * Issue 1.7: All API routes need rate limiting to prevent abuse.
 * 
 * Note: In-memory storage resets on server restart. For production
 * at scale, swap to Redis (Upstash). For our current scale, this is fine.
 */

import { NextResponse } from 'next/server';

interface RateLimitEntry {
    count: number;
    resetAt: number;  // Unix timestamp in ms
}

// In-memory store: key → { count, resetAt }
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    const entries = Array.from(rateLimitStore.entries());
    for (const [key, entry] of entries) {
        if (now > entry.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * Check if a request is rate-limited.
 * 
 * @param key - Unique identifier (e.g., IP address, userId, IP+route)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns { allowed, remaining, resetAt } — whether the request is allowed
 */
export function checkRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // No existing entry or window has expired — create fresh
    if (!entry || now > entry.resetAt) {
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + windowMs,
        });
        return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
    }

    // Window still active — increment count
    entry.count++;

    if (entry.count > maxRequests) {
        const retryAfterMs = entry.resetAt - now;
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Extract client IP from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIP = request.headers.get('x-real-ip');
    if (realIP) return realIP;
    return 'unknown';
}

/**
 * Create a rate-limited NextResponse (429).
 * Includes Retry-After header as required by HTTP spec.
 */
export function rateLimitResponse(resetAt: number): NextResponse {
    const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000);
    return NextResponse.json(
        {
            error: 'Too many requests. Please try again later.',
            retryAfter: retryAfterSeconds,
        },
        {
            status: 429,
            headers: {
                'Retry-After': String(retryAfterSeconds),
                'X-RateLimit-Remaining': '0',
            },
        }
    );
}

// ── Pre-configured rate limit checkers ─────────────────────────────────

/** Contact form: 5 requests per IP per hour */
export function checkContactRateLimit(ip: string) {
    return checkRateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
}

/** Quiz generation: 20 requests per user per hour */
export function checkQuizRateLimit(userId: string) {
    return checkRateLimit(`quiz:${userId}`, 20, 60 * 60 * 1000);
}

/** ePaper/cron: 1 request per hour (any caller) */
export function checkCronRateLimit(route: string) {
    return checkRateLimit(`cron:${route}`, 1, 60 * 60 * 1000);
}

/** Auth: 10 login attempts per IP per 15 minutes */
export function checkAuthRateLimit(ip: string) {
    return checkRateLimit(`auth:${ip}`, 10, 15 * 60 * 1000);
}

/** Image generation: 5 requests per hour */
export function checkImageGenRateLimit(ip: string) {
    return checkRateLimit(`imagegen:${ip}`, 5, 60 * 60 * 1000);
}
