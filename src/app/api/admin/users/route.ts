/**
 * API Route: /api/admin/users
 * 
 * GET  — List users with search, filter, and pagination
 * PATCH — Update user role or premium status
 * 
 * Protected by middleware (admin role required).
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ users: [], total: 0 });
    }

    const supabase = getSupabaseAdmin();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const offset = (page - 1) * limit;

    let query = supabase
        .from('users')
        .select('id, name, email, role, is_premium, created_at, updated_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role && role !== 'all') {
        query = query.eq('role', role);
    }

    const { data, count, error } = await query;

    if (error) {
        console.error('[admin/users] Error:', error.message);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({
        users: data || [],
        total: count || 0,
        page,
        limit,
    });
}

export async function PATCH(request: NextRequest) {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { userId, role, is_premium } = body;

    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (role !== undefined) updates.role = role;
    if (is_premium !== undefined) updates.is_premium = is_premium;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

    if (error) {
        console.error('[admin/users] Update error:', error.message);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
