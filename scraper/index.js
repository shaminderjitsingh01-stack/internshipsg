import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import company scrapers
import { scrapers } from './scrapers/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Configuration
// ============================================================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ============================================================================
// Logging
// ============================================================================
const logFile = path.join(logsDir, `scraper-${new Date().toISOString().split('T')[0]}.log`);

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

// ============================================================================
// Database Operations
// ============================================================================
async function getEnabledCompanies() {
  const { data, error } = await supabase
    .from('scraper_companies')
    .select('*')
    .eq('is_enabled', true)
    .order('name');

  if (error) {
    log(`Error fetching companies: ${error.message}`);
    return [];
  }

  return data || [];
}

async function getOrCreateCompany(name, website, industry, logoUrl) {
  // Check if company exists
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('name', name)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create company
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const { data, error } = await supabase
    .from('companies')
    .insert({
      name,
      slug,
      website,
      industry,
      logo_url: logoUrl,
    })
    .select('id')
    .single();

  if (error) {
    log(`Error creating company ${name}: ${error.message}`);
    return null;
  }

  return data?.id;
}

async function jobExists(companyId, title) {
  const { data } = await supabase
    .from('jobs')
    .select('id')
    .eq('company_id', companyId)
    .eq('title', title)
    .single();

  return !!data;
}

async function insertJob(job, companyId) {
  const slug = job.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 8);

  const { error } = await supabase.from('jobs').insert({
    company_id: companyId,
    title: job.title,
    slug,
    description: job.description || '',
    requirements: job.requirements || [],
    location: job.location || 'Singapore',
    work_arrangement: job.work_arrangement || 'onsite',
    duration: job.duration,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    application_url: job.application_url,
    is_active: true,
    posted_at: new Date().toISOString(),
  });

  if (error) {
    log(`Error inserting job "${job.title}": ${error.message}`);
    return false;
  }

  return true;
}

async function createScraperLog(logEntry) {
  const { data, error } = await supabase
    .from('scraper_logs')
    .insert(logEntry)
    .select('id')
    .single();

  return data?.id || null;
}

async function updateScraperLog(logId, updates) {
  await supabase
    .from('scraper_logs')
    .update(updates)
    .eq('id', logId);
}

async function updateCompanyStats(companyId, jobsFound) {
  await supabase
    .from('scraper_companies')
    .update({
      last_scraped_at: new Date().toISOString(),
      last_jobs_found: jobsFound,
    })
    .eq('id', companyId);
}

// ============================================================================
// Internship Keywords Filter
// ============================================================================
const INTERNSHIP_KEYWORDS = [
  'intern',
  'internship',
  'trainee',
  'graduate program',
  'student',
  'co-op',
  'placement',
  'industrial attachment',
  'fresh grad',
  'entry level',
];

function isInternship(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();
  return INTERNSHIP_KEYWORDS.some(keyword => text.includes(keyword));
}

