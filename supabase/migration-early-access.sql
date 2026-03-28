-- ============================================================
-- EARLY ACCESS CLAIMS (First 250 users get free Pro)
-- ============================================================
-- Tracks users who claimed free Pro via the early access program.
-- Enforced at both DB (unique constraint) and API (count check) levels.

CREATE TABLE early_access_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  
  -- Feedback fields (required to claim)
  feedback_rating INTEGER NOT NULL CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_what_you_like TEXT NOT NULL,
  feedback_what_to_improve TEXT NOT NULL,
  feedback_would_recommend BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Metadata
  slot_number INTEGER NOT NULL,          -- 1..250, assigned sequentially
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_early_access_user UNIQUE (user_id),
  CONSTRAINT unique_early_access_email UNIQUE (email),
  CONSTRAINT max_slot_number CHECK (slot_number <= 250)
);

CREATE INDEX idx_early_access_claimed ON early_access_claims(claimed_at DESC);
