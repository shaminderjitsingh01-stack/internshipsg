-- =====================================================
-- COMBINED MIGRATION: Social Features for Internship.sg
-- =====================================================

-- =====================================================
-- 1. EDUCATION & EXPERIENCE TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS user_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  school VARCHAR(255) NOT NULL,
  degree VARCHAR(100),
  field_of_study VARCHAR(255),
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  grade VARCHAR(50),
  activities TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_education_user ON user_education(user_email);
CREATE INDEX IF NOT EXISTS idx_education_order ON user_education(user_email, display_order);

CREATE TABLE IF NOT EXISTS user_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  employment_type VARCHAR(50),
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  skills_used TEXT[],
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experience_user ON user_experience(user_email);
CREATE INDEX IF NOT EXISTS idx_experience_order ON user_experience(user_email, display_order);

CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  image_url VARCHAR(500),
  technologies TEXT[],
  start_date DATE,
  end_date DATE,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON user_projects(user_email);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON user_projects(user_email, is_featured);

CREATE TABLE IF NOT EXISTS user_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  credential_id VARCHAR(255),
  credential_url VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certifications_user ON user_certifications(user_email);

-- =====================================================
-- 2. SOCIAL/FOLLOW SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_email VARCHAR(255) NOT NULL,
  following_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_email, following_email)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_email);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_email);

DO $$ BEGIN
  ALTER TABLE follows ADD CONSTRAINT no_self_follow CHECK (follower_email != following_email);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 3. POSTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  post_type VARCHAR(50) DEFAULT 'text',
  image_url VARCHAR(500),
  link_url VARCHAR(500),
  link_preview JSONB,
  achievement_type VARCHAR(100),
  achievement_data JSONB,
  job_id UUID,
  reaction_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  visibility VARCHAR(20) DEFAULT 'public',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_email);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);

-- =====================================================
-- 4. REACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  reaction_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_email);

-- =====================================================
-- 5. COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_email);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);

CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  reaction_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(comment_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);

-- =====================================================
-- 6. NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  actor_email VARCHAR(255),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  link VARCHAR(500),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_email, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- 7. BOOKMARKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_email, post_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_email);

-- =====================================================
-- 8. HASHTAGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag VARCHAR(100) NOT NULL UNIQUE,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_count ON hashtags(post_count DESC);

CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, hashtag_id)
);

-- =====================================================
-- 9. MENTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  mentioned_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentions_user ON mentions(mentioned_email);

-- =====================================================
-- 10. BLOCKED USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_email VARCHAR(255) NOT NULL,
  blocked_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_email, blocked_email)
);

CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON blocked_users(blocker_email);
CREATE INDEX IF NOT EXISTS idx_blocked_blocked ON blocked_users(blocked_email);

-- =====================================================
-- 11. MESSAGES SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_email)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_email);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_email);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE;

-- =====================================================
-- 12. JOBS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  industry TEXT,
  size TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  location TEXT,
  job_type TEXT DEFAULT 'internship',
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'SGD',
  is_remote BOOLEAN DEFAULT FALSE,
  application_url TEXT,
  application_email TEXT,
  posted_by_email TEXT,
  status TEXT DEFAULT 'active',
  views INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_email TEXT NOT NULL,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, applicant_email)
);

CREATE TABLE IF NOT EXISTS saved_jobs (
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (job_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON job_applications(applicant_email);

-- =====================================================
-- 13. FEEDBACK TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  email TEXT,
  page TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

-- =====================================================
-- 14. TRIGGERS & FUNCTIONS
-- =====================================================

-- Update post reaction count
CREATE OR REPLACE FUNCTION update_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET reaction_count = reaction_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reaction_count ON reactions;
CREATE TRIGGER trigger_update_reaction_count
AFTER INSERT OR DELETE ON reactions
FOR EACH ROW EXECUTE FUNCTION update_post_reaction_count();

-- Update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_count ON comments;
CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- =====================================================
-- 15. ADD COLUMNS TO PROFILES (if exists)
-- =====================================================

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline VARCHAR(200);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
