-- Education & Experience Tables Migration
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. CREATE EDUCATION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  school VARCHAR(255) NOT NULL,
  degree VARCHAR(100), -- e.g., "Bachelor's", "Diploma", "Master's"
  field_of_study VARCHAR(255), -- e.g., "Computer Science", "Business"
  start_date DATE,
  end_date DATE, -- NULL if current
  is_current BOOLEAN DEFAULT false,
  grade VARCHAR(50), -- e.g., "First Class Honours", "GPA 4.0"
  activities TEXT, -- Clubs, societies, achievements
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for education
CREATE INDEX IF NOT EXISTS idx_education_user ON user_education(user_email);
CREATE INDEX IF NOT EXISTS idx_education_order ON user_education(user_email, display_order);

-- =====================================================
-- 2. CREATE EXPERIENCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL, -- Job title
  location VARCHAR(255),
  employment_type VARCHAR(50), -- 'full-time', 'part-time', 'internship', 'contract', 'freelance'
  start_date DATE,
  end_date DATE, -- NULL if current
  is_current BOOLEAN DEFAULT false,
  description TEXT, -- Job responsibilities, achievements
  skills_used TEXT[], -- Skills applied in this role
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for experience
CREATE INDEX IF NOT EXISTS idx_experience_user ON user_experience(user_email);
CREATE INDEX IF NOT EXISTS idx_experience_order ON user_experience(user_email, display_order);

-- =====================================================
-- 3. CREATE PROJECTS TABLE (Optional but nice to have)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500), -- Link to project
  image_url VARCHAR(500), -- Project thumbnail
  technologies TEXT[], -- Technologies used
  start_date DATE,
  end_date DATE,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_user ON user_projects(user_email);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON user_projects(user_email, is_featured);

-- =====================================================
-- 4. CREATE CERTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255),
  issue_date DATE,
  expiry_date DATE, -- NULL if no expiry
  credential_id VARCHAR(255),
  credential_url VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for certifications
CREATE INDEX IF NOT EXISTS idx_certifications_user ON user_certifications(user_email);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
