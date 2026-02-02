import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

// Fetch jobs from a company's career page (example structure)
export async function scrapeCompanyJobs(companyName: string, careersUrl: string): Promise<ScrapedJob[]> {
  // This is a placeholder - in production you'd use:
  // - Puppeteer/Playwright for JavaScript-heavy sites
  // - Cheerio for static HTML parsing
  // - Official APIs where available

  console.log(`Scraping jobs from ${companyName}: ${careersUrl}`);

  // For now, return empty - we'll implement specific scrapers
  return [];
}

// Insert scraped jobs into database
export async function insertJobs(jobs: ScrapedJob[]) {
  const supabase = getSupabase();

  for (const job of jobs) {
    // Get company ID
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('name', job.company_name)
      .single();

    if (!company) {
      console.log(`Company not found: ${job.company_name}`);
      continue;
    }

    // Check if job already exists (by title and company)
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('id')
      .eq('company_id', company.id)
      .eq('title', job.title)
      .single();

    if (existingJob) {
      console.log(`Job already exists: ${job.title} at ${job.company_name}`);
      continue;
    }

    // Insert new job
    const { error } = await supabase.from('jobs').insert({
      company_id: company.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      location: job.location || 'Singapore',
      type: 'Internship',
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      industry: null, // Will be filled from company
      is_featured: false,
      is_active: true,
    });

    if (error) {
      console.error(`Error inserting job: ${error.message}`);
    } else {
      console.log(`Inserted job: ${job.title} at ${job.company_name}`);
    }
  }
}

// Get all companies from database
export async function getCompanies() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('companies')
    .select('*');

  if (error) {
    console.error('Error fetching companies:', error);
    return [];
  }

  return data || [];
}

// Main scraper function
export async function runScraper() {
  console.log('Starting job scraper...');
  const startTime = Date.now();
  const supabase = getSupabase();

  const companies = await getCompanies();
  console.log(`Found ${companies.length} companies`);

  // Get current job count
  const { count: beforeCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true });

  // For now, we'll add sample internships manually
  // In production, you'd scrape each company's careers page
  // TODO: Implement actual scrapers for company career pages

  const sampleJobs: ScrapedJob[] = [
    // Placeholder - scrapers will be added for each company
  ];

  // Insert all sample jobs
  await insertJobs(sampleJobs);

  // Get new job count
  const { count: afterCount } = await getSupabase()
    .from('jobs')
    .select('*', { count: 'exact', head: true });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Scraper completed in ${duration}s`);

  return {
    success: true,
    jobsScraped: sampleJobs.length,
    newJobs: (afterCount || 0) - (beforeCount || 0),
    companiesUpdated: companies.length,
    totalJobs: afterCount || 0,
  };
}
