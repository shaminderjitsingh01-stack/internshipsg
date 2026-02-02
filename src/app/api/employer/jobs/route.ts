import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Math.random().toString(36).substring(2, 8);
}

export async function POST(request: Request) {
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
      .select('id, industry')
      .eq('email', user.email)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'No company associated with this account' }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      description,
      requirements,
      location,
      work_arrangement,
      duration,
      salary_min,
      salary_max,
      application_url,
    } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const slug = generateSlug(title);

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        company_id: company.id,
        title,
        slug,
        description,
        requirements: requirements || [],
        location: location || 'Singapore',
        work_arrangement: work_arrangement || 'onsite',
        duration,
        salary_min,
        salary_max,
        application_url,
        industry: company.industry,
        is_active: true,
        is_featured: false,
        posted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error('Post job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
