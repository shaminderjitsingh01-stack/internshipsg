-- =====================================================
-- MIGRATION: Interview Prep Feature
-- =====================================================

-- Create interview_prep_questions table (question bank)
CREATE TABLE IF NOT EXISTS interview_prep_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- behavioral, technical, case_study, situational
  difficulty VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
  company VARCHAR(255), -- optional: company-specific questions
  tags TEXT[], -- array of tags for filtering
  tips TEXT, -- tips for answering
  sample_answer TEXT, -- example good answer
  is_featured BOOLEAN DEFAULT false,
  is_user_submitted BOOLEAN DEFAULT false,
  submitted_by VARCHAR(255), -- email of user who submitted
  approved BOOLEAN DEFAULT true, -- moderation flag
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create interview_prep_sessions table (practice sessions)
CREATE TABLE IF NOT EXISTS interview_prep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  session_type VARCHAR(50) DEFAULT 'practice', -- practice, mock, timed
  category VARCHAR(50), -- category focus
  duration_minutes INTEGER,
  questions_answered INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  score INTEGER, -- optional score if applicable
  notes TEXT, -- user notes during session
  recording_url TEXT, -- optional recording
  status VARCHAR(20) DEFAULT 'completed', -- in_progress, completed, abandoned
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create interview_prep_user_data table (user progress and stats)
CREATE TABLE IF NOT EXISTS interview_prep_user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL UNIQUE,
  total_sessions INTEGER DEFAULT 0,
  total_questions_practiced INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_practice_date DATE,
  favorite_category VARCHAR(50),
  xp_earned INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create interview_prep_bookmarks table (saved questions)
CREATE TABLE IF NOT EXISTS interview_prep_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  question_id UUID NOT NULL REFERENCES interview_prep_questions(id) ON DELETE CASCADE,
  notes TEXT, -- user notes on the question
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_email, question_id)
);

