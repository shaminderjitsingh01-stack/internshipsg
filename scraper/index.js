/**
 * Job Scraper for internship.sg
 * Uses Fantastic.jobs Active Jobs DB API - DIRECT company URLs!
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
const RAPIDAPI_KEY = (process.env.RAPIDAPI_KEY || '').trim();

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
async function getOrCreateCompany(name, logoUrl, website) {
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
    .insert({
      name,
      slug,
      logo_url: logoUrl,
      website: website,
      location: 'Various'
    })
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
// Fantastic.jobs Active Jobs DB API - DIRECT COMPANY URLs!
// ============================================================================
async function fetchFantasticJobs() {
  if (!RAPIDAPI_KEY) {
    log('⚠️ RAPIDAPI_KEY not configured - skipping Fantastic.jobs');
    return [];
  }

  log('📡 Fetching from Fantastic.jobs Active Jobs DB API...');
  log('   (Direct company URLs - no tracking!)');

  const jobs = [];
  const keywords = ['intern', 'trainee', 'graduate', 'entry level'];

  for (const keyword of keywords) {
    try {
      const url = `https://active-jobs-db.p.rapidapi.com/active-ats-24h?limit=100&title_filter=${encodeURIComponent(keyword)}`;

      const response = await fetch(url, {
        headers: {
          'x-rapidapi-host': 'active-jobs-db.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        log(`Fantastic.jobs API error for "${keyword}": ${response.status} - ${errorText}`);
        continue;
      }

      const results = await response.json();

      if (!Array.isArray(results)) {
        log(`Fantastic.jobs returned non-array for "${keyword}"`);
        continue;
      }

      log(`  "${keyword}": ${results.length} jobs found`);

      for (const job of results) {
        // Filter for Singapore jobs only
        const countries = job.countries_derived || [];
        const locations = job.locations_derived || [];
        const isSingapore = countries.some(c => c.toLowerCase().includes('singapore')) ||
                           locations.some(l => l.toLowerCase().includes('singapore'));

        if (!isSingapore) continue;

        // Parse salary
        let salaryMin = null;
        let salaryMax = null;
        if (job.salary_raw?.value) {
          const val = job.salary_raw.value;
          if (val.minValue) salaryMin = val.unitText === 'YEAR' ? Math.round(val.minValue / 12) : val.minValue;
          if (val.maxValue) salaryMax = val.unitText === 'YEAR' ? Math.round(val.maxValue / 12) : val.maxValue;
        }

        // Get location
        const location = job.locations_derived?.[0] || 'Singapore';

        jobs.push({
          title: job.title,
          company: job.organization,
          company_logo: job.organization_logo,
          company_website: job.organization_url || job.domain_derived,
          description: '', // API doesn't include full description in this endpoint
          location: location,
          salary_min: salaryMin,
          salary_max: salaryMax,
          application_url: job.url, // DIRECT company URL!
          source: 'fantastic_jobs',
        });
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      log(`Fantastic.jobs error for "${keyword}": ${err.message}`);
    }
  }

  // Dedupe by title + company
  const seen = new Set();
  const uniqueJobs = jobs.filter(job => {
    const key = `${job.title}-${job.company}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  log(`✅ Fantastic.jobs: Found ${uniqueJobs.length} unique internships`);
  return uniqueJobs;
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  log('========================================');
  log('🚀 Starting internship.sg job scraper');
  log('📡 Using: Fantastic.jobs Active Jobs DB');
  log('✅ DIRECT company URLs - no tracking!');
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
    // Fetch jobs
    const jobs = await fetchFantasticJobs();

    stats.found = jobs.length;
    log(`\n📊 Total internships found: ${jobs.length}`);

    // Save jobs
    const companiesSeen = new Set();
    for (const job of jobs) {
      const companyId = await getOrCreateCompany(
        job.company,
        job.company_logo,
        job.company_website
      );

      if (job.company) companiesSeen.add(job.company);

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
        companies_processed: companiesSeen.size,
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
