import { supabase } from './supabase';

// Types
export interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
  created_at: string;
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  description?: string;
  requirements?: string[];
  location: string;
  work_arrangement?: 'onsite' | 'remote' | 'hybrid';
  duration?: string;
  salary_min?: number;
  salary_max?: number;
  application_url: string;
  company_id: string;
  company?: Company;
  industry?: string;
  is_active: boolean;
  posted_at: string;
  created_at: string;
}

// Fetch all jobs with company info
export async function getJobsFromDB(search?: string, industry?: string) {
  let query = supabase
    .from('jobs')
    .select(`
      *,
      company:companies(*)
    `)
    .or('is_active.eq.true,status.eq.active')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (industry) {
    query = query.eq('industry', industry);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }

  return data || [];
}

// Fetch all companies
export async function getCompaniesFromDB(search?: string, industry?: string) {
  let query = supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true });

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (industry) {
    query = query.eq('industry', industry);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching companies:', error);
    return [];
  }

  return data || [];
}

// Fetch a single job by ID
export async function getJobById(id: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      company:companies(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching job:', error);
    return null;
  }

  return data;
}

// Fetch a single company by ID
export async function getCompanyById(id: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching company:', error);
    return null;
  }

  return data;
}

// Fetch jobs by company ID
export async function getJobsByCompanyId(companyId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyId)
    .or('is_active.eq.true,status.eq.active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching company jobs:', error);
    return [];
  }

  return data || [];
}

// Get stats (job count, company count)
export async function getStats() {
  const [jobsResult, companiesResult] = await Promise.all([
    supabase.from('jobs').select('id', { count: 'exact', head: true }).or('is_active.eq.true,status.eq.active'),
    supabase.from('companies').select('id', { count: 'exact', head: true }),
  ]);

  return {
    jobs: jobsResult.count || 0,
    companies: companiesResult.count || 0,
  };
}

// Get unique industries
export async function getIndustries() {
  const { data, error } = await supabase
    .from('companies')
    .select('industry')
    .not('industry', 'is', null);

  if (error) {
    console.error('Error fetching industries:', error);
    return [];
  }

  const industries = [...new Set(data?.map((c) => c.industry))].filter(Boolean);
  return industries.sort();
}

// Save a job (for logged-in users)
export async function saveJob(userId: string, jobId: string) {
  const { error } = await supabase.from('saved_jobs').insert({
    user_id: userId,
    job_id: jobId,
  });

  if (error) {
    console.error('Error saving job:', error);
    return false;
  }

  return true;
}

// Unsave a job
export async function unsaveJob(userId: string, jobId: string) {
  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('user_id', userId)
    .eq('job_id', jobId);

  if (error) {
    console.error('Error unsaving job:', error);
    return false;
  }

  return true;
}

// Get saved jobs for a user
export async function getSavedJobs(userId: string) {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select(`
      *,
      job:jobs(*, company:companies(*))
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching saved jobs:', error);
    return [];
  }

  return data?.map((s) => s.job) || [];
}

// Apply to a job
export async function applyToJob(userId: string, jobId: string, resumeUrl?: string, coverLetter?: string) {
  const { error } = await supabase.from('applications').insert({
    user_id: userId,
    job_id: jobId,
    resume_url: resumeUrl,
    cover_letter: coverLetter,
    status: 'pending',
  });

  if (error) {
    console.error('Error applying to job:', error);
    return false;
  }

  return true;
}

// Get user's applications
export async function getApplications(userId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job:jobs(*, company:companies(*))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }

  return data || [];
}

// Fetch a single job by slug or ID
export async function getJobBySlug(slugOrId: string): Promise<Job | null> {
  // Check if it's a UUID (ID) or a slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      company:companies(*)
    `)
    .eq(isUUID ? 'id' : 'slug', slugOrId)
    .single();

  if (error) {
    console.error('Error fetching job by slug/id:', error);
    return null;
  }

  return data;
}

// Fetch a single company by slug or ID
export async function getCompanyBySlug(slugOrId: string): Promise<Company | null> {
  // Check if it's a UUID (ID) or a slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq(isUUID ? 'id' : 'slug', slugOrId)
    .single();

  if (error) {
    console.error('Error fetching company by slug/id:', error);
    return null;
  }

  return data;
}

// Get job count by company
export async function getJobCountByCompany(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('jobs')
    .select('company_id')
    .or('is_active.eq.true,status.eq.active');

  if (error) {
    console.error('Error fetching job counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  data?.forEach((job) => {
    counts[job.company_id] = (counts[job.company_id] || 0) + 1;
  });

  return counts;
}
