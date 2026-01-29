-- =====================================================
-- INTERNSHIP.SG SKILLS & ENDORSEMENTS - DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. USER SKILLS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  proficiency TEXT DEFAULT 'intermediate', -- beginner, intermediate, advanced, expert
  endorsement_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_email, skill_name)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_email);
CREATE INDEX IF NOT EXISTS idx_user_skills_name ON user_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_user_skills_endorsement ON user_skills(endorsement_count DESC);

-- =====================================================
-- 2. SKILL ENDORSEMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS skill_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES user_skills(id) ON DELETE CASCADE,
  endorser_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(skill_id, endorser_email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_endorsements_skill ON skill_endorsements(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_endorsements_endorser ON skill_endorsements(endorser_email);

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Function to update skill endorsement count
CREATE OR REPLACE FUNCTION update_skill_endorsement_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_skills SET endorsement_count = endorsement_count + 1 WHERE id = NEW.skill_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_skills SET endorsement_count = GREATEST(endorsement_count - 1, 0) WHERE id = OLD.skill_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for endorsement count
DROP TRIGGER IF EXISTS trigger_update_endorsement_count ON skill_endorsements;
CREATE TRIGGER trigger_update_endorsement_count
AFTER INSERT OR DELETE ON skill_endorsements
FOR EACH ROW EXECUTE FUNCTION update_skill_endorsement_count();

-- =====================================================
-- 4. POPULAR SKILLS VIEW (OPTIONAL)
-- =====================================================

CREATE OR REPLACE VIEW popular_skills AS
SELECT
  skill_name,
  COUNT(DISTINCT user_email) as user_count,
  SUM(endorsement_count) as total_endorsements
FROM user_skills
GROUP BY skill_name
ORDER BY user_count DESC, total_endorsements DESC;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
