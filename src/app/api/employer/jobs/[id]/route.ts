import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .select('id')
      .eq('email', user.email)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'No company associated with this account' }, { status: 400 });
    }

    // Verify job belongs to this company
    const { data: job } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', id)
      .eq('company_id', company.id)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const body = await request.json();
    const { error } = await supabase
      .from('jobs')
      .update(body)
      .eq('id', id);

    if (error) {
      console.error('Error updating job:', error);
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'No company associated with this account' }, { status: 400 });
    }

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
      .eq('company_id', company.id);

    if (error) {
      console.error('Error deleting job:', error);
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
