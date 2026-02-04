/**
 * Job Scraper for internship.sg
 * Uses RemoteOK + Remotive APIs for reliable job data with DIRECT company URLs
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
const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || '').trim();

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

  const { data, error } = await supabase
    .from('companies')
    .insert({ name, slug, website, location: 'Remote / Singapore' })
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

  const { error } = await supabase.from('jobs').insert({
    title: stripPersonalData(job.title),
    company_id: job.company_id,
    description: stripPersonalData(job.description || ''),
    location: job.location || 'Remote',
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    application_url: job.application_url,
    is_active: true,
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
// RemoteOK API - Free, direct company URLs
// ============================================================================
async function fetchRemoteOKJobs() {
  log('📡 Fetching from RemoteOK API...');

  const jobs = [];

  try {
    const response = await fetch('https://remoteok.com/api', {
      headers: {
        'User-Agent': 'InternshipSG/1.0 (job aggregator)',
      },
    });

    if (!response.ok) {
      log(`RemoteOK API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    // First item is metadata, skip it
    const results = Array.isArray(data) ? data.slice(1) : [];

    log(`  RemoteOK: ${results.length} total jobs`);

    for (const job of results) {
      const title = (job.position || '').toLowerCase();
      const tags = (job.tags || []).map(t => t.toLowerCase()).join(' ');

      // Filter for internships
      if (!title.includes('intern') && !title.includes('trainee') && !title.includes('graduate') && !title.includes('junior') && !tags.includes('intern')) {
        continue;
      }

      // Parse salary
      let salaryMin = null;
      let salaryMax = null;
      if (job.salary_min) salaryMin = parseInt(job.salary_min) / 12; // Convert annual to monthly
      if (job.salary_max) salaryMax = parseInt(job.salary_max) / 12;

      jobs.push({
        title: job.position,
        company: job.company,
        company_logo: job.company_logo,
        description: job.description,
        location: job.location || 'Remote',
        salary_min: salaryMin ? Math.round(salaryMin) : null,
        salary_max: salaryMax ? Math.round(salaryMax) : null,
        application_url: job.url, // Direct company URL!
        source: 'remoteok',
      });
    }

    log(`✅ RemoteOK: Found ${jobs.length} internships/junior roles`);
  } catch (err) {
    log(`RemoteOK error: ${err.message}`);
  }

  return jobs;
}

// ============================================================================
// Remotive API - Free, direct company URLs
// ============================================================================
async function fetchRemotiveJobs() {
  log('📡 Fetching from Remotive API...');

  const jobs = [];
  const categories = ['software-dev', 'marketing', 'design', 'customer-support', 'sales', 'product', 'data', 'finance'];

  for (const category of categories) {
    try {
      const response = await fetch(`https://remotive.com/api/remote-jobs?category=${category}&limit=100`);

      if (!response.ok) {
        log(`Remotive API error for ${category}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const results = data.jobs || [];

      log(`  Remotive "${category}": ${results.length} jobs`);

      for (const job of results) {
        const title = (job.title || '').toLowerCase();
        const jobType = (job.job_type || '').toLowerCase();

        // Filter for internships or junior roles
        if (!title.includes('intern') && !title.includes('trainee') && !title.includes('graduate') && !title.includes('junior') && !title.includes('entry') && jobType !== 'internship') {
          continue;
        }

        // Parse salary from description if available
        let salaryMin = null;
        let salaryMax = null;
        if (job.salary) {
          const numbers = job.salary.match(/\d[\d,]*/g);
          if (numbers) {
            const parsed = numbers.map(n => parseInt(n.replace(/,/g, ''), 10));
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
          company: job.company_name,
          company_logo: job.company_logo,
          description: job.description,
          location: job.candidate_required_location || 'Remote',
          salary_min: salaryMin,
          salary_max: salaryMax,
          application_url: job.url, // Direct company URL!
          source: 'remotive',
        });
      }

      // Rate limit: max 4 requests per day recommended, but we'll be gentle
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      log(`Remotive error for ${category}: ${err.message}`);
    }
  }

  log(`✅ Remotive: Found ${jobs.length} internships/junior roles`);
  return jobs;
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  log('========================================');
  log('🚀 Starting internship.sg job scraper');
  log('📡 Using: RemoteOK + Remotive (FREE, Direct URLs)');
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
    // Fetch from both APIs
    const remoteOKJobs = await fetchRemoteOKJobs();
    const remotiveJobs = await fetchRemotiveJobs();

    // Combine and dedupe by title + company
    const allJobs = [...remoteOKJobs, ...remotiveJobs];
    const seen = new Set();
    const uniqueJobs = allJobs.filter(job => {
      const key = `${job.title}-${job.company}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    stats.found = uniqueJobs.length;
    log(`\n📊 Total unique internships/junior roles: ${uniqueJobs.length}`);

    // Save jobs
    for (const job of uniqueJobs) {
      const companyId = await getOrCreateCompany(job.company, job.company_logo);
      const result = await saveJob({
        ...job,
        company_id: companyId,
      });

      if (result.added) {
        stats.added++;
        log(`  ✅ Added: ${job.title} @ ${job.company}`);
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
    log(`❌ Fatal error: ${err.message}`);
    stats.errors.push(err.message);

    if (logId) {
      await updateScraperLog(logId, {
        completed_at: new Date().toISOString(),
        status: 'failed',
        errors: [{ error: err.message }],
      });
    }
  }

  log('\n========================================');
  log('📊 SCRAPER COMPLETE');
  log('========================================');
  log(`Jobs found:   ${stats.found}`);
  log(`Jobs added:   ${stats.added}`);
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
