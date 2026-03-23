/**
 * Health Check Endpoint
 * 
 * Returns system status for monitoring tools (UptimeRobot, etc.)
 * 
 * GET /api/health → { status: 'ok', ... }
 */

import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    const start = Date.now();
    
    const checks: Record<string, 'ok' | 'error' | 'unconfigured'> = {
        app: 'ok',
        database: 'unconfigured',
        auth: 'unconfigured',
        ai: 'unconfigured',
    };

    // Check Supabase
    if (isSupabaseConfigured()) {
        try {
            const { getSupabaseAdmin } = await import('@/lib/supabase');
            const supabase = getSupabaseAdmin();
            const { error } = await supabase.from('users').select('id').limit(1);
            checks.database = error ? 'error' : 'ok';
        } catch {
            checks.database = 'error';
        }
    }

    // Check NextAuth
    checks.auth = process.env.NEXTAUTH_SECRET ? 'ok' : 'unconfigured';

    // Check Gemini
    checks.ai = process.env.GEMINI_API_KEY ? 'ok' : 'unconfigured';

    const allOk = Object.values(checks).every(v => v !== 'error');
    const responseTime = Date.now() - start;

    return NextResponse.json(
        {
            status: allOk ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV,
            checks,
        },
        {
            status: allOk ? 200 : 503,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        }
    );
}
