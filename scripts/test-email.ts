import { sendDailyEpaperEmail } from '../src/lib/mailer';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function testEmail() {
    console.log("Checking credentials...");
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error("❌ ERROR: You need to set SMTP_USER and SMTP_PASS in your .env file!");
        console.log(`
Please add the following lines to your .env file:
SMTP_USER=mgt.valavan@gmail.com
SMTP_PASS=your_gmail_app_password

To get a Gmail App Password:
1. Go to your Google Account (Manage your Google account)
2. Go to 'Security' on the left panel.
3. Turn on '2-Step Verification' if it isn't already.
4. Search for 'App passwords' in the search bar.
5. Create a new App Password (select 'Other' and name it 'ePaper App').
6. Copy the 16-character password and paste it into the .env file.
        `);
        process.exit(1);
    }

    const today = new Date().toISOString().split('T')[0];
    console.log(`Attempting to send an email for today's ePaper (${today}) to mgt.valavan@gmail.com...`);

    await sendDailyEpaperEmail(today);
    console.log("Done! Check your inbox.");
}

testEmail();
