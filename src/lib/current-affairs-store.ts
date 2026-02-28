/**
 * Current Affairs Data Store — manages the JSON file that stores
 * daily current affairs articles.
 *
 * Data is stored in /src/data/current-affairs/ as JSON files,
 * one per day: current-affairs-YYYY-MM-DD.json
 *
 * Also maintains an index file: current-affairs-index.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';
import type { DailyCurrentAffairs, ProcessedArticle } from './news-categorizer';

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'current-affairs');

interface CurrentAffairsIndex {
    lastUpdated: string;
    availableDates: string[];
    totalArticles: number;
}

// Ensure data directory exists
function ensureDataDir(): void {
    if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * Save daily current affairs to a date-specific JSON file.
 */
export function saveDailyArticles(data: DailyCurrentAffairs): void {
    ensureDataDir();
    const filePath = path.join(DATA_DIR, `current-affairs-${data.date}.json`);
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[store] Saved ${data.articles.length} articles to ${filePath}`);
    updateIndex();
}

/**
 * Load articles for a specific date.
 */
export function loadDailyArticles(date: string): DailyCurrentAffairs | null {
    const filePath = path.join(DATA_DIR, `current-affairs-${date}.json`);
    if (!existsSync(filePath)) return null;
    try {
        return JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
        return null;
    }
}

/**
 * Load the most recent daily articles available.
 */
export function loadLatestArticles(): DailyCurrentAffairs | null {
    ensureDataDir();
    const files = readdirSync(DATA_DIR)
        .filter((f) => f.startsWith('current-affairs-') && f.endsWith('.json') && f !== 'current-affairs-index.json')
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
 * Load articles from the last N days.
 */
export function loadRecentArticles(days: number = 7): ProcessedArticle[] {
    ensureDataDir();
    const files = readdirSync(DATA_DIR)
        .filter((f) => f.startsWith('current-affairs-') && f.endsWith('.json') && f !== 'current-affairs-index.json')
        .sort()
        .reverse()
        .slice(0, days);

    const allArticles: ProcessedArticle[] = [];

    for (const file of files) {
        try {
            const data: DailyCurrentAffairs = JSON.parse(readFileSync(path.join(DATA_DIR, file), 'utf-8'));
            allArticles.push(...data.articles);
        } catch {
            continue;
        }
    }

    return allArticles;
}

/**
 * Update the index file with metadata about all available dates.
 */
function updateIndex(): void {
    ensureDataDir();
    const files = readdirSync(DATA_DIR)
        .filter((f) => f.startsWith('current-affairs-') && f.endsWith('.json') && f !== 'current-affairs-index.json')
        .sort()
        .reverse();

    let totalArticles = 0;
    const availableDates: string[] = [];

    for (const file of files) {
        const date = file.replace('current-affairs-', '').replace('.json', '');
        availableDates.push(date);
        try {
            const data: DailyCurrentAffairs = JSON.parse(readFileSync(path.join(DATA_DIR, file), 'utf-8'));
            totalArticles += data.articles.length;
        } catch {
            // skip
        }
    }

    const index: CurrentAffairsIndex = {
        lastUpdated: new Date().toISOString(),
        availableDates,
        totalArticles,
    };

    writeFileSync(
        path.join(DATA_DIR, 'current-affairs-index.json'),
        JSON.stringify(index, null, 2),
        'utf-8'
    );
}

/**
 * Get available dates from the index.
 */
export function getAvailableDates(): string[] {
    const indexPath = path.join(DATA_DIR, 'current-affairs-index.json');
    if (!existsSync(indexPath)) return [];
    try {
        const index: CurrentAffairsIndex = JSON.parse(readFileSync(indexPath, 'utf-8'));
        return index.availableDates;
    } catch {
        return [];
    }
}
