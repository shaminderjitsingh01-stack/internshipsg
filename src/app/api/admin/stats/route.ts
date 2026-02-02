import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch all stats in parallel
    const [
      jobsResult,
      activeJobsResult,
      companiesResult,
      verifiedCompaniesResult,
      applicationsResult,
      pendingAppsResult,
      jobsThisMonthResult,
      appsThisMonthResult,
    ] = await Promise.all([
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('companies').select('id', { count: 'exact', head: true }).eq('is_verified', true),
      supabase.from('applications').select('id', { count: 'exact', head: true }),
      supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      supabase.from('applications').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    ]);

    // Get user count from profiles (since we can't directly access auth.users)
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    const stats = {
      totalJobs: jobsResult.count || 0,
      activeJobs: activeJobsResult.count || 0,
      totalCompanies: companiesResult.count || 0,
      verifiedCompanies: verifiedCompaniesResult.count || 0,
      totalUsers: usersCount || 0,
      totalApplications: applicationsResult.count || 0,
      pendingApplications: pendingAppsResult.count || 0,
      jobsThisMonth: jobsThisMonthResult.count || 0,
      applicationsThisMonth: appsThisMonthResult.count || 0,
    };

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
