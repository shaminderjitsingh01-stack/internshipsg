-- Reports table for content moderation
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_email TEXT NOT NULL,
  reported_email TEXT,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL, -- spam, harassment, inappropriate, fake, other
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, action_taken, dismissed
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_email);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_email);
