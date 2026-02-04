/**
 * Job API Integration for internship.sg
 * Fetches internship listings from Adzuna and Jooble APIs
 *
 * PDPA COMPLIANCE: This module adheres to Singapore's Personal Data Protection Act
 * - Personal data (emails, phones, NRIC) is stripped before storage
 * - Only publicly available job listing data is collected
 * - Rate limiting respects API providers
 * - Source attribution maintained for all jobs
 *
 * Usage:
 *   npx ts-node scraper/job-apis.ts              # Full sync
 *   npx ts-node scraper/job-apis.ts --test       # Test mode (1 page)
 */

import { createClient } from '@supabase/supabase-js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// API Keys (add these to your .env.local)
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Stats tracking
const stats = {
  adzunaJobs: 0,
  joobleJobs: 0,
  jobsAdded: 0,
  jobsSkipped: 0,
  pdpaSanitized: 0,
  errors: [] as string[],
};

// Delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string, companyName?: string): string {
  const base = `${title}${companyName ? `-at-${companyName}` : ''}`;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

/**
 * Get or create company by name
 */
async function getOrCreateCompany(name: string, website?: string): Promise<string | null> {
  if (!name) return null;

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Check if exists
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('name', name)
    .single();

  if (existing) return existing.id;

  // Create new company
  const { data: created, error } = await supabase
    .from('companies')
    .insert({
      name,
      slug,
      website: website || null,
      location: 'Singapore',
      industry: 'Various',
    })
    .select('id')
    .single();

  if (error) {
    console.error(`  ❌ Error creating company ${name}: ${error.message}`);
    return null;
  }

  return created?.id || null;
}

/**
 * Check if job already exists (by title + company)
 */
async function jobExists(title: string, companyId: string | null): Promise<boolean> {
  if (!companyId) {
    const { data } = await supabase.from('jobs').select('id').eq('title', title).single();
    return !!data;
  }

  const { data } = await supabase
    .from('jobs')
    .select('id')
    .eq('title', title)
    .eq('company_id', companyId)
    .single();

  return !!data;
}

/**
 * Save job to database
 * PDPA COMPLIANCE: All text fields are sanitized before storage
 */
