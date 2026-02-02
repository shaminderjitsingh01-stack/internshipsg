-- =============================================
-- INTERNSHIP.SG DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  logo_url TEXT,
  website TEXT,
  careers_url TEXT,
  description TEXT,
  industry TEXT,
  size TEXT,
  location TEXT DEFAULT 'Singapore',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs/Internships table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  requirements TEXT,
  location TEXT DEFAULT 'Singapore',
  job_type TEXT DEFAULT 'internship',
  work_arrangement TEXT DEFAULT 'onsite', -- onsite, remote, hybrid
  salary_min INTEGER,
  salary_max INTEGER,
  salary_period TEXT DEFAULT 'monthly', -- monthly, hourly, total
  duration TEXT, -- e.g., "3 months", "6 months"
  start_date TEXT,
  application_url TEXT NOT NULL,
  source TEXT DEFAULT 'scraped', -- scraped, manual, api
  status TEXT DEFAULT 'active',
  views INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_posted ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_title_search ON jobs USING gin(to_tsvector('english', title));
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_jobs_slug ON jobs(slug);

-- Function to generate slug
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate company slug
CREATE OR REPLACE FUNCTION set_company_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_slug_trigger
  BEFORE INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION set_company_slug();

-- Trigger to auto-generate job slug
CREATE OR REPLACE FUNCTION set_job_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_slug(NEW.title) || '-' || substr(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_slug_trigger
  BEFORE INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_job_slug();

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Public can view active jobs" ON jobs FOR SELECT USING (status = 'active');

-- Service role full access (for scraper)
CREATE POLICY "Service role full access companies" ON companies FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access jobs" ON jobs FOR ALL USING (auth.role() = 'service_role');
