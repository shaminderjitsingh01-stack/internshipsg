import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * ============================================================================
 * Job Scraper for internship.sg
 * Uses Adzuna + Jooble APIs for reliable job data
 * ============================================================================
 *
 * PDPA COMPLIANCE: Personal data is stripped before storage
 * SOURCE: Jobs from aggregator APIs (Adzuna, Jooble) with proper licensing
 * ============================================================================
 */

let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
  }
  return supabaseInstance;
}

// ============================================================================
// Types
// ============================================================================
interface ScraperLog {
  id?: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  companies_processed: number;
  jobs_found: number;
  jobs_added: number;
  jobs_skipped: number;
  errors: { company?: string; error: string }[];
}

interface JobData {
  title: string;
  company: string | undefined;
  description: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  application_url: string;
  source: string;
}

// ============================================================================
// PDPA Compliance
// ============================================================================
const PERSONAL_DATA_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  /\b(\+65|65)?[\s-]?[689]\d{3}[\s-]?\d{4}\b/g,
  /\b[STFG]\d{7}[A-Z]\b/gi,
];

function stripPersonalData(text: string): string {
  if (!text) return text;
  let cleaned = text;
  for (const pattern of PERSONAL_DATA_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[REDACTED]');
  }
  return cleaned.trim();
}

// ============================================================================
// Database Operations
// ============================================================================
async function getOrCreateCompany(name: string | undefined, website?: string): Promise<string | null> {
  if (!name) return null;
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('name', name)
    .single();

  if (existing) return existing.id;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const { data, error } = await supabase
    .from('companies')
    .insert({ name, slug, website, location: 'Singapore' })
    .select('id')
    .single();

  if (error) {
    console.log(`Error creating company ${name}: ${error.message}`);
    return null;
  }

  return data?.id;
}

async function jobExists(title: string, companyId: string | null): Promise<boolean> {
  const supabase = getSupabase();
  const query = supabase.from('jobs').select('id').eq('title', title);
  if (companyId) query.eq('company_id', companyId);
  const { data } = await query.single();
  return !!data;
}

async function saveJob(job: JobData & { company_id: string | null }): Promise<{ added: boolean; skipped: boolean }> {
  const supabase = getSupabase();
  const exists = await jobExists(job.title, job.company_id);
  if (exists) return { added: false, skipped: true };

  const slug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80) + '-' + Math.random().toString(36).slice(2, 8);

  const { error } = await supabase.from('jobs').insert({
    title: stripPersonalData(job.title),
    slug,
    company_id: job.company_id,
    description: stripPersonalData(job.description || ''),
    location: job.location || 'Singapore',
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    application_url: job.application_url,
    is_active: true,
  });

  if (error) {
    console.log(`Error saving job: ${error.message}`);
    return { added: false, skipped: false };
  }

  return { added: true, skipped: false };
}

async function createScraperLog(entry: Omit<ScraperLog, 'id'>): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase.from('scraper_logs').insert(entry).select('id').single();
  return data?.id || null;
}

async function updateScraperLog(id: string, updates: Partial<ScraperLog>): Promise<void> {
  const supabase = getSupabase();
  await supabase.from('scraper_logs').update(updates).eq('id', id);
}