-- Create interview_prep_answers table (user answers to questions)
CREATE TABLE IF NOT EXISTS interview_prep_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_prep_sessions(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  question_id UUID REFERENCES interview_prep_questions(id) ON DELETE SET NULL,
  answer_text TEXT,
  recording_url TEXT,
  ai_feedback TEXT,
  score INTEGER, -- 1-100
  time_taken_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interview_prep_questions_category ON interview_prep_questions(category);
CREATE INDEX IF NOT EXISTS idx_interview_prep_questions_company ON interview_prep_questions(company);
CREATE INDEX IF NOT EXISTS idx_interview_prep_questions_difficulty ON interview_prep_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_interview_prep_questions_featured ON interview_prep_questions(is_featured);
CREATE INDEX IF NOT EXISTS idx_interview_prep_sessions_email ON interview_prep_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_interview_prep_user_data_email ON interview_prep_user_data(user_email);
CREATE INDEX IF NOT EXISTS idx_interview_prep_bookmarks_email ON interview_prep_bookmarks(user_email);
CREATE INDEX IF NOT EXISTS idx_interview_prep_answers_session ON interview_prep_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_prep_answers_email ON interview_prep_answers(user_email);

-- Enable Row Level Security
ALTER TABLE interview_prep_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_prep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_prep_user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_prep_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_prep_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interview_prep_questions
CREATE POLICY "Anyone can read approved questions"
  ON interview_prep_questions
  FOR SELECT
  USING (approved = true);

CREATE POLICY "Users can insert questions"
  ON interview_prep_questions
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for interview_prep_sessions
CREATE POLICY "Users can read own sessions"
  ON interview_prep_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own sessions"
  ON interview_prep_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own sessions"
  ON interview_prep_sessions
  FOR UPDATE
  USING (true);

-- RLS Policies for interview_prep_user_data
CREATE POLICY "Users can read own data"
  ON interview_prep_user_data
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own data"
  ON interview_prep_user_data
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own data"
  ON interview_prep_user_data
  FOR UPDATE
  USING (true);

-- RLS Policies for interview_prep_bookmarks
CREATE POLICY "Users can read own bookmarks"
  ON interview_prep_bookmarks
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own bookmarks"
  ON interview_prep_bookmarks
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own bookmarks"
  ON interview_prep_bookmarks
  FOR DELETE
  USING (true);

-- RLS Policies for interview_prep_answers
CREATE POLICY "Users can read own answers"
  ON interview_prep_answers
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own answers"
  ON interview_prep_answers
  FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON interview_prep_questions TO authenticated;
GRANT ALL ON interview_prep_questions TO anon;
GRANT ALL ON interview_prep_sessions TO authenticated;
GRANT ALL ON interview_prep_sessions TO anon;
GRANT ALL ON interview_prep_user_data TO authenticated;
GRANT ALL ON interview_prep_user_data TO anon;
GRANT ALL ON interview_prep_bookmarks TO authenticated;
GRANT ALL ON interview_prep_bookmarks TO anon;
GRANT ALL ON interview_prep_answers TO authenticated;
GRANT ALL ON interview_prep_answers TO anon;

-- Insert sample interview questions
INSERT INTO interview_prep_questions (question, category, difficulty, tips, sample_answer, is_featured, tags) VALUES
-- Behavioral Questions
('Tell me about yourself', 'behavioral', 'easy', 'Focus on your professional journey, key achievements, and what makes you a good fit for this role. Keep it to 2-3 minutes.', 'I am a [role] with [X] years of experience in [industry]. I started my career at [company] where I [key achievement]. Most recently, I have been working on [recent project/responsibility] which has helped me develop [relevant skill]. I am excited about this opportunity because [connection to role].', true, ARRAY['common', 'introduction', 'opener']),

('Why do you want this job?', 'behavioral', 'easy', 'Research the company beforehand. Connect your skills and goals with the role requirements and company mission.', 'I am drawn to this role because it combines my passion for [area] with my expertise in [skill]. Your company''s commitment to [company value/mission] aligns with my professional values. I am particularly excited about [specific aspect of role] and believe my experience in [relevant experience] would allow me to make meaningful contributions.', true, ARRAY['common', 'motivation', 'company-fit']),

('What are your strengths and weaknesses?', 'behavioral', 'medium', 'Choose genuine strengths relevant to the role. For weaknesses, pick something real but show how you are working to improve.', 'My key strength is [strength] - for example, [specific example]. This has helped me [achievement]. As for areas I am developing, I used to struggle with [weakness], but I have been actively working on it by [improvement action]. Recently, this effort paid off when [positive outcome].', true, ARRAY['common', 'self-awareness', 'honesty']),

('Describe a challenging situation you faced at work', 'behavioral', 'medium', 'Use the STAR method: Situation, Task, Action, Result. Focus on your problem-solving abilities.', 'At my previous role, [Situation: describe the challenge]. My task was to [Task: your responsibility]. I approached this by [Action: specific steps you took]. As a result, [Result: quantifiable outcome if possible]. This experience taught me [lesson learned].', true, ARRAY['common', 'problem-solving', 'star-method']),

('Where do you see yourself in 5 years?', 'behavioral', 'easy', 'Show ambition while being realistic. Align your goals with potential growth at the company.', 'In five years, I see myself having grown significantly in [area]. I hope to have taken on more responsibilities, potentially [specific goal]. I am also committed to continuous learning and would love to [development goal]. Most importantly, I want to be in a position where I am making meaningful contributions to [company/industry goal].', true, ARRAY['common', 'career-goals', 'ambition']),

('Tell me about a time you worked in a team', 'behavioral', 'medium', 'Highlight collaboration, communication, and your specific contribution to the team success.', NULL, false, ARRAY['teamwork', 'collaboration', 'star-method']),

('How do you handle stress and pressure?', 'behavioral', 'medium', 'Give specific strategies you use and provide an example of handling pressure effectively.', NULL, false, ARRAY['stress-management', 'resilience', 'self-management']),

('Describe a time you showed leadership', 'behavioral', 'medium', 'Leadership can be formal or informal. Focus on influence, initiative, and positive outcomes.', NULL, false, ARRAY['leadership', 'initiative', 'influence']),

('Tell me about a time you failed', 'behavioral', 'hard', 'Be honest about the failure, but focus on what you learned and how you applied that lesson.', NULL, false, ARRAY['failure', 'learning', 'growth-mindset']),

('Why are you leaving your current job?', 'behavioral', 'medium', 'Stay positive - focus on seeking growth opportunities rather than criticizing current employer.', NULL, false, ARRAY['career-change', 'motivation', 'professionalism']),

-- Technical Questions
('Walk me through a project you are proud of', 'technical', 'medium', 'Structure your response: context, your role, challenges, solutions, and impact.', NULL, true, ARRAY['projects', 'technical-skills', 'achievement']),

('How do you stay updated with industry trends?', 'technical', 'easy', 'Mention specific resources: publications, podcasts, courses, communities, or conferences.', NULL, false, ARRAY['learning', 'industry-knowledge', 'continuous-improvement']),

('Describe your problem-solving approach', 'technical', 'medium', 'Walk through your methodology step by step with a real example.', NULL, false, ARRAY['problem-solving', 'methodology', 'analytical-thinking']),

-- Situational Questions
('What would you do if you disagreed with your manager?', 'situational', 'hard', 'Show respect for authority while demonstrating you can voice concerns professionally.', NULL, true, ARRAY['conflict-resolution', 'communication', 'professionalism']),

('How would you handle a difficult client?', 'situational', 'medium', 'Emphasize empathy, active listening, and finding solutions.', NULL, false, ARRAY['client-relations', 'conflict-resolution', 'communication']),

('What would you do if you had competing deadlines?', 'situational', 'medium', 'Discuss prioritization, communication with stakeholders, and time management.', NULL, false, ARRAY['time-management', 'prioritization', 'organization']),

-- Case Study Questions
('How would you improve our product/service?', 'case_study', 'hard', 'Research the company beforehand. Structure your answer with analysis, proposed solutions, and expected impact.', NULL, true, ARRAY['product-thinking', 'analytical', 'creativity']),

('Walk me through how you would solve this business problem', 'case_study', 'hard', 'Use a structured framework, ask clarifying questions, and think out loud.', NULL, false, ARRAY['business-acumen', 'analytical', 'structured-thinking'])

ON CONFLICT DO NOTHING;
