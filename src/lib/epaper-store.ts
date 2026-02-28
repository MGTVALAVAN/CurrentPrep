/**
 * ePaper Data Store — manages the JSON files for daily ePaper editions.
 *
 * Data is stored in /src/data/epaper/ as JSON files,
 * one per day: epaper-YYYY-MM-DD.json
 *
 * Also maintains an index file: epaper-index.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';
import type { DailyEpaper, EpaperArticle } from './epaper-generator';

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'epaper');

interface EpaperIndex {
    lastUpdated: string;
    availableDates: string[];
    totalArticles: number;
    latestDate: string;
}

// Ensure data directory exists
function ensureDataDir(): void {
    if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * Save a daily ePaper to a date-specific JSON file.
 */
export function saveEpaper(data: DailyEpaper): void {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, `epaper-${data.date}.json`);
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[epaper-store] Saved ${data.articles.length} articles to ${filePath}`);
    updateIndex();
}

/**
 * Load ePaper for a specific date.
 */
export function loadEpaper(date: string): DailyEpaper | null {
    const filePath = path.join(DATA_DIR, `epaper-${date}.json`);
    if (!existsSync(filePath)) return null;
    try {
        return JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
        return null;
    }
}

/**
 * Load the most recent ePaper available.
 */
export function loadLatestEpaper(): DailyEpaper | null {
    ensureDataDir();
    const files = readdirSync(DATA_DIR)
        .filter(
            (f) =>
                f.startsWith('epaper-') &&
                f.endsWith('.json') &&
                f !== 'epaper-index.json'
        )
        .sort()
        .reverse();

    if (files.length === 0) return null;

    try {
        return JSON.parse(readFileSync(path.join(DATA_DIR, files[0]), 'utf-8'));
    } catch {
        return null;
    }
}

/**
 * Get all available ePaper dates (last N days).
 */
export function getEpaperDates(limit: number = 60): string[] {
    ensureDataDir();
    const files = readdirSync(DATA_DIR)
        .filter(
            (f) =>
                f.startsWith('epaper-') &&
                f.endsWith('.json') &&
                f !== 'epaper-index.json'
        )
        .sort()
        .reverse()
        .slice(0, limit);

    return files.map((f) => f.replace('epaper-', '').replace('.json', ''));
}

/**
 * Load articles from the last N days of ePapers.
 */
export function loadRecentEpaperArticles(days: number = 7): EpaperArticle[] {
    ensureDataDir();
    const files = readdirSync(DATA_DIR)
        .filter(
            (f) =>
                f.startsWith('epaper-') &&
                f.endsWith('.json') &&
                f !== 'epaper-index.json'
        )
        .sort()
        .reverse()
        .slice(0, days);

    const allArticles: EpaperArticle[] = [];

    for (const file of files) {
        try {
            const data: DailyEpaper = JSON.parse(
                readFileSync(path.join(DATA_DIR, file), 'utf-8')
            );
            allArticles.push(...data.articles);
        } catch {
            continue;
        }
    }

    return allArticles;
}

/**
 * Update the index file with metadata about all available ePapers.
 */
function updateIndex(): void {
    ensureDataDir();
    const files = readdirSync(DATA_DIR)
        .filter(
            (f) =>
                f.startsWith('epaper-') &&
                f.endsWith('.json') &&
                f !== 'epaper-index.json'
        )
        .sort()
        .reverse();

    let totalArticles = 0;
    const availableDates: string[] = [];

    for (const file of files) {
        const date = file.replace('epaper-', '').replace('.json', '');
        availableDates.push(date);
        try {
            const data: DailyEpaper = JSON.parse(
                readFileSync(path.join(DATA_DIR, file), 'utf-8')
            );
            totalArticles += data.articles.length;
        } catch {
            // skip
        }
    }

    const index: EpaperIndex = {
        lastUpdated: new Date().toISOString(),
        availableDates,
        totalArticles,
        latestDate: availableDates[0] || '',
    };

    writeFileSync(
        path.join(DATA_DIR, 'epaper-index.json'),
        JSON.stringify(index, null, 2),
        'utf-8'
    );
}

/**
 * Get index data.
 */
export function getEpaperIndex(): EpaperIndex | null {
    const indexPath = path.join(DATA_DIR, 'epaper-index.json');
    if (!existsSync(indexPath)) return null;
    try {
        return JSON.parse(readFileSync(indexPath, 'utf-8'));
    } catch {
        return null;
    }
}
