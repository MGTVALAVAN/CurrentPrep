/**
 * Bookmarks Data Access Layer
 * 
 * Day 5: Users can bookmark articles, quiz questions, and forum posts.
 * Premium feature (gated in Day 10).
 */

import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────

export type BookmarkType = 'article' | 'question' | 'forum_post';

export interface Bookmark {
    id?: string;
    user_id: string;
    item_type: BookmarkType;
    item_id: string;              // ePaper article ID, question UID, or post ID
    title: string;                // Display title
    metadata?: Record<string, any>; // Extra info (date, category, etc.)
    created_at?: string;
}

// ── Functions ──────────────────────────────────────────────────────────

/** Add a bookmark */
export async function addBookmark(bookmark: Pick<Bookmark, 'user_id' | 'item_type' | 'item_id' | 'title' | 'metadata'>): Promise<Bookmark | null> {
    if (!isSupabaseConfigured()) return null;

    // Note: We need a bookmarks table. For now this uses a generic approach.
    // The bookmarks table should be created in a future migration.
    const { data, error } = await supabaseAdmin
        .from('bookmarks')
        .upsert({
            user_id: bookmark.user_id,
            item_type: bookmark.item_type,
            item_id: bookmark.item_id,
            title: bookmark.title,
            metadata: bookmark.metadata || {},
        }, {
            onConflict: 'user_id,item_type,item_id',
        })
        .select()
        .single();

    if (error) {
        console.error('[db/bookmarks] Add bookmark error:', error.message);
        return null;
    }
    return data;
}

/** Remove a bookmark */
export async function removeBookmark(userId: string, itemType: BookmarkType, itemId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabaseAdmin
        .from('bookmarks')
        .delete()
        .match({ user_id: userId, item_type: itemType, item_id: itemId });

    if (error) {
        console.error('[db/bookmarks] Remove bookmark error:', error.message);
        return false;
    }
    return true;
}

/** Get all bookmarks for a user (optionally filtered by type) */
export async function getBookmarks(
    userId: string,
    itemType?: BookmarkType,
    limit: number = 50
): Promise<Bookmark[]> {
    if (!isSupabaseConfigured()) return [];

    let query = supabaseAdmin
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (itemType) {
        query = query.eq('item_type', itemType);
    }

    const { data, error } = await query;
    if (error) return [];
    return data || [];
}

/** Check if an item is bookmarked by a user */
export async function isBookmarked(userId: string, itemType: BookmarkType, itemId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { data, error } = await supabaseAdmin
        .from('bookmarks')
        .select('id')
        .match({ user_id: userId, item_type: itemType, item_id: itemId })
        .single();

    return !error && !!data;
}

/** Get bookmark count for a user */
export async function getBookmarkCount(userId: string): Promise<number> {
    if (!isSupabaseConfigured()) return 0;

    const { count, error } = await supabaseAdmin
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) return 0;
    return count || 0;
}
