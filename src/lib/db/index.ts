/**
 * Database Access Layer — Barrel Export
 * 
 * Import everything from '@/lib/db' instead of individual files:
 *   import { getUserById, saveQuizAttempt, createPost } from '@/lib/db';
 * 
 * 7 modules covering all 12 database tables:
 *   users.ts          → users table
 *   quiz.ts           → quiz_attempts table
 *   epaper.ts         → epapers table
 *   forum.ts          → forum_posts + forum_replies tables
 *   payments.ts       → payments table
 *   bookmarks.ts      → bookmarks table (future migration)
 *   contact.ts        → contact_submissions table
 */

export * from './users';
export * from './quiz';
export * from './epaper';
export * from './forum';
export * from './payments';
export * from './bookmarks';
export * from './contact';
