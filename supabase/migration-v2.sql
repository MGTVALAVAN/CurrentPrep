-- ============================================================
-- CurrentPrep — Supabase Migration v2
-- 
-- This replaces the original schema.sql with:
--   ✅ password_hash, role, provider on users table
--   ✅ Row Level Security (RLS) on ALL tables
--   ✅ contact_submissions table
--   ✅ payments table (for Razorpay integration)
--   ✅ Proper indexes for performance
--   ✅ updated_at auto-trigger
--
-- Run: psql your_database_url < supabase/migration-v2.sql
-- Or paste into Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- UTILITY: auto-update updated_at column
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,                    -- NULL for OAuth-only users
  name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  provider VARCHAR(20) DEFAULT 'credentials' CHECK (provider IN ('credentials', 'google')),
  language_pref VARCHAR(5) DEFAULT 'en' CHECK (language_pref IN ('en', 'ta')),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Auto-update updated_at
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: Users can read/update their own row. Admin can read all.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role (admin/server) bypasses RLS automatically

-- ============================================================
-- 2. USER PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id VARCHAR(100) NOT NULL,
  paper VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'revision')),
  score INTEGER,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_user_topic ON user_progress(user_id, topic_id);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own progress"
  ON user_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. QUIZ ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_type VARCHAR(20) NOT NULL
    CHECK (quiz_type IN ('prelims_mcq', 'mains_descriptive', 'csat', 'current_affairs', 'custom_mock', 'full_length')),
  topic_id VARCHAR(100),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  score_percentage DECIMAL(5,2) NOT NULL,
  time_taken_seconds INTEGER,
  question_uids TEXT[],               -- Track which questions were attempted
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_completed ON quiz_attempts(completed_at DESC);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. STUDY SESSIONS (streak tracking & walking breaks)
-- ============================================================
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  walk_breaks_taken INTEGER DEFAULT 0,
  topics_studied TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON study_sessions(started_at DESC);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own sessions"
  ON study_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. BADGES (system-level, readable by all)
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL,
  criteria JSONB NOT NULL
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badges"
  ON badges FOR SELECT
  USING (true);

-- Seed default badges (ignore conflicts on re-run)
INSERT INTO badges (name, description, icon, criteria) VALUES
  ('First Quiz', 'Complete your first quiz', '🏆', '{"type": "quiz_count", "threshold": 1}'),
  ('7-Day Streak', 'Study 7 days in a row', '🔥', '{"type": "streak_days", "threshold": 7}'),
  ('NCERT Master', 'Complete all NCERT summaries', '📚', '{"type": "topics_completed", "threshold": 50}'),
  ('Healthy Mind', 'Take 10 walking breaks', '🚶', '{"type": "walk_breaks", "threshold": 10}'),
  ('Essay Writer', 'Submit 5 essay evaluations', '✍️', '{"type": "essay_count", "threshold": 5}'),
  ('Prelims Ready', 'Score 60%+ on a mock test', '🎯', '{"type": "mock_score", "threshold": 60}'),
  ('Community Star', 'Get 50 upvotes on forum', '⭐', '{"type": "forum_upvotes", "threshold": 50}'),
  ('Mentor', 'Help 10 aspirants in forum', '🤝', '{"type": "replies_count", "threshold": 10}')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 6. USER BADGES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_badges ON user_badges(user_id, badge_id);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 7. FORUM POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) NOT NULL
    CHECK (category IN ('prelims', 'mains', 'optional', 'strategy', 'current_affairs', 'general')),
  upvotes INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_category ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created ON forum_posts(created_at DESC);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read forum posts"
  ON forum_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON forum_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit own posts"
  ON forum_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- 8. FORUM REPLIES
-- ============================================================
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_replies_post ON forum_replies(post_id);

ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read replies"
  ON forum_replies FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create replies"
  ON forum_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 9. ANSWER SUBMISSIONS (AI evaluation)
-- ============================================================
CREATE TABLE IF NOT EXISTS answer_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer_text TEXT,
  answer_image_url TEXT,
  ai_feedback JSONB,
  overall_score DECIMAL(5,2),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_answers_user ON answer_submissions(user_id);

ALTER TABLE answer_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own submissions"
  ON answer_submissions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 10. CONTACT SUBMISSIONS (public, no user required)
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  ip_address VARCHAR(45),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_submissions(created_at DESC);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Only service role (admin server) can read contact submissions
-- No public access needed

-- ============================================================
-- 11. PAYMENTS (Razorpay integration — Day 12)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  amount_paise INTEGER NOT NULL,           -- Amount in paise (₹199 = 19900)
  currency VARCHAR(3) DEFAULT 'INR',
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('monthly', 'quarterly', 'annual')),
  status VARCHAR(20) DEFAULT 'created'
    CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
  receipt VARCHAR(100),
  notes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay ON payments(razorpay_order_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Payment creation/updates only via service role (server-side)

-- Auto-update updated_at on payments
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 12. EPAPERS (stores generated ePaper metadata)
-- ============================================================
CREATE TABLE IF NOT EXISTS epapers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  article_count INTEGER DEFAULT 0,
  high_priority_count INTEGER DEFAULT 0,
  sources TEXT[],
  has_prelims_mocks BOOLEAN DEFAULT FALSE,
  has_mains_mocks BOOLEAN DEFAULT FALSE,
  has_csat_mocks BOOLEAN DEFAULT FALSE,
  data JSONB NOT NULL,                     -- Full ePaper JSON (articles, mocks, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_epapers_date ON epapers(date DESC);

ALTER TABLE epapers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read epapers"
  ON epapers FOR SELECT
  USING (true);

-- Writes only via service role (server-side generation)

-- ============================================================
-- SUMMARY
-- ============================================================
-- 12 tables total, all with RLS enabled:
--   1. users           — User accounts (credentials + OAuth)
--   2. user_progress    — Topic progress tracking
--   3. quiz_attempts    — Quiz/mock test results
--   4. study_sessions   — Study streaks & timer
--   5. badges           — System badge definitions
--   6. user_badges      — Earned badges
--   7. forum_posts      — Community forum
--   8. forum_replies    — Forum replies
--   9. answer_submissions — AI essay evaluation
--  10. contact_submissions — Contact form entries
--  11. payments         — Razorpay payment records
--  12. epapers          — ePaper data (migrated from JSON files)
