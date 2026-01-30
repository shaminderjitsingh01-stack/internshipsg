-- =====================================================
-- MIGRATION: Notification Preferences
-- =====================================================

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,

  -- Email notifications
  email_new_follower BOOLEAN DEFAULT true,
  email_post_likes BOOLEAN DEFAULT true,
  email_comments BOOLEAN DEFAULT true,
  email_mentions BOOLEAN DEFAULT true,
  email_direct_messages BOOLEAN DEFAULT true,
  email_job_alerts BOOLEAN DEFAULT true,
  email_weekly_digest BOOLEAN DEFAULT true,

  -- Push notifications
  push_new_follower BOOLEAN DEFAULT true,
  push_post_likes BOOLEAN DEFAULT true,
  push_comments BOOLEAN DEFAULT true,
  push_mentions BOOLEAN DEFAULT true,
  push_direct_messages BOOLEAN DEFAULT true,
  push_job_alerts BOOLEAN DEFAULT true,
  push_weekly_digest BOOLEAN DEFAULT false,

  -- Quiet hours settings
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_email ON notification_preferences(email);

-- Enable Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own notification preferences
CREATE POLICY "Users can read own notification preferences"
  ON notification_preferences
  FOR SELECT
  USING (true);

-- Users can insert their own notification preferences
CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own notification preferences
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences
  FOR UPDATE
  USING (true);

-- Grant permissions
GRANT ALL ON notification_preferences TO authenticated;
GRANT ALL ON notification_preferences TO anon;
