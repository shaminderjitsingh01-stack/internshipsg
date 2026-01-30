-- =====================================================
-- MENTORSHIP FEATURE MIGRATION
-- =====================================================

-- =====================================================
-- 1. MENTORS TABLE - Users who register as mentors
-- =====================================================

CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255),
  bio TEXT,
  expertise_areas TEXT[],
  industries TEXT[],
  skills TEXT[],
  years_experience INTEGER,
  company VARCHAR(255),
  position VARCHAR(255),
  hourly_rate INTEGER,
  is_free BOOLEAN DEFAULT true,
  max_mentees INTEGER DEFAULT 5,
  current_mentees INTEGER DEFAULT 0,
  availability JSONB, -- {"monday": ["09:00-12:00", "14:00-17:00"], ...}
  timezone VARCHAR(100) DEFAULT 'Asia/Singapore',
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  linkedin_url VARCHAR(500),
  website_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentors_email ON mentors(user_email);
CREATE INDEX IF NOT EXISTS idx_mentors_active ON mentors(is_active);
CREATE INDEX IF NOT EXISTS idx_mentors_industries ON mentors USING GIN(industries);
CREATE INDEX IF NOT EXISTS idx_mentors_skills ON mentors USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_mentors_rating ON mentors(rating DESC);

-- =====================================================
-- 2. MENTORSHIP REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  mentee_email VARCHAR(255) NOT NULL,
  message TEXT,
  goals TEXT,
  areas_of_interest TEXT[],
  preferred_schedule TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, cancelled
  decline_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  UNIQUE(mentor_id, mentee_email, status)
);

CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor ON mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentee ON mentorship_requests(mentee_email);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_status ON mentorship_requests(status);

-- =====================================================
-- 3. MENTORSHIPS TABLE - Active mentor-mentee connections
-- =====================================================

CREATE TABLE IF NOT EXISTS mentorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  mentee_email VARCHAR(255) NOT NULL,
  request_id UUID REFERENCES mentorship_requests(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed, cancelled
  goals TEXT,
  notes TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  total_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(mentor_id, mentee_email)
);

CREATE INDEX IF NOT EXISTS idx_mentorships_mentor ON mentorships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_mentee ON mentorships(mentee_email);
CREATE INDEX IF NOT EXISTS idx_mentorships_status ON mentorships(status);

-- =====================================================
-- 4. MENTORSHIP SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id UUID NOT NULL REFERENCES mentorships(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  mentee_email VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_link VARCHAR(500),
  meeting_type VARCHAR(50) DEFAULT 'video_call', -- video_call, phone, in_person
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  notes TEXT,
  mentor_notes TEXT,
  mentee_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancel_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_mentorship ON mentorship_sessions(mentorship_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mentor ON mentorship_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mentee ON mentorship_sessions(mentee_email);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled ON mentorship_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON mentorship_sessions(status);

-- =====================================================
-- 5. MENTOR REVIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS mentor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  mentee_email VARCHAR(255) NOT NULL,
  mentorship_id UUID REFERENCES mentorships(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(mentor_id, mentee_email)
);

CREATE INDEX IF NOT EXISTS idx_reviews_mentor ON mentor_reviews(mentor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_mentee ON mentor_reviews(mentee_email);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON mentor_reviews(rating);

-- =====================================================
-- 6. TRIGGERS & FUNCTIONS
-- =====================================================

-- Update mentor rating when review is added
CREATE OR REPLACE FUNCTION update_mentor_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE mentors
    SET
      rating = (SELECT COALESCE(AVG(rating), 0) FROM mentor_reviews WHERE mentor_id = NEW.mentor_id),
      total_reviews = (SELECT COUNT(*) FROM mentor_reviews WHERE mentor_id = NEW.mentor_id)
    WHERE id = NEW.mentor_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE mentors
    SET
      rating = (SELECT COALESCE(AVG(rating), 0) FROM mentor_reviews WHERE mentor_id = OLD.mentor_id),
      total_reviews = (SELECT COUNT(*) FROM mentor_reviews WHERE mentor_id = OLD.mentor_id)
    WHERE id = OLD.mentor_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_mentor_rating ON mentor_reviews;
CREATE TRIGGER trigger_update_mentor_rating
AFTER INSERT OR UPDATE OR DELETE ON mentor_reviews
FOR EACH ROW EXECUTE FUNCTION update_mentor_rating();

-- Update mentor current_mentees count
CREATE OR REPLACE FUNCTION update_mentor_mentee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE mentors SET current_mentees = current_mentees + 1 WHERE id = NEW.mentor_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE mentors SET current_mentees = current_mentees - 1 WHERE id = OLD.mentor_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE mentors SET current_mentees = current_mentees - 1 WHERE id = NEW.mentor_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE mentors SET current_mentees = current_mentees + 1 WHERE id = NEW.mentor_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_mentee_count ON mentorships;
CREATE TRIGGER trigger_update_mentee_count
AFTER INSERT OR UPDATE OR DELETE ON mentorships
FOR EACH ROW EXECUTE FUNCTION update_mentor_mentee_count();

-- Update session counts
CREATE OR REPLACE FUNCTION update_session_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update mentorship session count
    UPDATE mentorships SET total_sessions = total_sessions + 1 WHERE id = NEW.mentorship_id;
    -- Update mentor session count
    UPDATE mentors SET total_sessions = total_sessions + 1 WHERE id = NEW.mentor_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_session_counts ON mentorship_sessions;
CREATE TRIGGER trigger_update_session_counts
AFTER UPDATE ON mentorship_sessions
FOR EACH ROW EXECUTE FUNCTION update_session_counts();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
