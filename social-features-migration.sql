-- =====================================================
-- INTERNSHIP.SG SOCIAL FEATURES - DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. FOLLOWS/CONNECTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_email VARCHAR(255) NOT NULL,  -- who is following
  following_email VARCHAR(255) NOT NULL, -- who they follow
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_email, following_email)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_email);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_email);

-- Prevent self-follow
ALTER TABLE follows ADD CONSTRAINT no_self_follow CHECK (follower_email != following_email);

-- =====================================================
-- 2. POSTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  post_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'achievement', 'job_share', 'poll'

  -- Media
  image_url VARCHAR(500),
  link_url VARCHAR(500),
  link_preview JSONB, -- {title, description, image}

  -- For achievement posts (auto-generated)
  achievement_type VARCHAR(100), -- 'streak', 'badge', 'level_up', 'interview_complete'
  achievement_data JSONB, -- flexible data for achievements

  -- For job share posts
  job_id UUID,

  -- Engagement counts (denormalized for performance)
  reaction_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  -- Visibility
  visibility VARCHAR(20) DEFAULT 'public', -- 'public', 'connections', 'private'
  is_pinned BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- soft delete
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_email);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);

-- =====================================================
-- 3. REACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  reaction_type VARCHAR(20) NOT NULL, -- 'fire', 'muscle', 'clap', 'target', 'heart', 'idea'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_email) -- one reaction per user per post
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_email);

-- =====================================================
-- 4. COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,

  -- For nested replies
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,

  -- Engagement
  reaction_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- soft delete
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_email);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);

-- =====================================================
-- 5. COMMENT REACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL, -- who receives the notification

  -- Notification type
  type VARCHAR(50) NOT NULL, -- 'follow', 'reaction', 'comment', 'mention', 'achievement', 'job_alert'

  -- Who triggered it
  actor_email VARCHAR(255), -- can be null for system notifications

  -- What it relates to
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,

  -- Content
  title VARCHAR(255) NOT NULL,
  body TEXT,
  link VARCHAR(500), -- where to go when clicked

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_email, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- 7. BOOKMARKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag VARCHAR(100) NOT NULL UNIQUE,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_count ON hashtags(post_count DESC);

-- =====================================================
-- 9. POST HASHTAGS (Junction Table)
-- =====================================================

CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, hashtag_id)
);

-- =====================================================
-- 10. MENTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  mentioned_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentions_user ON mentions(mentioned_email);

-- =====================================================
-- 11. BLOCKED USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_email VARCHAR(255) NOT NULL,
  blocked_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_email, blocked_email)
);

CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON blocked_users(blocker_email);
CREATE INDEX IF NOT EXISTS idx_blocked_blocked ON blocked_users(blocked_email);

-- =====================================================
-- 12. HELPER FUNCTIONS
-- =====================================================

-- Function to update post reaction count
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

-- Trigger for reaction count
DROP TRIGGER IF EXISTS trigger_update_reaction_count ON reactions;
CREATE TRIGGER trigger_update_reaction_count
AFTER INSERT OR DELETE ON reactions
FOR EACH ROW EXECUTE FUNCTION update_post_reaction_count();

-- Function to update post comment count
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

-- Trigger for comment count
DROP TRIGGER IF EXISTS trigger_update_comment_count ON comments;
CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- =====================================================
-- 13. ADD SOCIAL COLUMNS TO PROFILES
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS post_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline VARCHAR(200); -- LinkedIn-style headline

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
