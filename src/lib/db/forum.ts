/**
 * Forum Data Access Layer
 * 
 * Day 5: Community forum CRUD operations.
 * Handles posts, replies, and upvoting.
 */

import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────

export interface ForumPost {
    id?: string;
    user_id: string;
    title: string;
    body: string;
    category: 'prelims' | 'mains' | 'optional' | 'strategy' | 'current_affairs' | 'general';
    upvotes?: number;
    is_pinned?: boolean;
    created_at?: string;
    updated_at?: string;
    // Joined fields
    user_name?: string;
    user_avatar?: string;
    reply_count?: number;
}

export interface ForumReply {
    id?: string;
    post_id: string;
    user_id: string;
    body: string;
    upvotes?: number;
    created_at?: string;
    // Joined fields
    user_name?: string;
    user_avatar?: string;
}

// ── Posts ───────────────────────────────────────────────────────────────

/** Get forum posts with pagination and optional category filter */
export async function getPosts(options: {
    category?: string;
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'popular';
} = {}): Promise<{ posts: ForumPost[]; total: number }> {
    if (!isSupabaseConfigured()) return { posts: [], total: 0 };

    const { category, page = 1, limit = 20, sortBy = 'newest' } = options;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from('forum_posts')
        .select('*, users!inner(name, avatar_url)', { count: 'exact' });

    if (category && category !== 'all') {
        query = query.eq('category', category);
    }

    if (sortBy === 'popular') {
        query = query.order('upvotes', { ascending: false });
    } else {
        query = query.order('is_pinned', { ascending: false })
                     .order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) {
        console.error('[db/forum] Get posts error:', error.message);
        return { posts: [], total: 0 };
    }

    const posts = (data || []).map((p: any) => ({
        ...p,
        user_name: p.users?.name,
        user_avatar: p.users?.avatar_url,
    }));

    return { posts, total: count || 0 };
}

/** Create a new forum post */
export async function createPost(post: Pick<ForumPost, 'user_id' | 'title' | 'body' | 'category'>): Promise<ForumPost | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabaseAdmin
        .from('forum_posts')
        .insert({
            user_id: post.user_id,
            title: post.title,
            body: post.body,
            category: post.category,
        })
        .select()
        .single();

    if (error) {
        console.error('[db/forum] Create post error:', error.message);
        return null;
    }
    return data;
}

/** Get a single post with its replies */
export async function getPostWithReplies(postId: string): Promise<{
    post: ForumPost | null;
    replies: ForumReply[];
}> {
    if (!isSupabaseConfigured()) return { post: null, replies: [] };

    const [postResult, repliesResult] = await Promise.all([
        supabaseAdmin
            .from('forum_posts')
            .select('*, users!inner(name, avatar_url)')
            .eq('id', postId)
            .single(),
        supabaseAdmin
            .from('forum_replies')
            .select('*, users!inner(name, avatar_url)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true }),
    ]);

    const post = postResult.data ? {
        ...postResult.data,
        user_name: (postResult.data as any).users?.name,
        user_avatar: (postResult.data as any).users?.avatar_url,
    } : null;

    const replies = (repliesResult.data || []).map((r: any) => ({
        ...r,
        user_name: r.users?.name,
        user_avatar: r.users?.avatar_url,
    }));

    return { post, replies };
}

// ── Replies ────────────────────────────────────────────────────────────

/** Add a reply to a post */
export async function addReply(reply: Pick<ForumReply, 'post_id' | 'user_id' | 'body'>): Promise<ForumReply | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabaseAdmin
        .from('forum_replies')
        .insert({
            post_id: reply.post_id,
            user_id: reply.user_id,
            body: reply.body,
        })
        .select()
        .single();

    if (error) {
        console.error('[db/forum] Add reply error:', error.message);
        return null;
    }
    return data;
}

// ── Upvoting ───────────────────────────────────────────────────────────

/** Upvote a post (increment by 1) */
export async function upvotePost(postId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabaseAdmin.rpc('increment_post_upvote', { post_id: postId });

    // Fallback if RPC not set up — manual increment
    if (error) {
        const { data } = await supabaseAdmin
            .from('forum_posts')
            .select('upvotes')
            .eq('id', postId)
            .single();

        if (data) {
            await supabaseAdmin
                .from('forum_posts')
                .update({ upvotes: (data.upvotes || 0) + 1 })
                .eq('id', postId);
        }
    }
    return true;
}

/** Upvote a reply (increment by 1) */
export async function upvoteReply(replyId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { data } = await supabaseAdmin
        .from('forum_replies')
        .select('upvotes')
        .eq('id', replyId)
        .single();

    if (data) {
        await supabaseAdmin
            .from('forum_replies')
            .update({ upvotes: (data.upvotes || 0) + 1 })
            .eq('id', replyId);
    }
    return true;
}
