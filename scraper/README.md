# internship.sg Scraper

Playwright-based job scraper that runs via GitHub Actions.

## Setup

### 1. Add GitHub Secrets

Go to your repository **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | `https://tdukshouearmiaujcchs.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key |

### 2. Enable GitHub Actions

The scraper runs automatically:
- **Daily at 6:00 AM SGT** (10 PM UTC)
- **Manually** via Actions tab → "Job Scraper" → "Run workflow"

## How It Works

```
1. GitHub Actions triggers at scheduled time
2. Playwright browser launches in GitHub's Ubuntu runner
3. For each enabled company in scraper_companies table:
   - Visit career page
   - Extract job listings
   - Filter to internships only
   - Insert new jobs into database
4. Log results to scraper_logs table
```

## Local Testing

```bash
cd scraper

# Install dependencies
npm install
npx playwright install chromium

# Set environment variables
export SUPABASE_URL="https://tdukshouearmiaujcchs.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-key"

# Run scraper
npm run scrape
```

## Adding Company Scrapers

Edit `scraper/scrapers/index.js` to add company-specific parsers:

```javascript
async function scrapeCompanyName(page, url) {
  const jobs = [];

  await page.goto(url, { waitUntil: 'networkidle' });

  // Extract jobs...

  return jobs;
}

export const scrapers = {
  // ...existing
  companyname: scrapeCompanyName,
};
```

## Supported Platforms

The scraper has built-in support for:
- Shopee Careers
- Grab Careers
- Google Careers
- DBS Bank
- GovTech Singapore
- Stripe
- Workday-based sites
- Lever-based sites
- Greenhouse-based sites

Plus a generic scraper for other sites.
