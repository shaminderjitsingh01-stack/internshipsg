-- =====================================================
-- INTERNSHIP.SG POLLS FEATURE - DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. POLL OPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. POLL VOTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_option_id, user_email)
);

-- =====================================================
-- 3. INDEXES
-- =====================================================

CREATE INDEX idx_poll_options_post ON poll_options(post_id);
CREATE INDEX idx_poll_votes_option ON poll_votes(poll_option_id);
CREATE INDEX idx_poll_votes_user ON poll_votes(user_email);

-- =====================================================
-- 4. ADD POLL COLUMNS TO POSTS TABLE
-- =====================================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS poll_ends_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 5. HELPER FUNCTION FOR VOTE COUNT
-- =====================================================

CREATE OR REPLACE FUNCTION update_poll_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = NEW.poll_option_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE poll_options SET vote_count = vote_count - 1 WHERE id = OLD.poll_option_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vote count
DROP TRIGGER IF EXISTS trigger_update_poll_vote_count ON poll_votes;
CREATE TRIGGER trigger_update_poll_vote_count
AFTER INSERT OR DELETE ON poll_votes
FOR EACH ROW EXECUTE FUNCTION update_poll_vote_count();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
