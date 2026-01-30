CREATE TABLE interview_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  interview_type TEXT DEFAULT 'mock', -- mock, real, coaching
  company_name TEXT,
  job_title TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_interview_schedules_user ON interview_schedules(user_email);
CREATE INDEX idx_interview_schedules_date ON interview_schedules(scheduled_at);
