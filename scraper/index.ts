/**
 * Internship Scraper for internship.sg
 * Scrapes job listings directly from company career pages
 *
 * PDPA COMPLIANCE (Singapore Personal Data Protection Act):
 * - Only collects publicly available job listing data
 * - Personal data (emails, phones, NRIC) is stripped before storage
 * - Respects robots.txt directives
 * - Rate limiting (3s between requests)
 * - Source attribution maintained
 *
 * Usage:
 *   npx ts-node scraper/index.ts          # Full scrape
 *   npx ts-node scraper/index.ts --test   # Test (3 companies)
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// PDPA COMPLIANCE: Personal Data Patterns to Strip
// ============================================================================
const PERSONAL_DATA_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, // Email
  /\b(\+65|65)?[\s-]?[689]\d{3}[\s-]?\d{4}\b/g, // SG phone
  /\b[STFG]\d{7}[A-Z]\b/gi, // NRIC/FIN
  /\b(Mr|Ms|Mrs|Miss|Dr)\.?\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*/g, // Names
  /\b(contact|email|call|reach|phone|tel|mobile)[\s:]+[^\n,]+/gi, // Contact patterns
];

function stripPersonalData(text: string): string {
  if (!text) return text;
  let cleaned = text;
  for (const pattern of PERSONAL_DATA_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[REDACTED]');
  }
  return cleaned.replace(/(\[REDACTED\]\s*)+/g, '[REDACTED] ').trim();
}

/**
 * PDPA COMPLIANCE: Check robots.txt before scraping
 */
async function checkRobotsTxt(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    const response = await fetch(robotsUrl, { signal: AbortSignal.timeout(5000) });

    if (!response.ok) return true; // No robots.txt = allowed

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
          return false;
        }
      }
    }
    return true;
  } catch {
    return true; // On error, proceed with caution
  }
}

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
 * PDPA COMPLIANCE: All text fields are sanitized before storage
 */
async function saveJob(companyId: string, job: {
  title: string;
  url: string;
  location?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  work_arrangement?: string;
  duration?: string;
}, careersUrl: string): Promise<boolean> {
  // Check duplicate
  const exists = await jobExists(companyId, job.title);
  if (exists) {
    stats.jobsSkipped++;
    return false;
  }

  // PDPA COMPLIANCE: Sanitize all text fields
  const sanitizedTitle = stripPersonalData(job.title);
  const sanitizedDescription = stripPersonalData(job.description || 'See job posting for full details.');
  const sanitizedLocation = stripPersonalData(job.location || 'Singapore');

  // Validate URL - use careers page as fallback if URL is invalid
  let applicationUrl = job.url;
  try {
    new URL(applicationUrl);
  } catch {
    applicationUrl = careersUrl;
  }

  const { error } = await supabase
    .from('jobs')
    .insert({
      company_id: companyId,
      title: sanitizedTitle,
      description: sanitizedDescription,
      location: sanitizedLocation,
      job_type: 'internship',
      work_arrangement: job.work_arrangement || 'onsite',
      salary_min: job.salary_min || null,
      salary_max: job.salary_max || null,
      duration: job.duration || null,
      application_url: applicationUrl,
      source: 'scraped',
      status: 'active',
      is_active: true,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

  if (error) {
    console.error(`  ❌ Error saving job: ${error.message}`);
    return false;
  }

  stats.jobsAdded++;
  console.log(`  ✅ Added: ${sanitizedTitle} [PDPA Sanitized]`);
  return true;
}

interface ScrapedJob {
  title: string;
  url: string;
  location?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  work_arrangement?: string;
  duration?: string;
}

/**
 * Extract salary from text
 */
function extractSalary(text: string): { min?: number; max?: number } {
  // Match patterns like "$1,000 - $2,000", "1000-2000", "$1.5k - $2k"
  const patterns = [
    /\$?([\d,]+)\s*[-–to]+\s*\$?([\d,]+)/i,
    /\$?([\d.]+)k\s*[-–to]+\s*\$?([\d.]+)k/i,
    /sgd?\s*([\d,]+)\s*[-–to]+\s*([\d,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let min = parseFloat(match[1].replace(/,/g, ''));
      let max = parseFloat(match[2].replace(/,/g, ''));

      // Handle "k" notation
      if (text.toLowerCase().includes('k')) {
        if (min < 100) min *= 1000;
        if (max < 100) max *= 1000;
      }

      return { min: Math.round(min), max: Math.round(max) };
    }
  }
  return {};
}

/**
 * Extract work arrangement from text
 */
function extractWorkArrangement(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('remote') || lower.includes('work from home') || lower.includes('wfh')) {
    return 'remote';
  }
  if (lower.includes('hybrid')) {
    return 'hybrid';
  }
  if (lower.includes('on-site') || lower.includes('onsite') || lower.includes('office')) {
    return 'onsite';
  }
  return undefined;
}

/**
 * Generic job scraper - works for most career pages
 */
async function scrapeJobs(page: Page, company: CompanyConfig): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];

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
          // Try to make it absolute anyway
          try {
            const base = new URL(company.careers_url);
            url = new URL(url, base).href;
          } catch {
            // Use careers URL as fallback
            url = company.careers_url;
          }
        }

        if (title.length >= 5 && title.length <= 200) {
          // Try to get additional context from parent/sibling elements
          const $parent = $el.closest('[class*="job"], [class*="position"], [class*="listing"], article, li');
          const contextText = $parent.text() || '';

          const salary = extractSalary(contextText);
          const work_arrangement = extractWorkArrangement(contextText);

          jobs.push({
            title,
            url,
            salary_min: salary.min,
            salary_max: salary.max,
            work_arrangement
          });
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
 * PDPA COMPLIANCE: Checks robots.txt before scraping
 */
async function scrapeCompany(browser: Browser, company: CompanyConfig) {
  console.log(`\n📍 ${company.name}`);
  console.log(`   ${company.careers_url}`);

  // PDPA COMPLIANCE: Check robots.txt first
  const allowed = await checkRobotsTxt(company.careers_url);
  if (!allowed) {
    console.log(`   ⚠️  Skipped: robots.txt disallows scraping`);
    stats.errors.push({ company: company.name, error: 'robots.txt disallows scraping' });
    return;
  }

  const page = await browser.newPage();

  await page.setUserAgent(
    'InternshipSG-Bot/1.0 (PDPA Compliant Job Aggregator; +https://internship.sg)'
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
      await saveJob(companyId, job, company.careers_url);
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

  console.log('🚀 Internship.sg Company Scraper');
  console.log('=================================\n');
  console.log('🔒 PDPA COMPLIANCE ENABLED:');
  console.log('   ✓ robots.txt checked before scraping');
  console.log('   ✓ Personal data (emails, phones, NRIC) stripped');
  console.log('   ✓ Rate limiting (3s between companies)');
  console.log('   ✓ Direct company sources only (no job boards)\n');
  console.log(`📋 Companies: ${toScrape.length}`);
  console.log(`🔧 Mode: ${testMode ? 'TEST (3 companies)' : 'FULL'}\n`);

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
