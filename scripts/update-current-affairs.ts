#!/usr/bin/env node

/**
 * Standalone CLI script to trigger the current affairs update.
 *
 * Usage:
 *   npx tsx scripts/update-current-affairs.ts
 *
 * For cron (7 AM IST daily):
 *   0 7 * * * cd /path/to/project && npx tsx scripts/update-current-affairs.ts >> /tmp/currentprep-cron.log 2>&1
 *
 * Or via curl against a running server:
 *   0 7 * * * curl -X POST http://localhost:3000/api/current-affairs/update -H "Authorization: Bearer YOUR_CRON_SECRET"
 *
 * Environment Variables:
 *   GEMINI_API_KEY  — Required. Your Google Gemini API key.
 *   CRON_SECRET     — Optional. Used for API auth.
 *   APP_URL         — Optional. Defaults to http://localhost:3000
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || '';

async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  📰 CurrentPrep — Daily Current Affairs Update Agent');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Time:   ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
    console.log(`  Target: ${APP_URL}/api/current-affairs/update`);
    console.log('───────────────────────────────────────────────────────────');

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (CRON_SECRET) {
            headers['Authorization'] = `Bearer ${CRON_SECRET}`;
        }

        const response = await fetch(`${APP_URL}/api/current-affairs/update?force=true`, {
            method: 'POST',
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Update failed:', data.error || data.details);
            process.exit(1);
        }

        console.log('');
        console.log('  ✅ Update Successful!');
        console.log(`  📅 Date:       ${data.date}`);
        console.log(`  📥 Scraped:    ${data.totalScraped} articles`);
        console.log(`  📝 Processed:  ${data.totalProcessed} UPSC-relevant articles`);
        console.log(`  🕐 Updated:    ${data.lastUpdated}`);

        if (data.articlesByCategory) {
            console.log('');
            console.log('  📊 Articles by Category:');
            for (const [cat, count] of Object.entries(data.articlesByCategory)) {
                console.log(`     • ${cat}: ${count}`);
            }
        }

        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
    } catch (err: any) {
        console.error('❌ Failed to connect to server:', err.message);
        console.error('   Make sure the server is running: npm run dev');
        process.exit(1);
    }
}

main();
