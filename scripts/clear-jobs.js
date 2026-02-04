/**
 * Script to clear all job listings from the database
 * Run with: node scripts/clear-jobs.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tdukshouearmiaujcchs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function clearJobs() {
  console.log('Fetching job count...');

  // Get count before deletion
  const { count: beforeCount, error: countError } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error getting count:', countError);
    process.exit(1);
  }

  console.log(`Found ${beforeCount} jobs to delete`);

  if (beforeCount === 0) {
    console.log('No jobs to delete. Done!');
    return;
  }

  // Delete all jobs
  console.log('Deleting all jobs...');
  const { error } = await supabase
    .from('jobs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Error deleting jobs:', error);
    process.exit(1);
  }

  // Verify deletion
  const { count: afterCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Successfully deleted ${beforeCount} jobs`);
  console.log(`Jobs remaining: ${afterCount || 0}`);
}

clearJobs().catch(console.error);
