-- =====================================================
-- MIGRATION: Groups/Communities Feature
-- =====================================================

-- =====================================================
-- 1. GROUPS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'interest',
  cover_image VARCHAR(500),
  privacy VARCHAR(20) NOT NULL DEFAULT 'public',
  rules TEXT,
  creator_email VARCHAR(255) NOT NULL,
  member_count INTEGER DEFAULT 1,
  post_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Valid categories: career, industry, school, interest
-- Valid privacy: public, private, invite-only

CREATE INDEX IF NOT EXISTS idx_groups_slug ON groups(slug);
CREATE INDEX IF NOT EXISTS idx_groups_category ON groups(category);
CREATE INDEX IF NOT EXISTS idx_groups_privacy ON groups(privacy);
CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(creator_email);
CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_groups_member_count ON groups(member_count DESC);

-- =====================================================
-- 2. GROUP MEMBERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by VARCHAR(255),
  UNIQUE(group_id, user_email)
);

-- Valid roles: creator, admin, moderator, member
-- Valid status: active, pending, banned

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_email);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(group_id, role);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);

-- =====================================================
-- 3. GROUP POSTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  author_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  post_type VARCHAR(50) DEFAULT 'text',
  image_url VARCHAR(500),
  link_url VARCHAR(500),
  reaction_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_announcement BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_group_posts_group ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_author ON group_posts(author_email);
CREATE INDEX IF NOT EXISTS idx_group_posts_created ON group_posts(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_posts_pinned ON group_posts(group_id, is_pinned) WHERE is_pinned = true;

-- =====================================================
-- 4. GROUP POST REACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS group_post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  reaction_type VARCHAR(20) NOT NULL DEFAULT 'like',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_email)
);

CREATE INDEX IF NOT EXISTS idx_group_post_reactions_post ON group_post_reactions(post_id);

-- =====================================================
-- 5. GROUP POST COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS group_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  author_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES group_post_comments(id) ON DELETE CASCADE,
  reaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_group_post_comments_post ON group_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_author ON group_post_comments(author_email);

-- =====================================================
-- 6. GROUP INVITATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  inviter_email VARCHAR(255) NOT NULL,
  invitee_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(group_id, invitee_email)
);

-- Valid status: pending, accepted, declined

CREATE INDEX IF NOT EXISTS idx_group_invitations_group ON group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee ON group_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON group_invitations(status);

-- =====================================================
-- 7. TRIGGERS & FUNCTIONS
-- =====================================================

-- Update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE groups SET member_count = member_count - 1 WHERE id = NEW.group_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_group_member_count ON group_members;
CREATE TRIGGER trigger_update_group_member_count
AFTER INSERT OR DELETE OR UPDATE ON group_members
FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Update group post count
CREATE OR REPLACE FUNCTION update_group_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET post_count = post_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET post_count = post_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_group_post_count ON group_posts;
CREATE TRIGGER trigger_update_group_post_count
AFTER INSERT OR DELETE ON group_posts
FOR EACH ROW EXECUTE FUNCTION update_group_post_count();

-- Update group post reaction count
CREATE OR REPLACE FUNCTION update_group_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE group_posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE group_posts SET reaction_count = reaction_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_group_post_reaction_count ON group_post_reactions;
CREATE TRIGGER trigger_update_group_post_reaction_count
AFTER INSERT OR DELETE ON group_post_reactions
FOR EACH ROW EXECUTE FUNCTION update_group_post_reaction_count();

-- Update group post comment count
CREATE OR REPLACE FUNCTION update_group_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE group_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE group_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_group_post_comment_count ON group_post_comments;
CREATE TRIGGER trigger_update_group_post_comment_count
AFTER INSERT OR DELETE ON group_post_comments
FOR EACH ROW EXECUTE FUNCTION update_group_post_comment_count();

-- Helper function to generate slug from name
CREATE OR REPLACE FUNCTION generate_group_slug(group_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := LOWER(REGEXP_REPLACE(TRIM(group_name), '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);

  final_slug := base_slug;

  -- Check for uniqueness and add counter if needed
  WHILE EXISTS(SELECT 1 FROM groups WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
