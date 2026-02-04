/**
 * Job Scraper for internship.sg
 * Uses Adzuna API for reliable job data
 *
 * PDPA COMPLIANCE: Personal data is stripped before storage
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Configuration
// ============================================================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || 'dc4c2ae3';
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || '1c57965a0d94dc68d06b9ce6de58da42';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Ensure logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logFile = path.join(logsDir, `scraper-${new Date().toISOString().split('T')[0]}.log`);
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

// ============================================================================
// PDPA Compliance
// ============================================================================
const PERSONAL_DATA_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  /\b(\+65|65)?[\s-]?[689]\d{3}[\s-]?\d{4}\b/g,
  /\b[STFG]\d{7}[A-Z]\b/gi,
];

function stripPersonalData(text) {
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
async function getOrCreateCompany(name, website) {
  if (!name) return null;

  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('name', name)
    .single();

  if (existing) return existing.id;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const logoUrl = `https://img.logo.dev/${slug}.com?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=200`;

  const { data, error } = await supabase
    .from('companies')
    .insert({ name, slug, website, location: 'Singapore' })
    .select('id')
    .single();

  if (error) {
    log(`Error creating company ${name}: ${error.message}`);
    return null;
  }

  return data?.id;
}

async function jobExists(title, companyId) {
  const query = supabase.from('jobs').select('id').eq('title', title);
  if (companyId) query.eq('company_id', companyId);
  const { data } = await query.single();
  return !!data;
}

async function saveJob(job) {
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
    posted_at: new Date().toISOString(),
  });

  if (error) {
    log(`Error saving job: ${error.message}`);
    return { added: false, skipped: false, error: true };
  }

  return { added: true, skipped: false };
}

async function createScraperLog(entry) {
  const { data } = await supabase.from('scraper_logs').insert(entry).select('id').single();
  return data?.id;
}

async function updateScraperLog(id, updates) {
  await supabase.from('scraper_logs').update(updates).eq('id', id);
}

// ============================================================================
// Adzuna API
// ============================================================================
async function fetchAdzunaJobs() {
  log('Fetching from Adzuna API...');

  const keywords = ['intern', 'internship', 'trainee', 'graduate'];
  const jobs = [];

  for (const keyword of keywords) {
    for (let page = 1; page <= 3; page++) {
      try {
        const url = `https://api.adzuna.com/v1/api/jobs/sg/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=50&what=${encodeURIComponent(keyword)}`;

        const response = await fetch(url);
        if (!response.ok) {
          log(`Adzuna API error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const results = data.results || [];

        log(`Adzuna "${keyword}" page ${page}: ${results.length} jobs`);

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
          });
        }

        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        log(`Adzuna error: ${err.message}`);
      }
    }
  }

  return jobs;
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  log('========================================');
  log('Starting internship.sg job scraper');
  log('========================================');

  const logId = await createScraperLog({
    started_at: new Date().toISOString(),
    status: 'running',
    companies_processed: 0,
    jobs_found: 0,
    jobs_added: 0,
    jobs_skipped: 0,
    errors: [],
  });

  const stats = { found: 0, added: 0, skipped: 0, errors: [] };

  try {
    // Fetch from Adzuna
    const jobs = await fetchAdzunaJobs();
    stats.found = jobs.length;
    log(`Total internships found: ${jobs.length}`);

    // Save jobs
    for (const job of jobs) {
      const companyId = await getOrCreateCompany(job.company);
      const result = await saveJob({
        ...job,
        company_id: companyId,
      });

      if (result.added) {
        stats.added++;
        log(`Added: ${job.title} @ ${job.company}`);
      } else if (result.skipped) {
        stats.skipped++;
      }
    }

    // Update log
    if (logId) {
      await updateScraperLog(logId, {
        completed_at: new Date().toISOString(),
        status: 'completed',
        jobs_found: stats.found,
        jobs_added: stats.added,
        jobs_skipped: stats.skipped,
        errors: stats.errors,
      });
    }

  } catch (err) {
    log(`Fatal error: ${err.message}`);
    stats.errors.push(err.message);

    if (logId) {
      await updateScraperLog(logId, {
        completed_at: new Date().toISOString(),
        status: 'failed',
        errors: [{ error: err.message }],
      });
    }
  }

  log('========================================');
  log(`Jobs found: ${stats.found}`);
  log(`Jobs added: ${stats.added}`);
  log(`Jobs skipped: ${stats.skipped}`);
  log('========================================');

  return stats;
}

main().then(stats => {
  process.exit(stats.errors.length > 0 ? 1 : 0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
