/**
 * API Route: POST /api/auth/register
 * 
 * Creates a new user account with email/password credentials.
 * 
 * Security:
 *   - Validates input with Zod
 *   - Hashes password with bcrypt (12 rounds)
 *   - Rate limited: 5 registrations per IP per hour
 *   - Checks for duplicate email
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser, getUserByEmail } from '@/lib/db/users';
import { checkAuthRateLimit, rateLimitResponse, getClientIP } from '@/lib/rate-limit';

const registerSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    email: z.string().email('Invalid email address').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export async function POST(request: NextRequest) {
    try {
        // Rate limit
        const ip = getClientIP(request);
        if (!checkAuthRateLimit(ip)) {
            return rateLimitResponse();
        }

        const body = await request.json();
        const parseResult = registerSchema.safeParse(body);

        if (!parseResult.success) {
            const firstError = parseResult.error.issues?.[0]?.message || 'Invalid input';
            return NextResponse.json({ error: firstError }, { status: 400 });
        }

        const { name, email, password } = parseResult.data;

        // Check for existing user
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { error: 'An account with this email already exists. Please sign in.' },
                { status: 409 }
            );
        }

        // Create user (password is hashed inside createUser)
        const newUser = await createUser({
            email,
            name,
            password,
        });

        if (!newUser) {
            return NextResponse.json(
                { error: 'Failed to create account. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'Account created successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
            },
        }, { status: 201 });

    } catch (error) {
        console.error('[register] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
