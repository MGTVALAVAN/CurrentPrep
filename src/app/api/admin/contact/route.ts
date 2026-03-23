/**
 * API Route: /api/admin/contact
 * 
 * GET  — List contact submissions with filter + pagination
 * PATCH — Update submission status
 * 
 * Protected by middleware (admin role required).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContactSubmissions, updateContactStatus, ContactStatus } from '@/lib/db/contact';

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '15'), 100);
    const status = url.searchParams.get('status') as ContactStatus | null;

    const result = await getContactSubmissions({
        status: status || undefined,
        page,
        limit,
    });

    return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
        return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    const validStatuses: ContactStatus[] = ['new', 'read', 'replied', 'archived'];
    if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const success = await updateContactStatus(id, status);
    if (!success) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
