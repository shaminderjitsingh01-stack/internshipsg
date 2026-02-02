import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  try {
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
