import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role (for scraper and admin operations)
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

// Types
export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  careers_url: string | null;
  description: string | null;
  industry: string | null;
  size: string | null;
  location: string;
  is_verified: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  description: string | null;
  requirements: string | null;
  location: string;
  job_type: string;
  work_arrangement: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: string;
  duration: string | null;
  start_date: string | null;
  application_url: string;
  source: string;
  status: string;
  views: number;
  is_featured: boolean;
  posted_at: string;
  expires_at: string | null;
  created_at: string;
  company?: Company;
}
