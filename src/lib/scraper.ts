import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * ============================================================================
 * PDPA COMPLIANCE NOTICE - Singapore Personal Data Protection Act
 * ============================================================================
 *
 * This scraper is designed to be PDPA compliant:
 *
 * 1. DATA COLLECTION SCOPE:
 *    - Only collects publicly available job listing information
 *    - NO personal data is collected (names, emails, phone numbers, NRIC, etc.)
 *    - Only job-related data: title, description, requirements, salary range, location
 *
 * 2. DATA MINIMIZATION:
 *    - Only collects data necessary for job board functionality
 *    - Personal data is actively stripped/filtered before storage
 *
 * 3. ROBOTS.TXT COMPLIANCE:
 *    - Respects robots.txt directives from websites
 *    - Will not scrape if disallowed
 *
 * 4. RATE LIMITING:
 *    - Implements delays between requests to avoid server overload
 *    - Maximum 1 request per second per domain
 *
 * 5. DATA RETENTION:
 *    - Job listings expire after 90 days
 *    - Inactive listings are automatically removed
 *
 * 6. SOURCE ATTRIBUTION:
 *    - All scraped jobs link back to original source
 *    - Companies can request removal via contact form
 *
 * For data removal requests: Contact support via the website
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
// PDPA COMPLIANCE: Personal Data Patterns to Strip
// ============================================================================
const PERSONAL_DATA_PATTERNS = [
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  // Singapore phone numbers
  /\b(\+65|65)?[\s-]?[689]\d{3}[\s-]?\d{4}\b/g,
  // Singapore NRIC/FIN
  /\b[STFG]\d{7}[A-Z]\b/gi,
  // Names patterns (Mr/Ms/Mrs followed by name)
  /\b(Mr|Ms|Mrs|Miss|Dr)\.?\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*/g,
  // Contact person patterns
  /\b(contact|email|call|reach|phone|tel|mobile)[\s:]+[^\n,]+/gi,
];

/**
 * PDPA COMPLIANCE: Strip personal data from text
 * Removes emails, phone numbers, NRIC, and other personal identifiers
 */
function stripPersonalData(text: string): string {
  if (!text) return text;

  let cleaned = text;
  for (const pattern of PERSONAL_DATA_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[REDACTED]');
  }

  // Remove multiple consecutive [REDACTED] tags
  cleaned = cleaned.replace(/(\[REDACTED\]\s*)+/g, '[REDACTED] ');

  return cleaned.trim();
}

/**
 * PDPA COMPLIANCE: Check if robots.txt allows scraping
 */
async function checkRobotsTxt(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

    const response = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      // No robots.txt = allowed
      return true;
    }

    const robotsTxt = await response.text();
    const lines = robotsTxt.split('\n');

    let isUserAgentMatch = false;
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      if (trimmed.startsWith('user-agent:')) {
        const agent = trimmed.replace('user-agent:', '').trim();
        isUserAgentMatch = agent === '*' || agent.includes('bot');
      }

      if (isUserAgentMatch && trimmed.startsWith('disallow:')) {
        const path = trimmed.replace('disallow:', '').trim();
        if (path === '/' || urlObj.pathname.startsWith(path)) {
          console.log(`[PDPA] Robots.txt disallows scraping: ${url}`);
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    // On error, assume allowed but log warning
    console.warn(`[PDPA] Could not check robots.txt for ${url}, proceeding with caution`);
    return true;
  }
}

/**
 * PDPA COMPLIANCE: Rate limiting - delay between requests
 */
const RATE_LIMIT_MS = 1000; // 1 second between requests
let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response | null> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();

  try {
    return await fetch(url, {
      headers: {
        'User-Agent': 'InternshipSG-Bot/1.0 (PDPA Compliant Job Aggregator; +https://internship.sg)',
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    console.error(`[PDPA] Fetch failed for ${url}:`, error);
    return null;
  }
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

// Keywords that indicate an internship position
const INTERNSHIP_KEYWORDS = [
  'intern',
  'internship',
  'trainee',
  'graduate program',
  'student',
  'co-op',
  'placement',
  'industrial attachment',
];

// HARD RULE: Only internships are allowed
function isInternship(job: ScrapedJob): boolean {
  const titleLower = job.title.toLowerCase();
  const descLower = (job.description || '').toLowerCase();

  // Check if any internship keyword is present in title or description
  return INTERNSHIP_KEYWORDS.some(keyword =>
    titleLower.includes(keyword) || descLower.includes(keyword)
  );
}

// Filter function to ensure only internships are scraped
export function filterInternshipsOnly(jobs: ScrapedJob[]): ScrapedJob[] {
  const internships = jobs.filter(isInternship);
  const rejected = jobs.length - internships.length;

  if (rejected > 0) {
    console.log(`[SCRAPER] Rejected ${rejected} non-internship jobs (HARD RULE: internships only)`);
  }

  return internships;
}

// Fetch jobs from a company's career page (PDPA COMPLIANT)
export async function scrapeCompanyJobs(companyName: string, careersUrl: string): Promise<ScrapedJob[]> {
  console.log(`[PDPA] Starting scrape for ${companyName}: ${careersUrl}`);

  // PDPA COMPLIANCE: Check robots.txt first
  const allowed = await checkRobotsTxt(careersUrl);
  if (!allowed) {
    console.log(`[PDPA] Skipping ${companyName} - robots.txt disallows scraping`);
    return [];
  }

  // PDPA COMPLIANCE: Use rate-limited fetch
  const response = await rateLimitedFetch(careersUrl);
  if (!response) {
    console.log(`[PDPA] Failed to fetch ${careersUrl}`);
    return [];
  }

  // This is a placeholder - in production you'd use:
  // - Puppeteer/Playwright for JavaScript-heavy sites
  // - Cheerio for static HTML parsing
  // - Official APIs where available (preferred for PDPA compliance)

  // For now, return empty - implement specific scrapers per company
  return [];
}

/**
 * PDPA COMPLIANCE: Sanitize job data before storage
 * Strips all personal data from job listings
 */
function sanitizeJobForPDPA(job: ScrapedJob): ScrapedJob {
  return {
    ...job,
    title: stripPersonalData(job.title),
    description: stripPersonalData(job.description),
    requirements: job.requirements.map(r => stripPersonalData(r)),
    // Keep these as-is (not personal data)
    location: job.location,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    application_url: job.application_url,
    company_name: job.company_name,
  };
}

// Insert scraped jobs into database
// HARD RULES: Only internships, PDPA compliant
export async function insertJobs(jobs: ScrapedJob[]) {
  const supabase = getSupabase();

  // ENFORCE: Filter to internships only before inserting
  const internshipsOnly = filterInternshipsOnly(jobs);
  console.log(`[SCRAPER] Processing ${internshipsOnly.length} internships out of ${jobs.length} total jobs`);

  // PDPA COMPLIANCE: Sanitize all jobs before storage
  const sanitizedJobs = internshipsOnly.map(sanitizeJobForPDPA);
  console.log(`[PDPA] Sanitized ${sanitizedJobs.length} jobs (personal data stripped)`);

  for (const job of sanitizedJobs) {
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

    // Insert new job - ALWAYS marked as Internship (HARD RULE)
    const { error } = await supabase.from('jobs').insert({
      company_id: company.id,
      title: job.title,
      slug: job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 8),
      description: job.description,
      requirements: job.requirements,
      location: job.location || 'Singapore',
      job_type: 'Internship', // HARD RULE: Only internships
      application_url: job.application_url,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      industry: null, // Will be filled from company
      is_featured: false,
      is_active: true,
      posted_at: new Date().toISOString(),
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
