// ============================================================
// Core Types for the UPSC Mock Test Engine
// ============================================================

/** Subjects covered in UPSC Prelims GS Paper I */
export type Subject =
  | 'history'
  | 'geography'
  | 'polity'
  | 'economics'
  | 'environment'
  | 'science'
  | 'current_affairs'
  | 'art_culture'
  | 'society';

/** Difficulty levels for questions */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** Answer options */
export type AnswerOption = 'A' | 'B' | 'C' | 'D';

/** Question source */
export type QuestionSource = 'ai_generated' | 'human_curated' | 'past_paper';

/** Test types */
export type TestType = 'full_length' | 'subject_wise';

/** Test attempt status */
export type AttemptStatus = 'in_progress' | 'submitted' | 'evaluated';

// ============================================================
// Question Bank
// ============================================================

export interface Question {
  id: string;

  // Content
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: AnswerOption;
  explanation: string;

  // Metadata
  subject: Subject;
  sub_topic: string;         // e.g., 'hist-ancient', 'geo-physical'
  difficulty: Difficulty;

  // Quality & source
  source: QuestionSource;
  is_approved: boolean;
  year_relevant?: string;    // '2025', '2026', or undefined for timeless

  // Stats (populated after users attempt)
  times_attempted?: number;
  times_correct?: number;
  avg_time_seconds?: number;

  created_at: string;
}

/** Raw question from AI generation (before ID and approval) */
export interface GeneratedQuestion {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  difficulty: string;
  sub_topic: string;
}

// ============================================================
// Mock Tests
// ============================================================

export interface MockTest {
  id: string;
  title: string;
  description: string;
  test_type: TestType;
  subject?: Subject;          // null for full_length

  // Configuration
  total_questions: number;
  duration_minutes: number;
  marks_per_correct: number;
  negative_marks: number;

  // Access
  is_free: boolean;
  is_published: boolean;
  sequence_number: number;

  // Question IDs in order
  question_ids: string[];

  created_at: string;
}

// ============================================================
// User Test Attempts
// ============================================================

export interface TestAttempt {
  id: string;
  user_id: string;
  mock_test_id: string;

  // Timing
  started_at: string;
  submitted_at?: string;
  time_taken_seconds?: number;

  // Scores
  total_attempted: number;
  total_correct: number;
  total_wrong: number;
  total_skipped: number;
  raw_score: number;          // (correct × 2) - (wrong × 0.66)
  percentage: number;

  status: AttemptStatus;

  // Individual answers
  answers: UserAnswer[];
}

export interface UserAnswer {
  question_id: string;
  question_number: number;
  selected_answer?: AnswerOption;
  is_correct?: boolean;
  is_marked_for_review: boolean;
  time_spent_seconds: number;
}

// ============================================================
// Analytics
// ============================================================

export interface SubjectScore {
  subject: Subject;
  subject_label: string;
  total_questions: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  score: number;              // with negative marking
  max_score: number;
  percentage: number;
  accuracy: number;           // correct/attempted * 100
}

export interface SubTopicScore {
  sub_topic: string;
  sub_topic_label: string;
  subject: Subject;
  total_questions: number;
  attempted: number;
  correct: number;
  wrong: number;
  percentage: number;
  accuracy: number;
  status: 'strong' | 'moderate' | 'weak' | 'critical';
}

export interface TestAnalytics {
  // Overall
  total_score: number;
  max_score: number;
  percentage: number;
  accuracy: number;
  attempt_rate: number;
  negative_marks_lost: number;
  avg_time_per_question: number;

  // Breakdowns
  subject_scores: SubjectScore[];
  sub_topic_scores: SubTopicScore[];

  // Time analysis
  fastest_question_seconds: number;
  slowest_question_seconds: number;

  // Recommendations
  focus_areas: FocusArea[];
}

export interface FocusArea {
  subject: Subject;
  sub_topic: string;
  sub_topic_label: string;
  current_score: number;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
}

// ============================================================
// Generation Config
// ============================================================

export interface GenerationBatch {
  subject: Subject;
  sub_topic: string;
  sub_topic_label: string;
  count: number;
  difficulty_mix: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface GenerationResult {
  batch: GenerationBatch;
  questions: GeneratedQuestion[];
  valid_count: number;
  invalid_count: number;
  errors: string[];
  generated_at: string;
}