async function saveJob(job: {
  title: string;
  company_id: string | null;
  description?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  application_url: string;
  source: string;
}): Promise<boolean> {
  // Check duplicate
  const exists = await jobExists(job.title, job.company_id);
  if (exists) {
    stats.jobsSkipped++;
    return false;
  }

  // PDPA COMPLIANCE: Sanitize all text fields before storage
  const sanitizedTitle = stripPersonalData(job.title);
  const sanitizedDescription = stripPersonalData(job.description || 'See job posting for full details.');
  const sanitizedLocation = stripPersonalData(job.location || 'Singapore');

  const slug = generateSlug(sanitizedTitle);

  const { error } = await supabase.from('jobs').insert({
    title: sanitizedTitle,
    slug,
    company_id: job.company_id,
    description: sanitizedDescription,
    location: sanitizedLocation,
    job_type: 'internship',
    work_arrangement: 'onsite',
    salary_min: job.salary_min || null,
    salary_max: job.salary_max || null,
    application_url: job.application_url,
    source: job.source,
    status: 'active',
    is_active: true,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (error) {
    console.error(`  ❌ Error saving job: ${error.message}`);
    return false;
  }

  stats.jobsAdded++;
  console.log(`  ✅ Added: ${sanitizedTitle} [PDPA Sanitized]`);
  return true;
}

/**
 * Fetch jobs from Adzuna API
 * Docs: https://developer.adzuna.com/
 */
async function fetchAdzunaJobs(pages: number = 5): Promise<void> {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    console.log('⚠️  Adzuna API keys not configured. Skipping...');
    console.log('   Add ADZUNA_APP_ID and ADZUNA_APP_KEY to .env.local');
    return;
  }

  console.log('\n📡 Fetching from Adzuna API...');

  const keywords = ['intern', 'internship', 'trainee', 'graduate program'];

  for (const keyword of keywords) {
    for (let page = 1; page <= pages; page++) {
      try {
        const url = `https://api.adzuna.com/v1/api/jobs/sg/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=50&what=${encodeURIComponent(keyword)}&content-type=application/json`;

        const response = await fetch(url);

        if (!response.ok) {
          stats.errors.push(`Adzuna API error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const jobs = data.results || [];

        console.log(`   Adzuna "${keyword}" page ${page}: ${jobs.length} jobs`);

        for (const job of jobs) {
          // Filter for internship-related titles
          const titleLower = job.title?.toLowerCase() || '';
          if (
            !titleLower.includes('intern') &&
            !titleLower.includes('trainee') &&
            !titleLower.includes('graduate')
          ) {
            continue;
          }

          stats.adzunaJobs++;

          const companyId = await getOrCreateCompany(job.company?.display_name);

          await saveJob({
            title: job.title,
            company_id: companyId,
            description: job.description,
            location: job.location?.display_name || 'Singapore',
            salary_min: job.salary_min ? Math.round(job.salary_min / 12) : undefined, // Convert annual to monthly
            salary_max: job.salary_max ? Math.round(job.salary_max / 12) : undefined,
            application_url: job.redirect_url || job.link,
            source: 'adzuna',
          });
        }

        await delay(1000); // Rate limiting
      } catch (error: any) {
        stats.errors.push(`Adzuna fetch error: ${error.message}`);
      }
    }
  }
}

/**
 * Fetch jobs from Jooble API
 * Docs: https://jooble.org/api/about
 */
async function fetchJoobleJobs(pages: number = 5): Promise<void> {
  if (!JOOBLE_API_KEY) {
    console.log('⚠️  Jooble API key not configured. Skipping...');
    console.log('   Add JOOBLE_API_KEY to .env.local');
    return;
  }

  console.log('\n📡 Fetching from Jooble API...');

  const keywords = ['internship', 'intern', 'trainee'];

  for (const keyword of keywords) {
    for (let page = 1; page <= pages; page++) {
      try {
        const url = `https://jooble.org/api/${JOOBLE_API_KEY}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keywords: keyword,
            location: 'Singapore',
            page: page,
            ResultOnPage: 50,
          }),
        });

        if (!response.ok) {
          stats.errors.push(`Jooble API error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const jobs = data.jobs || [];

        console.log(`   Jooble "${keyword}" page ${page}: ${jobs.length} jobs`);

        for (const job of jobs) {
          // Filter for internship-related titles
          const titleLower = job.title?.toLowerCase() || '';
          if (
            !titleLower.includes('intern') &&
            !titleLower.includes('trainee') &&
            !titleLower.includes('graduate')
          ) {
            continue;
          }

          stats.joobleJobs++;

          const companyId = await getOrCreateCompany(job.company);

          // Parse salary if available
          let salaryMin: number | undefined;
          let salaryMax: number | undefined;

          if (job.salary) {
            const salaryMatch = job.salary.match(/(\d[\d,]*)/g);
            if (salaryMatch) {
              const numbers = salaryMatch.map((n: string) => parseInt(n.replace(/,/g, ''), 10));
              if (numbers.length >= 2) {
                salaryMin = Math.min(...numbers);
                salaryMax = Math.max(...numbers);
              } else if (numbers.length === 1) {
                salaryMin = numbers[0];
              }
            }
          }

          await saveJob({
            title: job.title,
            company_id: companyId,
            description: job.snippet,
            location: job.location || 'Singapore',
            salary_min: salaryMin,
            salary_max: salaryMax,
            application_url: job.link,
            source: 'jooble',
          });
        }

        await delay(1000); // Rate limiting
      } catch (error: any) {
        stats.errors.push(`Jooble fetch error: ${error.message}`);
      }
    }
  }
}

/**
 * Main function
 */
async function main() {
  const testMode = process.argv.includes('--test');
  const pages = testMode ? 1 : 5;

  console.log('🚀 Job API Integration - internship.sg');
  console.log('======================================\n');
  console.log('🔒 PDPA COMPLIANCE ENABLED:');
  console.log('   ✓ Personal data (emails, phones, NRIC) stripped');
  console.log('   ✓ Only public job listing data collected');
  console.log('   ✓ Rate limiting (1s delay between requests)');
  console.log('   ✓ Source attribution maintained\n');
  console.log(`🔧 Mode: ${testMode ? 'TEST (1 page)' : 'FULL (5 pages)'}`);

  // Fetch from both APIs
  await fetchAdzunaJobs(pages);
  await fetchJoobleJobs(pages);

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SYNC COMPLETE');
  console.log('='.repeat(50));
  console.log(`📥 Adzuna jobs found: ${stats.adzunaJobs}`);
  console.log(`📥 Jooble jobs found: ${stats.joobleJobs}`);
  console.log(`💾 Jobs added: ${stats.jobsAdded}`);
  console.log(`⏭️  Jobs skipped (duplicates): ${stats.jobsSkipped}`);
  console.log(`🔒 PDPA sanitized: ${stats.jobsAdded} jobs`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors (${stats.errors.length}):`);
    stats.errors.forEach((e) => console.log(`   - ${e}`));
  }

  console.log('='.repeat(50));
}

main().catch(console.error);
