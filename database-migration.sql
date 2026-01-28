-- Internship.sg Database Migration
-- Run this in Supabase SQL Editor
-- Created: January 2026

-- =====================================================
-- 1. EXTEND USER ACCOUNTS TABLE
-- =====================================================

-- Profile fields
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS school VARCHAR(100);
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(20);
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS target_role VARCHAR(100);
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS bio VARCHAR(200);
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(255);
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS preferred_industries TEXT[] DEFAULT '{}';

-- Visibility & status
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS is_looking BOOLEAN DEFAULT false;
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

-- Gamification
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'bronze';

-- Referrals
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS referred_by VARCHAR(50);
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Streak enhancements
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS streak_freezes INTEGER DEFAULT 0;
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS last_freeze_used TIMESTAMP;

-- Profile completion
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP;
ALTER TABLE "user accounts" ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- =====================================================
-- 2. CREATE REFERRALS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_email VARCHAR(255) NOT NULL,
  referred_email VARCHAR(255) NOT NULL,
  referral_code VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  rewarded BOOLEAN DEFAULT false,
  reward_type VARCHAR(50),
  UNIQUE(referred_email)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_email);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- =====================================================
-- 3. CREATE EMPLOYER WAITLIST TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS employer_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  role VARCHAR(100),
  company_size VARCHAR(50),
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  contacted BOOLEAN DEFAULT false,
  contacted_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending'
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_employer_waitlist_status ON employer_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_employer_waitlist_created ON employer_waitlist(created_at DESC);

-- =====================================================
-- 4. CREATE XP TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for user XP history
CREATE INDEX IF NOT EXISTS idx_xp_user ON xp_transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_xp_created ON xp_transactions(created_at DESC);

-- =====================================================
-- 5. CREATE DAILY CHALLENGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_date DATE NOT NULL UNIQUE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'behavioral',
  difficulty VARCHAR(20) DEFAULT 'medium',
  xp_reward INTEGER DEFAULT 20,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_challenge_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  challenge_date DATE NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  xp_earned INTEGER,
  UNIQUE(user_email, challenge_date)
);

-- =====================================================
-- 6. CREATE PROFILE VIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewed_username VARCHAR(50) NOT NULL,
  viewer_email VARCHAR(255),
  viewer_type VARCHAR(20) DEFAULT 'user', -- 'user', 'employer', 'anonymous'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_profile_views_username ON profile_views(viewed_username);
CREATE INDEX IF NOT EXISTS idx_profile_views_date ON profile_views(created_at DESC);

-- =====================================================
-- 7. INDEXES FOR LEADERBOARD QUERIES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_public ON "user accounts"(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_users_school ON "user accounts"(school);
CREATE INDEX IF NOT EXISTS idx_users_tier ON "user accounts"(tier);
CREATE INDEX IF NOT EXISTS idx_users_xp ON "user accounts"(xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON "user accounts"(username);

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(20) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * 36 + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user tier based on XP and percentile
CREATE OR REPLACE FUNCTION calculate_tier(user_xp INTEGER, user_email VARCHAR)
RETURNS VARCHAR(20) AS $$
DECLARE
  total_users INTEGER;
  user_rank INTEGER;
  percentile FLOAT;
BEGIN
  -- Get total active users
  SELECT COUNT(*) INTO total_users FROM "user accounts" WHERE xp > 0;

  IF total_users = 0 THEN
    RETURN 'bronze';
  END IF;

  -- Get user's rank
  SELECT COUNT(*) + 1 INTO user_rank
  FROM "user accounts"
  WHERE xp > user_xp;

  percentile := (user_rank::float / total_users::float) * 100;

  -- Determine tier
  IF percentile <= 5 THEN
    RETURN 'elite';
  ELSIF percentile <= 20 THEN
    RETURN 'verified';
  ELSIF user_xp >= 1000 THEN
    RETURN 'gold';
  ELSIF user_xp >= 500 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. SET DEFAULT REFERRAL CODES FOR EXISTING USERS
-- =====================================================

-- Generate referral codes for users who don't have one
UPDATE "user accounts"
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- =====================================================
-- 10. CREATE WEEKLY CHALLENGES TABLES
-- =====================================================

-- User challenge progress tracking
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  challenge_id VARCHAR(100) NOT NULL,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_email, challenge_id, week_number, year)
);

-- Indexes for weekly challenges
CREATE INDEX IF NOT EXISTS idx_user_challenges_email ON user_challenges(user_email);
CREATE INDEX IF NOT EXISTS idx_user_challenges_week ON user_challenges(week_number, year);
CREATE INDEX IF NOT EXISTS idx_user_challenges_completed ON user_challenges(completed) WHERE completed = true;

-- User activities table for tracking different activity types
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  activity_type VARCHAR(100) NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for activity tracking
CREATE INDEX IF NOT EXISTS idx_user_activities_email ON user_activities(user_email);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_date ON user_activities(created_at DESC);

-- =====================================================
-- 11. EXTEND STREAKS TABLE FOR FREEZE TRACKING
-- =====================================================

-- Add streak freeze columns if they don't exist (may already exist from original table)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streaks' AND column_name = 'streak_freezes') THEN
    ALTER TABLE streaks ADD COLUMN streak_freezes INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streaks' AND column_name = 'last_freeze_used') THEN
    ALTER TABLE streaks ADD COLUMN last_freeze_used TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streaks' AND column_name = 'freeze_used_today') THEN
    ALTER TABLE streaks ADD COLUMN freeze_used_today BOOLEAN DEFAULT false;
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
