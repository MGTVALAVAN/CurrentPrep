/**
 * ePaper Data Access Layer
 * 
 * Day 5: Handles ePaper storage and retrieval from Supabase.
 * This module will eventually replace the file-based epaper-store.ts
 * once the migration is complete.
 * 
 * For now, it provides the DAL interface that can be swapped in
 * without changing the rest of the codebase.
 */

import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────

export interface EpaperEdition {
    id?: string;
    date: string;                    // YYYY-MM-DD
    article_count: number;
    high_priority_count: number;
    sources: string[];
    has_prelims_mocks: boolean;
    has_mains_mocks: boolean;
    has_csat_mocks: boolean;
    data: any;                       // Full ePaper JSON
    created_at?: string;
}

export interface EpaperSummary {
    date: string;
    article_count: number;
    high_priority_count: number;
    has_prelims_mocks: boolean;
    has_mains_mocks: boolean;
    has_csat_mocks: boolean;
}

// ── Functions ──────────────────────────────────────────────────────────

/** Save or update an ePaper edition */
export async function saveEdition(edition: EpaperEdition): Promise<boolean> {
    if (!isSupabaseConfigured()) {
        console.log('[db/epaper] Supabase not configured, skipping save');
        return false;
    }

    const { error } = await supabaseAdmin
        .from('epapers')
        .upsert({
            date: edition.date,
            article_count: edition.article_count,
            high_priority_count: edition.high_priority_count,
            sources: edition.sources,
            has_prelims_mocks: edition.has_prelims_mocks,
            has_mains_mocks: edition.has_mains_mocks,
            has_csat_mocks: edition.has_csat_mocks,
            data: edition.data,
        }, {
            onConflict: 'date',
        });

    if (error) {
        console.error('[db/epaper] Save edition error:', error.message);
        return false;
    }
    return true;
}

/** Get a specific edition by date */
export async function getEditionByDate(date: string): Promise<EpaperEdition | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabaseAdmin
        .from('epapers')
        .select('*')
        .eq('date', date)
        .single();

    if (error || !data) return null;
    return data;
}

/** Get the latest N editions (metadata only, no full data) */
export async function getLatestEditions(limit: number = 30): Promise<EpaperSummary[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabaseAdmin
        .from('epapers')
        .select('date, article_count, high_priority_count, has_prelims_mocks, has_mains_mocks, has_csat_mocks')
        .order('date', { ascending: false })
        .limit(limit);

    if (error || !data) return [];
    return data;
}

/** Get all dates that have ePaper editions */
export async function getAvailableDates(): Promise<string[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabaseAdmin
        .from('epapers')
        .select('date')
        .order('date', { ascending: false });

    if (error || !data) return [];
    return data.map((d: any) => d.date);
}

/** Delete an edition by date */
export async function deleteEdition(date: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabaseAdmin
        .from('epapers')
        .delete()
        .eq('date', date);

    if (error) {
        console.error('[db/epaper] Delete edition error:', error.message);
        return false;
    }
    return true;
}

/** Get edition count */
export async function getEditionCount(): Promise<number> {
    if (!isSupabaseConfigured()) return 0;

    const { count, error } = await supabaseAdmin
        .from('epapers')
        .select('*', { count: 'exact', head: true });

    if (error) return 0;
    return count || 0;
}
