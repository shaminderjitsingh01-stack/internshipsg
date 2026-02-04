/**
 * Company-specific scrapers
 * Each scraper takes a Playwright page and URL, returns array of jobs
 */

// ============================================================================
// Shopee Careers
// ============================================================================
async function scrapeShopee(page, url) {
  const jobs = [];

  try {
    await page.goto('https://careers.shopee.sg/jobs?country_id=1&dept_id=0&limit=50&offset=0', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const jobCards = await page.$$('.job-card, [class*="JobCard"]');
    console.log(`Shopee: Found ${jobCards.length} job cards`);

    for (const card of jobCards) {
      try {
        const title = await card.$eval('h3, [class*="title"]', el => el.textContent?.trim()).catch(() => null);
        const location = await card.$eval('[class*="location"]', el => el.textContent?.trim()).catch(() => 'Singapore');
        const link = await card.$eval('a', el => el.href).catch(() => null);

        if (title && link) {
          jobs.push({
            title,
            application_url: link,
            location: location || 'Singapore',
            company_name: 'Shopee',
          });
        }
      } catch (e) {}
    }
  } catch (err) {
    console.log(`Shopee scraper error: ${err.message}`);
  }

  return jobs;
}

// ============================================================================
// Grab Careers
// ============================================================================
async function scrapeGrab(page, url) {
  const jobs = [];

  try {
    await page.goto('https://grab.careers/jobs/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // Try to filter by internship if possible
    const internFilter = await page.$('text=Intern');
    if (internFilter) await internFilter.click().catch(() => {});
    await page.waitForTimeout(2000);

    const jobCards = await page.$$('.job-listing, [class*="job-card"], article');

    for (const card of jobCards) {
      try {
        const title = await card.$eval('h2, h3, h4, [class*="title"]', el => el.textContent?.trim()).catch(() => null);
        const location = await card.$eval('[class*="location"]', el => el.textContent?.trim()).catch(() => 'Singapore');
        const link = await card.$eval('a[href*="job"]', el => el.href).catch(() => null);

        if (title && link) {
          jobs.push({
            title,
            application_url: link,
            location: location || 'Singapore',
            company_name: 'Grab',
          });
        }
      } catch (e) {}
    }
  } catch (err) {
    console.log(`Grab scraper error: ${err.message}`);
  }

  return jobs;
}

// ============================================================================
// Google Careers (Singapore)
// ============================================================================
async function scrapeGoogle(page, url) {
  const jobs = [];

  try {
    // Google careers URL with Singapore filter and internship
    await page.goto('https://www.google.com/about/careers/applications/jobs/results/?location=Singapore&q=intern', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const jobCards = await page.$$('[class*="gc-card"], li[class*="lLd3Je"]');

    for (const card of jobCards) {
      try {
        const title = await card.$eval('h3, [class*="title"]', el => el.textContent?.trim()).catch(() => null);
        const location = await card.$eval('[class*="location"]', el => el.textContent?.trim()).catch(() => 'Singapore');
        const link = await card.$eval('a', el => el.href).catch(() => null);

        if (title && link) {
          jobs.push({
            title,
            application_url: link,
            location: location || 'Singapore',
            company_name: 'Google',
          });
        }
      } catch (e) {}
    }
  } catch (err) {
    console.log(`Google scraper error: ${err.message}`);
  }

  return jobs;
}

// ============================================================================
// DBS Bank Careers
// ============================================================================
async function scrapeDBS(page, url) {
  const jobs = [];

  try {
    await page.goto('https://www.dbs.com/careers/internship/default.page', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const jobCards = await page.$$('.job-card, [class*="career-item"], .listing-item, article');

    for (const card of jobCards) {
      try {
        const title = await card.$eval('h2, h3, h4, [class*="title"]', el => el.textContent?.trim()).catch(() => null);
        const location = await card.$eval('[class*="location"]', el => el.textContent?.trim()).catch(() => 'Singapore');
        const link = await card.$eval('a', el => el.href).catch(() => null);

        if (title && link) {
          jobs.push({
            title,
            application_url: link,
            location: location || 'Singapore',
            company_name: 'DBS Bank',
          });
        }
      } catch (e) {}
    }
  } catch (err) {
    console.log(`DBS scraper error: ${err.message}`);
  }

  return jobs;
}

// ============================================================================
// GovTech Careers
// ============================================================================
async function scrapeGovTech(page, url) {
  const jobs = [];

  try {
    await page.goto('https://www.tech.gov.sg/careers/students-and-graduates/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const jobCards = await page.$$('.card, [class*="job"], article');

    for (const card of jobCards) {
      try {
        const title = await card.$eval('h2, h3, h4, [class*="title"]', el => el.textContent?.trim()).catch(() => null);
        const link = await card.$eval('a', el => el.href).catch(() => null);

        if (title && link) {
          jobs.push({
            title,
            application_url: link,
            location: 'Singapore',
            company_name: 'GovTech Singapore',
          });
        }
      } catch (e) {}
    }
  } catch (err) {
    console.log(`GovTech scraper error: ${err.message}`);
  }

  return jobs;
}

// ============================================================================
// Stripe Careers
// ============================================================================
async function scrapeStripe(page, url) {
  const jobs = [];

  try {
    await page.goto('https://stripe.com/jobs/search?office_locations=Asia+Pacific--Singapore', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const jobCards = await page.$$('[class*="JobsListings"] a, [class*="job-card"]');

    for (const card of jobCards) {
      try {
        const title = await card.$eval('h2, h3, [class*="title"]', el => el.textContent?.trim()).catch(() => null);
        const link = await card.getAttribute('href').catch(() => null);

        if (title && link) {
          jobs.push({
            title,
            application_url: link.startsWith('http') ? link : `https://stripe.com${link}`,
            location: 'Singapore',
            company_name: 'Stripe',
          });
        }
      } catch (e) {}
    }
  } catch (err) {
    console.log(`Stripe scraper error: ${err.message}`);
  }

  return jobs;
}

// ============================================================================
// Workday-based careers pages (many companies use this)
// ============================================================================
async function scrapeWorkday(page, url) {
  const jobs = [];

  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(5000);

    // Workday has a specific structure
    const jobCards = await page.$$('[data-automation-id="jobItem"], li[class*="job"]');

    for (const card of jobCards) {
      try {
        const title = await card.$eval('[data-automation-id="jobTitle"], h3', el => el.textContent?.trim()).catch(() => null);
        const location = await card.$eval('[data-automation-id="locationText"]', el => el.textContent?.trim()).catch(() => 'Singapore');
        const link = await card.$eval('a', el => el.href).catch(() => null);

        if (title && link) {
          jobs.push({
            title,
            application_url: link,
            location: location || 'Singapore',
          });
        }
      } catch (e) {}
    }
  } catch (err) {
    console.log(`Workday scraper error: ${err.message}`);
  }

  return jobs;
}

// ============================================================================
// Lever-based careers pages
// ============================================================================
async function scrapeLever(page, url) {
  const jobs = [];

  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const jobCards = await page.$$('.posting, [class*="posting"]');

    for (const card of jobCards) {
      try {
        const title = await card.$eval('h5, [class*="posting-title"]', el => el.textContent?.trim()).catch(() => null);
        const location = await card.$eval('[class*="location"], .workplaceTypes', el => el.textContent?.trim()).catch(() => 'Singapore');
        const link = await card.$eval('a', el => el.href).catch(() => null);

        if (title && link) {
          jobs.push({
            title,
            application_url: link,
            location: location || 'Singapore',
          });
        }
      } catch (e) {}
    }
  } catch (err) {
    console.log(`Lever scraper error: ${err.message}`);
  }

  return jobs;
}

// ============================================================================
// Greenhouse-based careers pages
// ============================================================================
async function scrapeGreenhouse(page, url) {
  const jobs = [];

  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const jobCards = await page.$$('.opening, [class*="job-post"]');

    for (const card of jobCards) {
      try {
        const title = await card.$eval('a', el => el.textContent?.trim()).catch(() => null);
        const location = await card.$eval('.location', el => el.textContent?.trim()).catch(() => 'Singapore');
        const link = await card.$eval('a', el => el.href).catch(() => null);

        if (title && link) {
          jobs.push({
            title,
            application_url: link,
            location: location || 'Singapore',
          });
        }
      } catch (e) {}
    }
  } catch (err) {
    console.log(`Greenhouse scraper error: ${err.message}`);
  }

  return jobs;
}

// ============================================================================
// Export all scrapers
// ============================================================================
export const scrapers = {
  shopee: scrapeShopee,
  grab: scrapeGrab,
  google: scrapeGoogle,
  dbs: scrapeDBS,
  govtech: scrapeGovTech,
  'tech.gov': scrapeGovTech,
  stripe: scrapeStripe,
  // Platform-based scrapers (detect from URL)
  workday: scrapeWorkday,
  lever: scrapeLever,
  greenhouse: scrapeGreenhouse,
};
