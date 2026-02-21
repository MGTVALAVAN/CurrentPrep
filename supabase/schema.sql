-- CSE SelfStudy Hub - Database Schema (Supabase/Postgres)
-- Run this migration to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  language_pref VARCHAR(5) DEFAULT 'en' CHECK (language_pref IN ('en', 'ta')),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- USER PROGRESS
-- ============================================================
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id VARCHAR(100) NOT NULL,  -- matches syllabusData topic IDs
  paper VARCHAR(20) NOT NULL,       -- 'prelims-gs1', 'mains-gs2', etc.
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'revision')),
  score INTEGER,                    -- quiz score percentage
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE UNIQUE INDEX idx_progress_user_topic ON user_progress(user_id, topic_id);

-- ============================================================
-- FORUM POSTS
-- ============================================================
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('prelims', 'mains', 'optional', 'strategy', 'current_affairs', 'general')),
  upvotes INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_category ON forum_posts(category);
CREATE INDEX idx_posts_created ON forum_posts(created_at DESC);

-- ============================================================
-- FORUM REPLIES
-- ============================================================
CREATE TABLE forum_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_replies_post ON forum_replies(post_id);

-- ============================================================
-- QUIZ ATTEMPTS
-- ============================================================
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_type VARCHAR(20) NOT NULL CHECK (quiz_type IN ('prelims_mcq', 'mains_descriptive', 'csat', 'current_affairs')),
  topic_id VARCHAR(100),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  score_percentage DECIMAL(5,2) NOT NULL,
  time_taken_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_completed ON quiz_attempts(completed_at DESC);

-- ============================================================
-- BADGES
-- ============================================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL,  -- emoji
  criteria JSONB NOT NULL     -- e.g., {"type": "quiz_count", "threshold": 1}
);

-- Seed default badges
INSERT INTO badges (name, description, icon, criteria) VALUES
  ('First Quiz', 'Complete your first quiz', '🏆', '{"type": "quiz_count", "threshold": 1}'),
  ('7-Day Streak', 'Study 7 days in a row', '🔥', '{"type": "streak_days", "threshold": 7}'),
  ('NCERT Master', 'Complete all NCERT summaries', '📚', '{"type": "topics_completed", "threshold": 50}'),
  ('Healthy Mind', 'Take 10 walking breaks', '🚶', '{"type": "walk_breaks", "threshold": 10}'),
  ('Essay Writer', 'Submit 5 essay evaluations', '✍️', '{"type": "essay_count", "threshold": 5}'),
  ('Prelims Ready', 'Score 60%+ on a mock test', '🎯', '{"type": "mock_score", "threshold": 60}'),
  ('Community Star', 'Get 50 upvotes on forum', '⭐', '{"type": "forum_upvotes", "threshold": 50}'),
  ('Mentor', 'Help 10 aspirants in forum', '🤝', '{"type": "replies_count", "threshold": 10}');

-- ============================================================
-- USER BADGES
-- ============================================================
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_badges ON user_badges(user_id, badge_id);

-- ============================================================
-- STUDY SESSIONS (for streak tracking & walking break timer)
-- ============================================================
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  walk_breaks_taken INTEGER DEFAULT 0,
  topics_studied TEXT[]  -- array of topic IDs
);

CREATE INDEX idx_sessions_user ON study_sessions(user_id);
CREATE INDEX idx_sessions_date ON study_sessions(started_at DESC);

-- ============================================================
-- ANSWER SUBMISSIONS (for AI evaluation feature)
-- ============================================================
CREATE TABLE answer_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer_text TEXT,
  answer_image_url TEXT,
  ai_feedback JSONB,       -- structured AI response
  overall_score DECIMAL(5,2),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_answers_user ON answer_submissions(user_id);
