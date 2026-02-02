/**
 * Internship Scraper for internship.sg
 * Scrapes job listings from company career pages
 *
 * Usage:
 *   npx ts-node scraper/index.ts          # Full scrape
 *   npx ts-node scraper/index.ts --test   # Test (3 companies)
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Load companies
interface CompanyConfig {
  name: string;
  logo_url: string;
  website: string;
  careers_url: string;
  industry: string;
  size: string;
}

const companiesData = JSON.parse(
  readFileSync(join(__dirname, 'companies.json'), 'utf8')
);
const companies: CompanyConfig[] = companiesData.companies;

// Config
const DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds
const PAGE_TIMEOUT = 30000; // 30 seconds

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Stats
const stats = {
  companiesProcessed: 0,
  jobsFound: 0,
  jobsAdded: 0,
  jobsSkipped: 0,
  errors: [] as { company: string; error: string }[]
};

/**
 * Get or create company in database
 */
async function getOrCreateCompany(company: CompanyConfig): Promise<string | null> {
  // Check if exists
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('name', company.name)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new
  const { data: created, error } = await supabase
    .from('companies')
    .insert({
      name: company.name,
      logo_url: company.logo_url,
      website: company.website,
      careers_url: company.careers_url,
      industry: company.industry,
      size: company.size,
      location: 'Singapore'
    })
    .select('id')
    .single();

  if (error) {
    console.error(`  ❌ Error creating company: ${error.message}`);
    return null;
  }

  return created.id;
}

/**
 * Check if job already exists
 */
async function jobExists(companyId: string, title: string): Promise<boolean> {
  const { data } = await supabase
    .from('jobs')
    .select('id')
    .eq('company_id', companyId)
    .eq('title', title)
    .single();

  return !!data;
}

/**
 * Save job to database
 */
async function saveJob(companyId: string, job: {
  title: string;
  url: string;
  location?: string;
  description?: string;
}): Promise<boolean> {
  // Check duplicate
  const exists = await jobExists(companyId, job.title);
  if (exists) {
    stats.jobsSkipped++;
    return false;
  }

  const { error } = await supabase
    .from('jobs')
    .insert({
      company_id: companyId,
      title: job.title,
      description: job.description || 'See job posting for full details.',
      location: job.location || 'Singapore',
      job_type: 'internship',
      application_url: job.url,
      source: 'scraped',
      status: 'active',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

  if (error) {
    console.error(`  ❌ Error saving job: ${error.message}`);
    return false;
  }

  stats.jobsAdded++;
  console.log(`  ✅ Added: ${job.title}`);
  return true;
}

/**
 * Generic job scraper - works for most career pages
 */
async function scrapeJobs(page: Page, company: CompanyConfig): Promise<{
  title: string;
  url: string;
  location?: string;
}[]> {
  const jobs: { title: string; url: string; location?: string }[] = [];

  try {
    await page.goto(company.careers_url, {
      waitUntil: 'networkidle2',
      timeout: PAGE_TIMEOUT
    });

    // Wait for content to load
    await delay(2000);

    const html = await page.content();
    const $ = cheerio.load(html);

    // Common selectors for job listings
    const selectors = [
      'a[href*="intern" i]',
      'a[href*="job" i]',
      'a[href*="position" i]',
      'a[href*="career" i]',
      '[class*="job"] a',
      '[class*="position"] a',
      '[class*="opening"] a',
      '[class*="listing"] a',
      '[class*="vacancy"] a',
      '.job-title a',
      '.position-title a',
      'h2 a', 'h3 a', 'h4 a'
    ];

    const seen = new Set<string>();

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const $el = $(el);
        const title = $el.text().trim().replace(/\s+/g, ' ');
        let url = $el.attr('href');

        // Filter for internship-related
        const titleLower = title.toLowerCase();
        const isInternship =
          titleLower.includes('intern') ||
          titleLower.includes('trainee') ||
          titleLower.includes('graduate') ||
          titleLower.includes('student') ||
          titleLower.includes('apprentice');

        if (!isInternship) return;
        if (!url || seen.has(title)) return;

        seen.add(title);

        // Make URL absolute
        if (url.startsWith('/')) {
          const base = new URL(company.careers_url);
          url = `${base.origin}${url}`;
        } else if (!url.startsWith('http')) {
          return; // Skip invalid URLs
        }

        if (title.length >= 5 && title.length <= 200) {
          jobs.push({ title, url });
        }
      });
    }

  } catch (error: any) {
    stats.errors.push({ company: company.name, error: error.message });
  }

  return jobs;
}

/**
 * Scrape a single company
 */
async function scrapeCompany(browser: Browser, company: CompanyConfig) {
  console.log(`\n📍 ${company.name}`);
  console.log(`   ${company.careers_url}`);

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  );

  try {
    const companyId = await getOrCreateCompany(company);
    if (!companyId) {
      console.log(`  ❌ Failed to get/create company`);
      return;
    }

    const jobs = await scrapeJobs(page, company);
    console.log(`   Found ${jobs.length} internship(s)`);
    stats.jobsFound += jobs.length;

    for (const job of jobs) {
      await saveJob(companyId, job);
    }

    stats.companiesProcessed++;

  } finally {
    await page.close();
  }

  await delay(DELAY_BETWEEN_REQUESTS);
}

/**
 * Main function
 */
async function main() {
  const testMode = process.argv.includes('--test');
  const toScrape = testMode ? companies.slice(0, 3) : companies;

  console.log('🚀 Internship.sg Scraper');
  console.log('========================\n');
  console.log(`📋 Companies: ${toScrape.length}`);
  console.log(`🔧 Mode: ${testMode ? 'TEST' : 'FULL'}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const company of toScrape) {
      await scrapeCompany(browser, company);
    }
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SCRAPING COMPLETE');
  console.log('='.repeat(50));
  console.log(`✅ Companies: ${stats.companiesProcessed}`);
  console.log(`🔍 Jobs found: ${stats.jobsFound}`);
  console.log(`💾 Jobs added: ${stats.jobsAdded}`);
  console.log(`⏭️  Jobs skipped (duplicates): ${stats.jobsSkipped}`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors (${stats.errors.length}):`);
    stats.errors.forEach(e => console.log(`   - ${e.company}: ${e.error}`));
  }

  console.log('='.repeat(50));
}

main().catch(console.error);
