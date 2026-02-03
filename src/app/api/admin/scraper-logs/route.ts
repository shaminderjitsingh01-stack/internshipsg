import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// GET scraper logs with pagination
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('scraper_logs')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching scraper logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      logs: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/scraper-logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create a new scraper log entry (typically called by the scraper)
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('scraper_logs')
      .insert({
        status: body.status || 'running',
        companies_processed: body.companies_processed || 0,
        jobs_found: body.jobs_found || 0,
        jobs_added: body.jobs_added || 0,
        jobs_skipped: body.jobs_skipped || 0,
        errors: body.errors || [],
        started_at: body.started_at || new Date().toISOString(),
        completed_at: body.completed_at || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating scraper log:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ log: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/scraper-logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