// ============================================================================
// Main Scraper
// ============================================================================
async function runScraper() {
  log('========================================');
  log('Starting internship.sg scraper');
  log('========================================');

  // Create log entry
  const logId = await createScraperLog({
    started_at: new Date().toISOString(),
    status: 'running',
    companies_processed: 0,
    jobs_found: 0,
    jobs_added: 0,
    jobs_skipped: 0,
    errors: [],
  });

  const stats = {
    companiesProcessed: 0,
    jobsFound: 0,
    jobsAdded: 0,
    jobsSkipped: 0,
    errors: [],
  };

  // Get enabled companies
  const companies = await getEnabledCompanies();
  log(`Found ${companies.length} enabled companies`);

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  try {
    for (const company of companies) {
      try {
        log(`\nProcessing: ${company.name}`);

        // Find matching scraper
        const scraperKey = Object.keys(scrapers).find(key =>
          company.name.toLowerCase().includes(key.toLowerCase()) ||
          (company.careers_url && company.careers_url.includes(key.toLowerCase()))
        );

        let jobs = [];

        if (scraperKey && scrapers[scraperKey]) {
          // Use company-specific scraper
          log(`Using ${scraperKey} scraper`);
          const page = await context.newPage();

          try {
            jobs = await scrapers[scraperKey](page, company.careers_url);
          } catch (err) {
            log(`Error scraping ${company.name}: ${err.message}`);
            stats.errors.push({ company: company.name, error: err.message });
          } finally {
            await page.close();
          }
        } else {
          // Use generic scraper
          log(`Using generic scraper for ${company.name}`);
          const page = await context.newPage();

          try {
            jobs = await genericScraper(page, company.careers_url, company.name);
          } catch (err) {
            log(`Error scraping ${company.name}: ${err.message}`);
            stats.errors.push({ company: company.name, error: err.message });
          } finally {
            await page.close();
          }
        }

        // Filter to internships only
        const internships = jobs.filter(job => isInternship(job.title, job.description));
        log(`Found ${jobs.length} jobs, ${internships.length} are internships`);

        stats.jobsFound += internships.length;

        // Get or create company in main companies table
        const companyId = await getOrCreateCompany(
          company.name,
          company.website,
          company.industry,
          company.logo_url
        );

        if (!companyId) {
          log(`Skipping jobs - could not get company ID`);
          continue;
        }

        // Insert jobs
        for (const job of internships) {
          const exists = await jobExists(companyId, job.title);

          if (exists) {
            log(`Skipping existing: ${job.title}`);
            stats.jobsSkipped++;
          } else {
            const inserted = await insertJob(job, companyId);
            if (inserted) {
              log(`Added: ${job.title}`);
              stats.jobsAdded++;
            }
          }
        }

        // Update company stats
        await updateCompanyStats(company.id, internships.length);
        stats.companiesProcessed++;

        // Rate limiting - wait between companies
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (err) {
        log(`Fatal error processing ${company.name}: ${err.message}`);
        stats.errors.push({ company: company.name, error: err.message });
      }
    }
  } finally {
    await browser.close();
  }

  // Update log entry
  if (logId) {
    await updateScraperLog(logId, {
      completed_at: new Date().toISOString(),
      status: stats.errors.length > 0 ? 'completed_with_errors' : 'completed',
      companies_processed: stats.companiesProcessed,
      jobs_found: stats.jobsFound,
      jobs_added: stats.jobsAdded,
      jobs_skipped: stats.jobsSkipped,
      errors: stats.errors,
    });
  }

  log('\n========================================');
  log('Scraper completed');
  log(`Companies processed: ${stats.companiesProcessed}`);
  log(`Jobs found: ${stats.jobsFound}`);
  log(`Jobs added: ${stats.jobsAdded}`);
  log(`Jobs skipped: ${stats.jobsSkipped}`);
  log(`Errors: ${stats.errors.length}`);
  log('========================================');

  return stats;
}

// ============================================================================
// Generic Scraper (for sites without specific parser)
// ============================================================================
async function genericScraper(page, url, companyName) {
  const jobs = [];

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Common selectors for job listings
    const selectors = [
      '[class*="job-card"]',
      '[class*="job-listing"]',
      '[class*="job-item"]',
      '[class*="position-card"]',
      '[class*="career-card"]',
      '[class*="opening"]',
      '[data-job]',
      'article[class*="job"]',
      '.jobs-list li',
      '.careers-list li',
    ];

    for (const selector of selectors) {
      const elements = await page.$$(selector);

      if (elements.length > 0) {
        log(`Found ${elements.length} elements with selector: ${selector}`);

        for (const element of elements) {
          try {
            // Try to extract job info
            const title = await element.$eval(
              'h2, h3, h4, [class*="title"], [class*="name"]',
              el => el.textContent?.trim()
            ).catch(() => null);

            const link = await element.$eval(
              'a[href]',
              el => el.href
            ).catch(() => null);

            const location = await element.$eval(
              '[class*="location"]',
              el => el.textContent?.trim()
            ).catch(() => 'Singapore');

            if (title && link) {
              jobs.push({
                title,
                application_url: link,
                location: location || 'Singapore',
                company_name: companyName,
              });
            }
          } catch (err) {
            // Skip this element
          }
        }

        if (jobs.length > 0) break;
      }
    }
  } catch (err) {
    log(`Generic scraper error: ${err.message}`);
  }

  return jobs;
}

// ============================================================================
// Run
// ============================================================================
runScraper()
  .then(stats => {
    process.exit(stats.errors.length > 10 ? 1 : 0);
  })
  .catch(err => {
    log(`Fatal error: ${err.message}`);
    process.exit(1);
  });
