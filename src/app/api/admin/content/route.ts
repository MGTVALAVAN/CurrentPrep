/**
 * API Route: GET /api/admin/content
 * 
 * Returns content stats for the admin dashboard.
 * Protected by middleware (admin role required).
 */

import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabaseAdmin } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const MOCK_DIR = path.join(process.cwd(), 'mock-engine', 'data', 'mocks');
const EPAPER_DIR = path.join(process.cwd(), 'src', 'data', 'epaper');

export async function GET() {
    // ePaper stats from Supabase (if configured) or file system
    let epaperTotal = 0;
    let latestEpaper: string | null = null;

    if (isSupabaseConfigured()) {
        const supabase = getSupabaseAdmin();
        const [
            { count },
            { data: latest },
        ] = await Promise.all([
            supabase.from('epapers').select('*', { count: 'exact', head: true }),
            supabase.from('epapers')
                .select('date')
                .order('date', { ascending: false })
                .limit(1)
                .single(),
        ]);
        epaperTotal = count || 0;
        latestEpaper = latest?.date || null;
    }

    // Fallback: count from file system if Supabase has 0
    if (epaperTotal === 0 && fs.existsSync(EPAPER_DIR)) {
        const epaperFiles = fs.readdirSync(EPAPER_DIR)
            .filter(f => f.startsWith('epaper-') && f.endsWith('.json') && f !== 'epaper-index.json');
        epaperTotal = epaperFiles.length;
        if (epaperFiles.length > 0) {
            const sorted = epaperFiles.sort().reverse();
            latestEpaper = sorted[0].replace('epaper-', '').replace('.json', '');
        }
    }

    // Mock test stats from file system
    let totalMocks = 0;
    let totalQuestions = 0;
    let totalSubjects = 0;

    if (fs.existsSync(MOCK_DIR)) {
        const indexFiles = fs.readdirSync(MOCK_DIR)
            .filter(f => f.endsWith('-index.json'));
        
        totalSubjects = indexFiles.length;

        for (const indexFile of indexFiles) {
            try {
                const index = JSON.parse(fs.readFileSync(path.join(MOCK_DIR, indexFile), 'utf-8'));
                totalMocks += index.length;
                totalQuestions += index.reduce((sum: number, m: any) => sum + (m.total_questions || 100), 0);
            } catch {
                // skip corrupt files
            }
        }
    }

    return NextResponse.json({
        epapers: {
            total: epaperTotal,
            latest: latestEpaper,
        },
        mocks: {
            totalSubjects,
            totalMocks,
            totalQuestions,
        },
    });
}

