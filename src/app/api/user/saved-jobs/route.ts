import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  try {
    // Create a Supabase client with the user's session
    const cookieStore = await cookies();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch saved jobs for this user
    const { data, error } = await supabase
      .from('saved_jobs')
      .select(`
        *,
        job:jobs(*, company:companies(*))
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching saved jobs:', error);
      return NextResponse.json({ error: 'Failed to fetch saved jobs' }, { status: 500 });
    }

    const jobs = data?.map((s) => s.job) || [];

    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error('Saved jobs error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json();

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

    const { error } = await supabase.from('saved_jobs').insert({
      user_id: user.id,
      job_id: jobId,
    });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Job already saved' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

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

    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', jobId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unsave job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
