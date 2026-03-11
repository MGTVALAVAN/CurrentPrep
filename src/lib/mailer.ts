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

    const mailOptions: any = {
        from: `"CurrentIAS Prep" <${process.env.SMTP_USER || 'no-reply@currentiasprep.in'}>`,
        to: 'mgt.valavan@gmail.com',
        subject: `Your Daily UPSC ePaper is Ready! (${date})`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 30px; color: #33200A; background-color: #FFF1E5; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #C9A87C;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #8B4513; margin: 0;">CurrentIAS Prep</h1>
                    <p style="color: #D4791C; font-weight: bold; margin-top: 4px;">DAILY EPAPER</p>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6;">Hello,</p>
                <p style="font-size: 16px; line-height: 1.6;">Your latest UPSC Current Affairs digest and Mocks for <strong>${date}</strong> have been intelligently curated and beautifully formatted for you.</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${epaperUrl}" style="background: linear-gradient(135deg, #C0392B, #8B1A1A); color: #FFF; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 26, 26, 0.3);">
                        Read & Download Today's ePaper
                    </a>
                </div>
                
                <p style="font-size: 14px; line-height: 1.6;"><strong>Inside today's edition:</strong></p>
                <ul style="font-size: 14px; line-height: 1.6; color: #5C3D1A;">
                    <li>High-importance Prelims/Mains news, specifically filtered to eliminate political clickbait.</li>
                    <li>Detailed analytical dimensions and key terms.</li>
                    <li>Syllabus-aligned Prelims and Mains Daily Mock Questions.</li>
                </ul>
                
                <hr style="border: none; border-top: 1px solid #C9A87C; margin: 30px 0;" />
                <p style="font-size: 12px; color: #8B6B42; text-align: center;">
                    Stay consistent and keep studying context-driven news!<br/>
                    <em>— CurrentIAS Prep AI Engine</em>
                </p>
            </div>
        `,
    };

    if (pdfBuffer) {
        mailOptions.attachments = [
            {
                filename: `CurrentIAS_ePaper_${date}.pdf`,
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
        console.log(`[mailer] ✅ Successfully sent ePaper email with PDF attachment to mgt.valavan@gmail.com for ${date}`);
    } catch (err: any) {
        console.error(`[mailer] Failed to send email: ${err.message}`);
    }
}
