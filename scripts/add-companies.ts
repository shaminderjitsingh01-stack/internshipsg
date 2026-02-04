// Script to add companies to scraper_companies table
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://tdukshouearmiaujcchs.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkdWtzaG91ZWFybWlhdWpjY2hzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ2OTIwNywiZXhwIjoyMDg1MDQ1MjA3fQ.7dBCfvYFD2iAYC7NR6aW-aejMJiClC9csH6ymnPa_ns';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Function to get logo URL using logo.dev API
function getLogoUrl(website: string): string {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    const domain = url.hostname.replace('www.', '');
    return `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=200`;
  } catch {
    return '';
  }
}

interface CompanyData {
  name: string;
  industry: string;
  careers_url: string;
  size: string;
  website: string;
}

async function addCompanies() {
  // Read the JSON file
  const jsonPath = path.join(__dirname, '../../singapore_internship_companies.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const companies: CompanyData[] = data.companies;

  console.log(`Found ${companies.length} companies to add`);

  // First, get existing companies to avoid duplicates
  const { data: existingCompanies } = await supabase
    .from('scraper_companies')
    .select('name');

  const existingNames = new Set(existingCompanies?.map(c => c.name.toLowerCase()) || []);
  console.log(`Found ${existingNames.size} existing companies`);

  // Filter out duplicates
  const newCompanies = companies.filter(c => !existingNames.has(c.name.toLowerCase()));
  console.log(`Adding ${newCompanies.length} new companies`);

  // Prepare companies for insertion
  const companiesToInsert = newCompanies.map(company => ({
    name: company.name,
    website: company.website,
    careers_url: company.careers_url,
    industry: company.industry.split('/')[0].trim(), // Take first industry if multiple
    size: company.size,
    logo_url: getLogoUrl(company.website),
    is_enabled: true,
  }));

  // Insert in batches of 50
  const batchSize = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < companiesToInsert.length; i += batchSize) {
    const batch = companiesToInsert.slice(i, i + batchSize);
    const { error } = await supabase
      .from('scraper_companies')
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} companies`);
    }
  }

  console.log(`\nDone! Inserted ${inserted} companies, ${errors} errors`);
}

addCompanies().catch(console.error);
