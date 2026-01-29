-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'meetup', -- meetup, workshop, webinar, career_fair, networking
  location TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  virtual_link TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  max_attendees INTEGER,
  cover_image TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event RSVPs
CREATE TABLE event_rsvps (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'going', -- going, interested, not_going
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (event_id, user_email)
);

-- Indexes
CREATE INDEX idx_events_organizer ON events(organizer_email);
CREATE INDEX idx_events_start ON events(start_time);
CREATE INDEX idx_event_rsvps_event ON event_rsvps(event_id);
