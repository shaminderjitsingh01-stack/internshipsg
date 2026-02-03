-- ============================================================================
-- Scraper Management Tables Migration
-- ============================================================================

-- Table: scraper_companies
-- Stores companies to be scraped with their configuration and status
CREATE TABLE IF NOT EXISTS scraper_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  careers_url TEXT NOT NULL,
  industry TEXT,
  size TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  last_jobs_found INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: scraper_logs
-- Stores history of scraper runs with statistics and errors
CREATE TABLE IF NOT EXISTS scraper_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  companies_processed INTEGER DEFAULT 0,
  jobs_found INTEGER DEFAULT 0,
  jobs_added INTEGER DEFAULT 0,
  jobs_skipped INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_scraper_companies_enabled ON scraper_companies(is_enabled);
CREATE INDEX IF NOT EXISTS idx_scraper_companies_name ON scraper_companies(name);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_started ON scraper_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_status ON scraper_logs(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for scraper_companies
DROP TRIGGER IF EXISTS update_scraper_companies_updated_at ON scraper_companies;
CREATE TRIGGER update_scraper_companies_updated_at
    BEFORE UPDATE ON scraper_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Seed initial companies from companies.json
-- ============================================================================
INSERT INTO scraper_companies (name, logo_url, website, careers_url, industry, size, is_enabled)
VALUES
  ('Google', 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png', 'https://www.google.com', 'https://www.google.com/about/careers/applications/jobs/results/?location=Singapore&target_level=INTERN_AND_APPRENTICE', 'Technology', '10000+', true),
  ('Shopee', 'https://careers.shopee.sg/favicon.ico', 'https://www.shopee.sg', 'https://careers.shopee.sg/jobs?country_id=1&employment_type=2', 'E-commerce', '10000+', true),
  ('Grab', 'https://grab.careers/favicon.ico', 'https://www.grab.com', 'https://grab.careers/jobs/?search=intern&location=singapore', 'Technology', '5000+', true),
  ('TikTok', 'https://sf-static.tiktokcdn.com/obj/eden-sg/uhtyvueh7nulogpoguhm/tiktok-icon2.png', 'https://www.tiktok.com', 'https://careers.tiktok.com/position?keywords=intern&location=CT_163', 'Technology', '10000+', true),
  ('ByteDance', 'https://jobs.bytedance.com/favicon.ico', 'https://www.bytedance.com', 'https://jobs.bytedance.com/en/position?keywords=intern&location=CT_163', 'Technology', '10000+', true),
  ('DBS Bank', 'https://www.dbs.com.sg/iwov-resources/media/images/dbs-logo.png', 'https://www.dbs.com.sg', 'https://www.dbs.com/careers/internships', 'Banking', '10000+', true),
  ('OCBC Bank', 'https://www.ocbc.com/favicon.ico', 'https://www.ocbc.com', 'https://www.ocbc.com/group/careers', 'Banking', '10000+', true),
  ('GovTech', 'https://www.tech.gov.sg/images/ogp.png', 'https://www.tech.gov.sg', 'https://www.tech.gov.sg/careers/students-and-graduates/internships/', 'Government', '1000+', true),
  ('Stripe', 'https://stripe.com/favicon.ico', 'https://stripe.com', 'https://stripe.com/jobs/search?office_locations=Asia+Pacific--Singapore', 'Fintech', '5000+', true),
  ('Meta', 'https://www.metacareers.com/favicon.ico', 'https://www.meta.com', 'https://www.metacareers.com/jobs?offices[0]=Singapore&roles[0]=Intern', 'Technology', '10000+', true),
  ('Visa', 'https://www.visa.com.sg/favicon.ico', 'https://www.visa.com.sg', 'https://www.visa.com.sg/careers.html', 'Fintech', '10000+', true),
  ('JPMorgan Chase', 'https://careers.jpmorgan.com/favicon.ico', 'https://www.jpmorganchase.com', 'https://careers.jpmorgan.com/us/en/students/programs?search=&tags=location__AsiaPacific__Singapore', 'Banking', '10000+', true),
  ('Goldman Sachs', 'https://www.goldmansachs.com/favicon.ico', 'https://www.goldmansachs.com', 'https://higher.gs.com/internships', 'Banking', '10000+', true),
  ('Deloitte', 'https://www.deloitte.com/favicon.ico', 'https://www.deloitte.com/sg', 'https://apply.deloitte.com/careers/SearchJobs/?listFilterMode=1&country=3316', 'Consulting', '10000+', true),
  ('PwC', 'https://www.pwc.com/favicon.ico', 'https://www.pwc.com/sg', 'https://www.pwc.com/sg/en/careers/students.html', 'Consulting', '10000+', true),
  ('EY', 'https://www.ey.com/favicon.ico', 'https://www.ey.com/sg', 'https://www.ey.com/en_sg/careers/students', 'Consulting', '10000+', true),
  ('KPMG', 'https://www.kpmg.com/favicon.ico', 'https://www.kpmg.com.sg', 'https://www.kpmg.com.sg/en/home/careers.html', 'Consulting', '10000+', true),
  ('Accenture', 'https://www.accenture.com/favicon.ico', 'https://www.accenture.com/sg-en', 'https://www.accenture.com/sg-en/careers/jobsearch?jk=internship', 'Consulting', '10000+', true),
  ('McKinsey', 'https://www.mckinsey.com/favicon.ico', 'https://www.mckinsey.com', 'https://www.mckinsey.com/careers/search-jobs?locations=Singapore', 'Consulting', '10000+', true),
  ('BCG', 'https://www.bcg.com/favicon.ico', 'https://www.bcg.com', 'https://careers.bcg.com/locations/singapore', 'Consulting', '10000+', true),
  ('Lazada', 'https://www.lazada.sg/favicon.ico', 'https://www.lazada.sg', 'https://www.lazada.com/en/careers/', 'E-commerce', '5000+', true),
  ('Sea Group', 'https://www.sea.com/favicon.ico', 'https://www.sea.com', 'https://www.sea.com/careers', 'Technology', '10000+', true),
  ('Procter & Gamble', 'https://www.pg.com/favicon.ico', 'https://www.pg.com', 'https://www.pgcareers.com/search-jobs?k=intern&l=singapore', 'FMCG', '10000+', true),
  ('Unilever', 'https://www.unilever.com/favicon.ico', 'https://www.unilever.com.sg', 'https://careers.unilever.com/location/singapore-jobs/34155/4765951/2', 'FMCG', '10000+', true),
  ('Dyson', 'https://www.dyson.com.sg/favicon.ico', 'https://www.dyson.com.sg', 'https://careers.dyson.com/en-gb/search-results?keywords=intern&location=singapore', 'Technology', '5000+', true),
  ('Micron', 'https://www.micron.com/favicon.ico', 'https://www.micron.com', 'https://careers.micron.com/careers?location=Singapore', 'Semiconductor', '10000+', true),
  ('ShopBack', 'https://www.shopback.sg/favicon.ico', 'https://www.shopback.sg', 'https://careers.shopback.com/?search=intern', 'E-commerce', '1000+', true),
  ('Carousell', 'https://www.carousell.sg/favicon.ico', 'https://www.carousell.sg', 'https://careers.carousell.com/', 'E-commerce', '500+', true),
  ('Razer', 'https://www.razer.com/favicon.ico', 'https://www.razer.com', 'https://careers.razer.com/', 'Technology', '1000+', true),
  ('Singapore Airlines', 'https://www.singaporeair.com/favicon.ico', 'https://www.singaporeair.com', 'https://www.singaporeair.com/en_UK/sg/careers/', 'Aviation', '10000+', true)
ON CONFLICT DO NOTHING;
