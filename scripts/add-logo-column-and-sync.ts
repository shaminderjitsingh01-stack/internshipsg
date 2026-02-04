// Script to add logo_url column and sync companies
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tdukshouearmiaujcchs.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkdWtzaG91ZWFybWlhdWpjY2hzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ2OTIwNywiZXhwIjoyMDg1MDQ1MjA3fQ.7dBCfvYFD2iAYC7NR6aW-aejMJiClC9csH6ymnPa_ns';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function syncCompanies() {
  // First, try to add the logo_url column if it doesn't exist
  console.log('Attempting to add logo_url column...');
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;'
  });

  if (alterError) {
    console.log('Note: Could not add column via RPC, may already exist or need manual addition');
  }

  // Get all scraper companies
  const { data: scraperCompanies, error: fetchError } = await supabase
    .from('scraper_companies')
    .select('*');

  if (fetchError) {
    console.error('Error fetching scraper companies:', fetchError);
    return;
  }

  console.log(`Found ${scraperCompanies?.length} scraper companies`);

  // Get existing main companies
  const { data: existingCompanies } = await supabase
    .from('companies')
    .select('name, slug');

  const existingNames = new Set(existingCompanies?.map(c => c.name.toLowerCase()) || []);
  const existingSlugs = new Set(existingCompanies?.map(c => c.slug) || []);
  console.log(`Found ${existingNames.size} existing companies in main table`);

  // Filter new companies
  const newCompanies = scraperCompanies?.filter(c => !existingNames.has(c.name.toLowerCase())) || [];
  console.log(`Adding ${newCompanies.length} new companies to main table`);

  if (newCompanies.length === 0) {
    console.log('No new companies to add');
    return;
  }

  // Try insertion without logo_url first
  const companiesToInsert = newCompanies.map(company => {
    let slug = generateSlug(company.name);
    let counter = 1;
    while (existingSlugs.has(slug)) {
      slug = `${generateSlug(company.name)}-${counter}`;
      counter++;
    }
    existingSlugs.add(slug);

    return {
      name: company.name,
      slug,
      website: company.website,
      industry: company.industry,
      size: company.size,
      description: `${company.name} offers internship opportunities in Singapore.`,
    };
  });

  // Insert in batches
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < companiesToInsert.length; i += batchSize) {
    const batch = companiesToInsert.slice(i, i + batchSize);
    const { error } = await supabase
      .from('companies')
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} companies`);
    }
  }

  console.log(`\nDone! Inserted ${inserted} companies to main table`);
}

syncCompanies().catch(console.error);
