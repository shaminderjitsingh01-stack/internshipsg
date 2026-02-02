import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ profile: profile || null });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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

    const body = await request.json();
    const {
      full_name,
      headline,
      bio,
      location,
      phone,
      linkedin_url,
      github_url,
      portfolio_url,
      resume_url,
      skills,
      education,
      university,
      graduation_year,
      is_visible,
      is_open_to_work,
    } = body;

    // Check if profile exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const profileData = {
      user_id: user.id,
      email: user.email,
      full_name,
      headline,
      bio,
      location,
      phone,
      linkedin_url,
      github_url,
      portfolio_url,
      resume_url,
      skills: skills || [],
      education,
      university,
      graduation_year,
      is_visible: is_visible ?? true,
      is_open_to_work: is_open_to_work ?? true,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      result = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving profile:', result.error);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    return NextResponse.json({ profile: result.data });
  } catch (error: any) {
    console.error('Save profile error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
