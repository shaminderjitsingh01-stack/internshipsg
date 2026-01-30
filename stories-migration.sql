-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_email TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'image', -- image, video
  background_color TEXT DEFAULT '#dc2626',
  text_color TEXT DEFAULT '#ffffff',
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story views
CREATE TABLE IF NOT EXISTS story_views (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  viewer_email TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (story_id, viewer_email)
);

CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_email);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer ON story_views(viewer_email);
