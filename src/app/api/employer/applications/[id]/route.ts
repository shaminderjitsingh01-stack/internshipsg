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

    // Verify application belongs to a job from this company
    const { data: application } = await supabase
      .from('applications')
      .select(`
        id,
        job:jobs!inner(company_id)
      `)
      .eq('id', id)
      .single();

    if (!application || (application.job as any).company_id !== company.id) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const { status } = await request.json();

    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update application error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
