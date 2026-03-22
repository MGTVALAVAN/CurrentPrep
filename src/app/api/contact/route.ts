import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const { name, email, subject, message } = await request.json();

        if (!name || !email || !subject || !message) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const subjectLabels: Record<string, string> = {
            general: 'General Inquiry',
            support: 'Technical Support',
            feedback: 'Feedback / Suggestion',
            partnership: 'Partnership / Collaboration',
            bug: 'Bug Report',
            premium: 'Premium Plan Questions',
        };

        const subjectLabel = subjectLabels[subject] || subject;

        // If SMTP is configured, send a real email
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

            await transporter.sendMail({
                from: `"Current IAS Prep Contact" <${process.env.SMTP_USER}>`,
                to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
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
                                    <td style="padding: 8px 0;">${name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Email:</td>
                                    <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Subject:</td>
                                    <td style="padding: 8px 0;">${subjectLabel}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Message:</td>
                                    <td style="padding: 8px 0; white-space: pre-wrap;">${message}</td>
                                </tr>
                            </table>
                            <hr style="border: none; border-top: 1px solid #E0D0BE; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #8B6B42;">Sent via Current IAS Prep contact form</p>
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
        console.log(`  Message: ${message}`);

        return NextResponse.json({ success: true, message: 'Message received (logged)' });
    } catch (error: any) {
        console.error('[contact] Error:', error.message);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
