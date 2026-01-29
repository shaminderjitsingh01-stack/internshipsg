-- Feedback table for user feedback collection
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'general', -- 'bug', 'feature', 'general'
  content TEXT NOT NULL,
  email TEXT,
  page TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'reviewed', 'resolved', 'closed'
  notes TEXT, -- Admin notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);
