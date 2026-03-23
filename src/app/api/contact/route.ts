/**
 * API Route: POST /api/contact
 * 
 * Handles contact form submissions.
 * 
 * SECURITY FIXES:
 *   Issue 1.5 — Input sanitization with sanitize-html + Zod validation
 *   Issue 1.7 — Rate limited: 5 requests per IP per hour
 * 
 * Previously, user inputs (name, email, subject, message) were interpolated
 * directly into HTML email templates without sanitization, enabling HTML injection.
 */

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import sanitize from 'sanitize-html';
import { z } from 'zod';
import { checkContactRateLimit, rateLimitResponse, getClientIP } from '@/lib/rate-limit';
import { saveContactSubmission } from '@/lib/db/contact';

// ── Input Validation Schema ────────────────────────────────────────────

const contactSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name must be under 100 characters')
        .transform(val => sanitize(val, { allowedTags: [], allowedAttributes: {} })),
    email: z
        .string()
        .email('Please provide a valid email address')
        .max(255, 'Email must be under 255 characters'),
    subject: z
        .string()
        .min(1, 'Subject is required')
        .max(200, 'Subject must be under 200 characters')
        .transform(val => sanitize(val, { allowedTags: [], allowedAttributes: {} })),
    message: z
        .string()
        .min(1, 'Message is required')
        .max(5000, 'Message must be under 5,000 characters')
        .transform(val => sanitize(val, { allowedTags: [], allowedAttributes: {} })),
});

// ── Subject labels ─────────────────────────────────────────────────────

const subjectLabels: Record<string, string> = {
    general: 'General Inquiry',
    support: 'Technical Support',
    feedback: 'Feedback / Suggestion',
    partnership: 'Partnership / Collaboration',
    bug: 'Bug Report',
    premium: 'Premium Plan Questions',
};

// ── Route Handler ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        // --- Rate limit check (Issue 1.7) ---
        const ip = getClientIP(request);
        const rateCheck = checkContactRateLimit(ip);
        if (!rateCheck.allowed) {
            return rateLimitResponse(rateCheck.resetAt);
        }

        // --- Parse and validate input (Issue 1.5) ---
        const body = await request.json();
        const parseResult = contactSchema.safeParse(body);

        if (!parseResult.success) {
            const errors = parseResult.error.issues.map(i => i.message);
            return NextResponse.json(
                { error: 'Validation failed', details: errors },
                { status: 400 }
            );
        }

        const { name, email, subject, message } = parseResult.data;
        const subjectLabel = subjectLabels[subject] || sanitize(subject, { allowedTags: [], allowedAttributes: {} });

        // --- Save to database (for admin console) ---
        await saveContactSubmission({
            name,
            email,
            subject: subjectLabel,
            message,
            ip_address: ip,
        }).catch(err => console.error('[contact] DB save failed (non-blocking):', err));

        // --- Send email (if SMTP configured) ---
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '465'),
                secure: true,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            // All values are already sanitized by Zod transforms above
            await transporter.sendMail({
                from: `"CurrentPrep Contact" <${process.env.SMTP_USER}>`,
                to: process.env.CONTACT_EMAIL_TO || process.env.SMTP_USER,
                replyTo: email,
                subject: `[Contact] ${subjectLabel} — from ${name}`,
                html: `
                    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; border: 1px solid #C9A87C; border-radius: 8px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #8B4513, #5C2E0A); padding: 20px 24px;">
                            <h2 style="color: #FFF1E5; margin: 0; font-size: 20px;">📩 New Contact Form Submission</h2>
                        </div>
                        <div style="padding: 24px; background: #FDFAF5; color: #33200A;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; width: 100px; vertical-align: top;">Name:</td>
                                    <td style="padding: 8px 0;">${escapeHtml(name)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Email:</td>
                                    <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Subject:</td>
                                    <td style="padding: 8px 0;">${escapeHtml(subjectLabel)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Message:</td>
                                    <td style="padding: 8px 0; white-space: pre-wrap;">${escapeHtml(message)}</td>
                                </tr>
                            </table>
                            <hr style="border: none; border-top: 1px solid #E0D0BE; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #8B6B42;">Sent via CurrentPrep contact form</p>
                        </div>
                    </div>
                `,
            });

            return NextResponse.json({ success: true, message: 'Email sent successfully' });
        }

        // If SMTP not configured, just log it
        console.log('[contact] Contact form submission (SMTP not configured):');
        console.log(`  Name: ${name}`);
        console.log(`  Email: ${email}`);
        console.log(`  Subject: ${subjectLabel}`);
        console.log(`  Message: ${message.substring(0, 100)}...`);

        return NextResponse.json({ success: true, message: 'Message received (logged)' });
    } catch (error: any) {
        console.error('[contact] Error:', error.message);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}

// ── HTML Escape Utility ────────────────────────────────────────────────

/** Escape HTML special characters for safe interpolation into templates */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
