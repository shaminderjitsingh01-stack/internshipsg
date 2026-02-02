import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
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

    // Fetch all user data
    const [profileResult, savedJobsResult, applicationsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('saved_jobs').select('*, job:jobs(*)').eq('user_id', user.id),
      supabase.from('applications').select('*, job:jobs(*)').eq('user_id', user.id),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      account: {
        email: user.email,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
      },
      profile: profileResult.data || null,
      savedJobs: savedJobsResult.data?.map(sj => ({
        saved_at: sj.created_at,
        job: sj.job,
      })) || [],
      applications: applicationsResult.data?.map(app => ({
        applied_at: app.created_at,
        status: app.status,
        cover_letter: app.cover_letter,
        job: app.job,
      })) || [],
    };

    return NextResponse.json(exportData);
  } catch (error: any) {
    console.error('Export data error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
