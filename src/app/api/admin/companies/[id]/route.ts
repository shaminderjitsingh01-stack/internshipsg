import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET a single scraper company
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('scraper_companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      console.error('Error fetching scraper company:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company: data });
  } catch (error: any) {
    console.error('Error in GET /api/admin/companies/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update a scraper company
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();
    const body = await request.json();

    const updateData: Record<string, any> = {};

    // Only include fields that are present in the request
    if (body.name !== undefined) updateData.name = body.name;
    if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.careers_url !== undefined) updateData.careers_url = body.careers_url;
    if (body.industry !== undefined) updateData.industry = body.industry;
    if (body.size !== undefined) updateData.size = body.size;
    if (body.is_enabled !== undefined) updateData.is_enabled = body.is_enabled;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('scraper_companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      console.error('Error updating scraper company:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company: data });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/companies/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a scraper company
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('scraper_companies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting scraper company:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/companies/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