// ============================================================================
// Adzuna API
// ============================================================================
async function fetchAdzunaJobs(): Promise<JobData[]> {
  const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
  const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;

  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    console.log('Adzuna API keys not configured - skipping');
    return [];
  }

  console.log('Fetching from Adzuna API...');
  const keywords = ['intern', 'internship', 'trainee', 'graduate'];
  const jobs: JobData[] = [];

  for (const keyword of keywords) {
    for (let page = 1; page <= 3; page++) {
      try {
        const url = `https://api.adzuna.com/v1/api/jobs/sg/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=50&what=${encodeURIComponent(keyword)}`;

        const response = await fetch(url);
        if (!response.ok) {
          console.log(`Adzuna API error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const results = data.results || [];

        console.log(`  Adzuna "${keyword}" page ${page}: ${results.length} results`);

        for (const job of results) {
          const title = job.title?.toLowerCase() || '';
          if (!title.includes('intern') && !title.includes('trainee') && !title.includes('graduate')) {
            continue;
          }

          jobs.push({
            title: job.title,
            company: job.company?.display_name,
            description: job.description,
            location: job.location?.display_name || 'Singapore',
            salary_min: job.salary_min ? Math.round(job.salary_min / 12) : null,
            salary_max: job.salary_max ? Math.round(job.salary_max / 12) : null,
            application_url: job.redirect_url,
            source: 'adzuna',
          });
        }

        await new Promise(r => setTimeout(r, 500));
      } catch (err: any) {
        console.log(`Adzuna error: ${err.message}`);
      }
    }
  }

  console.log(`Adzuna: Found ${jobs.length} internships`);
  return jobs;
}

// ============================================================================
// Jooble API
// ============================================================================
async function fetchJoobleJobs(): Promise<JobData[]> {
  const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;

  if (!JOOBLE_API_KEY) {
    console.log('Jooble API key not configured - skipping');
    return [];
  }

  console.log('Fetching from Jooble API...');
  const keywords = ['internship', 'intern', 'trainee'];
  const jobs: JobData[] = [];

  for (const keyword of keywords) {
    for (let page = 1; page <= 3; page++) {
      try {
        const url = `https://jooble.org/api/${JOOBLE_API_KEY}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keywords: keyword,
            location: 'Singapore',
            page: page,
          }),
        });

        if (!response.ok) {
          console.log(`Jooble API error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const results = data.jobs || [];

        console.log(`  Jooble "${keyword}" page ${page}: ${results.length} results`);

        for (const job of results) {
          const title = job.title?.toLowerCase() || '';
          if (!title.includes('intern') && !title.includes('trainee') && !title.includes('graduate')) {
            continue;
          }

          // Parse salary if available
          let salaryMin: number | null = null;
          let salaryMax: number | null = null;
          if (job.salary) {
            const numbers = job.salary.match(/\d[\d,]*/g);
            if (numbers) {
              const parsed = numbers.map((n: string) => parseInt(n.replace(/,/g, ''), 10));
              if (parsed.length >= 2) {
                salaryMin = Math.min(...parsed);
                salaryMax = Math.max(...parsed);
              } else if (parsed.length === 1) {
                salaryMin = parsed[0];
              }
            }
          }

          jobs.push({
            title: job.title,
            company: job.company,
            description: job.snippet,
            location: job.location || 'Singapore',
            salary_min: salaryMin,
            salary_max: salaryMax,
            application_url: job.link,
            source: 'jooble',
          });
        }

        await new Promise(r => setTimeout(r, 500));
      } catch (err: any) {
        console.log(`Jooble error: ${err.message}`);
      }
    }
  }

  console.log(`Jooble: Found ${jobs.length} internships`);
  return jobs;
}

// ============================================================================
// Main Scraper Function
// ============================================================================
export async function runScraper() {
  console.log('========================================');
  console.log('Starting internship.sg job scraper (API mode)');
  console.log('========================================');

  const logId = await createScraperLog({
    started_at: new Date().toISOString(),
    status: 'running',
    companies_processed: 0,
    jobs_found: 0,
    jobs_added: 0,
    jobs_skipped: 0,
    errors: [],
  });

  const stats = { found: 0, added: 0, skipped: 0, errors: [] as { error: string }[] };

  try {
    // Fetch from both APIs in parallel
    const [adzunaJobs, joobleJobs] = await Promise.all([
      fetchAdzunaJobs(),
      fetchJoobleJobs(),
    ]);

    // Combine and dedupe by title + company
    const allJobs = [...adzunaJobs, ...joobleJobs];
    const seen = new Set<string>();
    const uniqueJobs = allJobs.filter(job => {
      const key = `${job.title}-${job.company}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    stats.found = uniqueJobs.length;
    console.log(`\nTotal unique internships: ${uniqueJobs.length}`);

    // Count unique companies
    const uniqueCompanies = new Set(uniqueJobs.map(j => j.company).filter(Boolean));

    // Save jobs
    for (const job of uniqueJobs) {
      const companyId = await getOrCreateCompany(job.company);
      const result = await saveJob({
        ...job,
        company_id: companyId,
      });

      if (result.added) {
        stats.added++;
        console.log(`  Added: ${job.title} @ ${job.company}`);
      } else if (result.skipped) {
        stats.skipped++;
      }
    }

    // Update log
    if (logId) {
      await updateScraperLog(logId, {
        completed_at: new Date().toISOString(),
        status: 'completed',
        companies_processed: uniqueCompanies.size,
        jobs_found: stats.found,
        jobs_added: stats.added,
        jobs_skipped: stats.skipped,
        errors: stats.errors,
      });
    }

    console.log('\n========================================');
    console.log('SCRAPER COMPLETE');
    console.log('========================================');
    console.log(`Jobs found:   ${stats.found}`);
    console.log(`Jobs added:   ${stats.added}`);
    console.log(`Jobs skipped: ${stats.skipped}`);
    console.log('========================================');

    return {
      success: true,
      jobsScraped: stats.found,
      newJobs: stats.added,
      companiesUpdated: uniqueCompanies.size,
      jobsAdded: stats.added,
      jobsSkipped: stats.skipped,
    };
  } catch (err: any) {
    console.log(`Fatal error: ${err.message}`);
    stats.errors.push({ error: err.message });

    if (logId) {
      await updateScraperLog(logId, {
        completed_at: new Date().toISOString(),
        status: 'failed',
        errors: [{ error: err.message }],
      });
    }

    throw err;
  }
}

// Legacy exports for compatibility
export async function getCompanies() {
  const supabase = getSupabase();
  const { data } = await supabase.from('companies').select('*');
  return data || [];
}

export interface ScrapedJob {
  title: string;
  description: string;
  requirements: string[];
  location: string;
  salary_min?: number;
  salary_max?: number;
  application_url: string;
  company_name: string;
}

export function filterInternshipsOnly(jobs: ScrapedJob[]): ScrapedJob[] {
  return jobs;
}

export async function insertJobs(jobs: ScrapedJob[]) {
  return { added: 0, skipped: jobs.length };
}

export async function scrapeCompanyJobs(): Promise<ScrapedJob[]> {
  return [];
}
