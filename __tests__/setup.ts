/**
 * Vitest Global Setup
 * 
 * Configures test environment: mocks Next.js modules,
 * sets required env vars. Uses node environment for
 * API/lib tests (no jsdom overhead).
 */

import { vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
}));

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-for-vitest';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.CRON_SECRET = 'test-cron-secret';
