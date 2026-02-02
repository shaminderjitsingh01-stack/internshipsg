import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Get company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if company already has an owner
    if (company.email && company.email !== user.email) {
      // Company already claimed by someone else
      // In production, you'd create a claim request for review
      return NextResponse.json({
        error: 'This company is already claimed. Contact support if you believe this is an error.'
      }, { status: 400 });
    }

    // Update company with user's email
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        email: user.email,
        // In production, set is_verified to false until admin approves
        // For now, auto-verify for demo purposes
        is_verified: true,
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('Error claiming company:', updateError);
      return NextResponse.json({ error: 'Failed to claim company' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Claim error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
