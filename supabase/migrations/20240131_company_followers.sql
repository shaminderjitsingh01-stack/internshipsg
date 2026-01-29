-- Company followers table
CREATE TABLE IF NOT EXISTS company_followers (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (company_id, user_email)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_company_followers_company ON company_followers(company_id);
CREATE INDEX IF NOT EXISTS idx_company_followers_user ON company_followers(user_email);

-- Add follower count to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS jobs_count INTEGER DEFAULT 0;

-- Function to increment company followers count
CREATE OR REPLACE FUNCTION increment_company_followers(company_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE companies
  SET followers_count = COALESCE(followers_count, 0) + 1
  WHERE id = company_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement company followers count
CREATE OR REPLACE FUNCTION decrement_company_followers(company_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE companies
  SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
  WHERE id = company_id_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update jobs_count when jobs are added/removed
CREATE OR REPLACE FUNCTION update_company_jobs_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE companies
    SET jobs_count = COALESCE(jobs_count, 0) + 1
    WHERE id = NEW.company_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE companies
    SET jobs_count = GREATEST(COALESCE(jobs_count, 0) - 1, 0)
    WHERE id = OLD.company_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_company_jobs_count ON jobs;
CREATE TRIGGER trigger_update_company_jobs_count
AFTER INSERT OR DELETE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_company_jobs_count();
