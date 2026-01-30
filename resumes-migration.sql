-- User resumes
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  title TEXT DEFAULT 'My Resume',
  template TEXT DEFAULT 'modern', -- modern, classic, minimal, creative
  is_primary BOOLEAN DEFAULT FALSE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_email);
CREATE INDEX IF NOT EXISTS idx_resumes_primary ON resumes(user_email, is_primary) WHERE is_primary = TRUE;
