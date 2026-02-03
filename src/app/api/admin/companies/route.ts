import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// GET all scraper companies
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const enabled = searchParams.get('enabled');

    let query = supabase
      .from('scraper_companies')
      .select('*')
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,industry.ilike.%${search}%`);
    }

    if (enabled === 'true') {
      query = query.eq('is_enabled', true);
    } else if (enabled === 'false') {
      query = query.eq('is_enabled', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching scraper companies:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ companies: data || [] });
  } catch (error: any) {
    console.error('Error in GET /api/admin/companies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create a new scraper company
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const { name, logo_url, website, careers_url, industry, size, is_enabled } = body;

    if (!name || !careers_url) {
      return NextResponse.json(
        { error: 'Name and careers URL are required' },
        { status: 400 }
      );
    }

    // Check if company with same name already exists
    const { data: existing } = await supabase
      .from('scraper_companies')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A company with this name already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('scraper_companies')
      .insert({
        name,
        logo_url: logo_url || null,
        website: website || null,
        careers_url,
        industry: industry || null,
        size: size || null,
        is_enabled: is_enabled !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating scraper company:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/companies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
