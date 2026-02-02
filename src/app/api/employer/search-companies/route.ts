import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ companies: [] });
    }

    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, slug, industry, is_verified')
      .ilike('name', `%${query}%`)
      .limit(10);

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ companies: [] });
    }

    return NextResponse.json({ companies: companies || [] });
  } catch (error: any) {
    console.error('Search companies error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
