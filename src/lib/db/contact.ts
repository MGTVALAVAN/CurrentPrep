/**
 * Contact Submissions Data Access Layer
 * 
 * Day 5: Stores contact form submissions in Supabase.
 * Supplements email delivery with persistent storage
 * for the admin console (Day 9).
 */

import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────

export type ContactStatus = 'new' | 'read' | 'replied' | 'archived';

export interface ContactSubmission {
    id?: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    ip_address?: string;
    status?: ContactStatus;
    created_at?: string;
}

// ── Functions ──────────────────────────────────────────────────────────

/** Save a contact form submission */
export async function saveContactSubmission(submission: Pick<ContactSubmission, 'name' | 'email' | 'subject' | 'message' | 'ip_address'>): Promise<ContactSubmission | null> {
    if (!isSupabaseConfigured()) {
        console.log('[db/contact] Supabase not configured, skipping save');
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from('contact_submissions')
        .insert({
            name: submission.name,
            email: submission.email,
            subject: submission.subject,
            message: submission.message,
            ip_address: submission.ip_address || null,
            status: 'new',
        })
        .select()
        .single();

    if (error) {
        console.error('[db/contact] Save submission error:', error.message);
        return null;
    }
    return data;
}

/** Get all contact submissions (admin use) */
export async function getContactSubmissions(options: {
    status?: ContactStatus;
    page?: number;
    limit?: number;
} = {}): Promise<{ submissions: ContactSubmission[]; total: number }> {
    if (!isSupabaseConfigured()) return { submissions: [], total: 0 };

    const { status, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from('contact_submissions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) {
        query = query.eq('status', status);
    }

    const { data, count, error } = await query;
    if (error) return { submissions: [], total: 0 };
    return { submissions: data || [], total: count || 0 };
}

/** Update contact submission status (admin action) */
export async function updateContactStatus(id: string, status: ContactStatus): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabaseAdmin
        .from('contact_submissions')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('[db/contact] Update status error:', error.message);
        return false;
    }
    return true;
}

/** Get count of unread contact submissions (for admin badge) */
export async function getUnreadContactCount(): Promise<number> {
    if (!isSupabaseConfigured()) return 0;

    const { count, error } = await supabaseAdmin
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

    if (error) return 0;
    return count || 0;
}
