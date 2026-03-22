import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';

export async function sendDailyEpaperEmail(date: string) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const epaperUrl = `${baseUrl}/daily-epaper/print/${date}`;

    let pdfBuffer: Buffer | null = null;

    try {
        console.log(`[mailer] Generating PDF attachment via Puppeteer from ${epaperUrl} ...`);
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Set a desktop viewport before navigating so responsive desktop layouts (like the masthead) render fully
        await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });

        await page.goto(epaperUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // Important: Force the print stylesheet so the PDF looks exactly like Native OS printing
        await page.emulateMediaType('print');

        const generatedPdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });

        pdfBuffer = Buffer.from(generatedPdf);

        await browser.close();
        console.log("[mailer] ✅ PDF generated successfully.");
    } catch (err: any) {
        console.error("[mailer] ❌ Failed to generate PDF attachment:", err.message);
    }

    const pdfFilename = `CurrentIAS_ePaper_${date}.pdf`;

    const mailOptions: any = {
        from: `"Current IAS Prep" <${process.env.SMTP_USER || 'no-reply@currentiasprep.in'}>`,
        to: 'mgt.valavan@gmail.com, sunnyarya1988@gmail.com, rameshvet@gmail.com',
        subject: `📰 Current IAS Prep — Daily ePaper (${date})`,
        html: `
            <div style="font-family: 'Georgia', 'Times New Roman', serif; padding: 0; color: #33200A; background-color: #FDFAF5; max-width: 600px; margin: 0 auto; border: 1px solid #C9A87C; border-radius: 8px; overflow: hidden;">
                
                <div style="background: linear-gradient(135deg, #8B4513, #5C2E0A); padding: 28px 30px; text-align: center;">
                    <h1 style="color: #FFF1E5; margin: 0; font-size: 28px; letter-spacing: 1px;">Current IAS <em style="color: #E8A04C;">Prep</em></h1>
                    <p style="color: #E8A04C; font-weight: bold; margin: 6px 0 0; font-size: 12px; letter-spacing: 3px;">DAILY EPAPER &middot; ${date}</p>
                </div>
                
                <div style="padding: 30px;">
                    <p style="font-size: 16px; line-height: 1.7; margin-top: 0;">Good morning,</p>
                    <p style="font-size: 16px; line-height: 1.7;">Your UPSC Current Affairs digest for <strong>${date}</strong> is ready &mdash; beautifully formatted as a print-ready PDF.</p>
                    
                    <div style="background: linear-gradient(135deg, #FFF1E5, #FDEBD2); border: 2px solid #C9A87C; border-radius: 10px; padding: 22px 24px; margin: 28px 0; text-align: center;">
                        <p style="font-size: 13px; color: #8B6B42; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">&#128206; PDF Attached Below</p>
                        <p style="font-size: 20px; margin: 4px 0; font-weight: bold; color: #5C2E0A;">&#128240; ${pdfFilename}</p>
                        <p style="font-size: 14px; color: #8B6B42; margin: 10px 0 0;">Open the attachment directly from this email to read or print.</p>
                    </div>
                    
                    <p style="font-size: 14px; line-height: 1.6; font-weight: bold; color: #5C2E0A; border-bottom: 1px solid #C9A87C; padding-bottom: 6px;">Inside today's edition:</p>
                    <table style="font-size: 14px; line-height: 1.8; color: #5C3D1A; width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 6px 0; vertical-align: top; width: 28px;">&#128221;</td><td style="padding: 6px 0;">High-importance Prelims &amp; Mains current affairs &mdash; political noise filtered out</td></tr>
                        <tr><td style="padding: 6px 0; vertical-align: top;">&#128214;</td><td style="padding: 6px 0;">Two-part explainers: Key Facts + UPSC-level Analysis with syllabus keywords</td></tr>
                        <tr><td style="padding: 6px 0; vertical-align: top;">&#127919;</td><td style="padding: 6px 0;">Daily Mock Test &mdash; Prelims MCQs, CSAT Reasoning &amp; Comprehension, Mains questions</td></tr>
                        <tr><td style="padding: 6px 0; vertical-align: top;">&#128161;</td><td style="padding: 6px 0;">Trivia, Key Terms &amp; GS Paper mapping for every article</td></tr>
                    </table>
                    
                    <hr style="border: none; border-top: 1px solid #E0D0BE; margin: 28px 0 20px;" />
                    <p style="font-size: 12px; color: #8B6B42; text-align: center; line-height: 1.6;">
                        Consistency is the key to cracking CSE. Read every day.<br/>
                        <em>&mdash; Current IAS Prep &middot; AI-Curated Daily ePaper</em>
                    </p>
                </div>
            </div>
        `,
    };

    if (pdfBuffer) {
        mailOptions.attachments = [
            {
                filename: pdfFilename,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ];
    }

    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log("[mailer] Skipping email: SMTP_USER / SMTP_PASS credentials not configured in ENV. ePaper URL:", epaperUrl);
            return;
        }
        await transporter.sendMail(mailOptions);
        console.log(`[mailer] ✅ Successfully sent ePaper email with PDF attachment to 3 recipients for ${date}`);
    } catch (err: any) {
        console.error(`[mailer] Failed to send email: ${err.message}`);
    }
}
