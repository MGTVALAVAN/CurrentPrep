/**
 * Quiz Data Access Layer
 * 
 * Day 5: Handles quiz attempt storage and retrieval from Supabase.
 * Currently, quiz data is generated on-the-fly via Gemini.
 * This module stores attempt history for analytics and progress tracking.
 */

import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────

export interface QuizAttempt {
    id?: string;
    user_id: string;
    quiz_type: 'prelims_mcq' | 'mains_descriptive' | 'csat' | 'current_affairs' | 'custom_mock' | 'full_length';
    topic_id?: string;
    total_questions: number;
    correct_answers: number;
    score_percentage: number;
    time_taken_seconds?: number;
    question_uids?: string[];
    completed_at?: string;
}

export interface QuizStats {
    total_attempts: number;
    average_score: number;
    best_score: number;
    total_questions_attempted: number;
    by_type: Record<string, { attempts: number; avg_score: number }>;
    by_topic: Record<string, { attempts: number; avg_score: number }>;
    recent_trend: number[]; // Last 10 scores
}

// ── Functions ──────────────────────────────────────────────────────────

/** Save a quiz attempt after completion */
export async function saveQuizAttempt(attempt: QuizAttempt): Promise<QuizAttempt | null> {
    if (!isSupabaseConfigured()) {
        console.log('[db/quiz] Supabase not configured, skipping save');
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from('quiz_attempts')
        .insert({
            user_id: attempt.user_id,
            quiz_type: attempt.quiz_type,
            topic_id: attempt.topic_id || null,
            total_questions: attempt.total_questions,
            correct_answers: attempt.correct_answers,
            score_percentage: attempt.score_percentage,
            time_taken_seconds: attempt.time_taken_seconds || null,
            question_uids: attempt.question_uids || [],
        })
        .select()
        .single();

    if (error) {
        console.error('[db/quiz] Save attempt error:', error.message);
        return null;
    }
    return data;
}

/** Get quiz history for a user (most recent first) */
export async function getQuizHistory(
    userId: string,
    limit: number = 20,
    quizType?: string
): Promise<QuizAttempt[]> {
    if (!isSupabaseConfigured()) return [];

    let query = supabaseAdmin
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit);

    if (quizType) {
        query = query.eq('quiz_type', quizType);
    }

    const { data, error } = await query;
    if (error) {
        console.error('[db/quiz] Get history error:', error.message);
        return [];
    }
    return data || [];
}

/** Get aggregated quiz stats for a user */
export async function getQuizStats(userId: string): Promise<QuizStats> {
    const emptyStats: QuizStats = {
        total_attempts: 0,
        average_score: 0,
        best_score: 0,
        total_questions_attempted: 0,
        by_type: {},
        by_topic: {},
        recent_trend: [],
    };

    if (!isSupabaseConfigured()) return emptyStats;

    const { data: attempts, error } = await supabaseAdmin
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

    if (error || !attempts || attempts.length === 0) return emptyStats;

    const totalAttempts = attempts.length;
    const avgScore = attempts.reduce((sum: number, a: any) => sum + Number(a.score_percentage), 0) / totalAttempts;
    const bestScore = Math.max(...attempts.map((a: any) => Number(a.score_percentage)));
    const totalQuestions = attempts.reduce((sum: number, a: any) => sum + a.total_questions, 0);

    // Group by type
    const byType: Record<string, { attempts: number; avg_score: number }> = {};
    for (const a of attempts) {
        if (!byType[a.quiz_type]) byType[a.quiz_type] = { attempts: 0, avg_score: 0 };
        byType[a.quiz_type].attempts++;
        byType[a.quiz_type].avg_score += Number(a.score_percentage);
    }
    for (const key of Object.keys(byType)) {
        byType[key].avg_score = Math.round(byType[key].avg_score / byType[key].attempts);
    }

    // Group by topic
    const byTopic: Record<string, { attempts: number; avg_score: number }> = {};
    for (const a of attempts) {
        const topic = a.topic_id || 'general';
        if (!byTopic[topic]) byTopic[topic] = { attempts: 0, avg_score: 0 };
        byTopic[topic].attempts++;
        byTopic[topic].avg_score += Number(a.score_percentage);
    }
    for (const key of Object.keys(byTopic)) {
        byTopic[key].avg_score = Math.round(byTopic[key].avg_score / byTopic[key].attempts);
    }

    // Recent trend (last 10 scores in chronological order)
    const recentTrend = attempts
        .slice(0, 10)
        .reverse()
        .map((a: any) => Math.round(Number(a.score_percentage)));

    return {
        total_attempts: totalAttempts,
        average_score: Math.round(avgScore),
        best_score: Math.round(bestScore),
        total_questions_attempted: totalQuestions,
        by_type: byType,
        by_topic: byTopic,
        recent_trend: recentTrend,
    };
}

/** Get previously attempted question UIDs for a user (for repeat control) */
export async function getAttemptedQuestionUIDs(userId: string): Promise<string[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabaseAdmin
        .from('quiz_attempts')
        .select('question_uids')
        .eq('user_id', userId);

    if (error || !data) return [];

    const allUIDs = new Set<string>();
    for (const row of data) {
        if (Array.isArray(row.question_uids)) {
            for (const uid of row.question_uids) {
                allUIDs.add(uid);
            }
        }
    }
    return Array.from(allUIDs);
}
