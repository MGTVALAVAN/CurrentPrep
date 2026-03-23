/**
 * Dynamic Sitemap Generator
 * 
 * Generates an XML sitemap for all public pages including
 * dynamically generated ePaper and mock test pages.
 * 
 * Next.js automatically serves this at /sitemap.xml
 */

import type { MetadataRoute } from 'next';
import { isSupabaseConfigured, getSupabaseAdmin } from '@/lib/supabase';

const BASE_URL = process.env.NEXTAUTH_URL || 'https://currentprep.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${BASE_URL}/current-affairs`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/daily-epaper`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/daily-mock`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/syllabus`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/quiz`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/pricing`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/features`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/register`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/daily-epaper/archive`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/daily-mock/archive`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.6,
        },
    ];

    // Add dynamic ePaper date pages
    let dynamicPages: MetadataRoute.Sitemap = [];

    if (isSupabaseConfigured()) {
        try {
            const supabase = getSupabaseAdmin();

            // Get all ePaper dates
            const { data: epapers } = await supabase
                .from('epapers')
                .select('date')
                .order('date', { ascending: false })
                .limit(90); // Last 90 days

            if (epapers) {
                dynamicPages = epapers.map(ep => ({
                    url: `${BASE_URL}/daily-epaper/${ep.date}`,
                    lastModified: new Date(ep.date),
                    changeFrequency: 'never' as const,
                    priority: 0.5,
                }));
            }
        } catch (err) {
            console.error('[sitemap] Error fetching dynamic pages:', err);
        }
    }

    return [...staticPages, ...dynamicPages];
}
