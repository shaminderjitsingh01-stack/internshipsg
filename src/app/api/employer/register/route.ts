import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Math.random().toString(36).substring(2, 6);
}

export async function POST(request: Request) {
  try {
    const { name, email, industry, website, size } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check if company already exists with this email
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Company with this email already exists' }, { status: 400 });
    }

    // Create company
    const slug = generateSlug(name);
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name,
        slug,
        email,
        industry,
        website,
        size,
        location: 'Singapore',
        is_verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }

    return NextResponse.json({ company });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
