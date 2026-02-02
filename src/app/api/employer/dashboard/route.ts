import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company by user email
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('email', user.email)
      .single();

    if (!company) {
      return NextResponse.json({ company: null, jobs: [], applications: [] });
    }

    // Get jobs for this company
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    // Get applications for company's jobs
    const jobIds = jobs?.map(j => j.id) || [];
    let applications: any[] = [];

    if (jobIds.length > 0) {
      const { data: apps } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(id, title, slug)
        `)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      applications = apps || [];
    }

    return NextResponse.json({
      company,
      jobs: jobs || [],
      applications,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
