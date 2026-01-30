-- Company Reviews Migration
-- Creates tables and functions for the company reviews feature

-- Reviews table
CREATE TABLE IF NOT EXISTS company_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('intern', 'full-time', 'part-time', 'contract')),
  department TEXT,
  start_date DATE,
  end_date DATE,
  is_current_employee BOOLEAN DEFAULT false,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  work_life_rating INTEGER CHECK (work_life_rating >= 1 AND work_life_rating <= 5),
  culture_rating INTEGER CHECK (culture_rating >= 1 AND culture_rating <= 5),
  growth_rating INTEGER CHECK (growth_rating >= 1 AND growth_rating <= 5),
  compensation_rating INTEGER CHECK (compensation_rating >= 1 AND compensation_rating <= 5),
  pros TEXT NOT NULL,
  cons TEXT NOT NULL,
  interview_tips TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'pending', 'rejected', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review helpful votes table
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  review_id UUID REFERENCES company_reviews(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (review_id, user_email)
);

-- Add review stats to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_company ON company_reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON company_reviews(user_email);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON company_reviews(overall_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_employment_type ON company_reviews(employment_type);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON company_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON company_reviews(status);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_review ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_user ON review_helpful_votes(user_email);

-- Function to update company review stats
CREATE OR REPLACE FUNCTION update_company_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE companies
    SET
      reviews_count = (
        SELECT COUNT(*) FROM company_reviews
        WHERE company_id = NEW.company_id AND status = 'published'
      ),
      average_rating = (
        SELECT COALESCE(AVG(overall_rating), 0) FROM company_reviews
        WHERE company_id = NEW.company_id AND status = 'published'
      )
    WHERE id = NEW.company_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE companies
    SET
      reviews_count = (
        SELECT COUNT(*) FROM company_reviews
        WHERE company_id = OLD.company_id AND status = 'published'
      ),
      average_rating = (
        SELECT COALESCE(AVG(overall_rating), 0) FROM company_reviews
        WHERE company_id = OLD.company_id AND status = 'published'
      )
    WHERE id = OLD.company_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update company stats when reviews change
DROP TRIGGER IF EXISTS trigger_update_company_review_stats ON company_reviews;
CREATE TRIGGER trigger_update_company_review_stats
AFTER INSERT OR UPDATE OR DELETE ON company_reviews
FOR EACH ROW
EXECUTE FUNCTION update_company_review_stats();

-- Function to increment helpful count
CREATE OR REPLACE FUNCTION increment_review_helpful(review_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE company_reviews
  SET helpful_count = COALESCE(helpful_count, 0) + 1
  WHERE id = review_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement helpful count
CREATE OR REPLACE FUNCTION decrement_review_helpful(review_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE company_reviews
  SET helpful_count = GREATEST(COALESCE(helpful_count, 0) - 1, 0)
  WHERE id = review_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_review_updated_at ON company_reviews;
CREATE TRIGGER trigger_review_updated_at
BEFORE UPDATE ON company_reviews
FOR EACH ROW
EXECUTE FUNCTION update_review_updated_at();
