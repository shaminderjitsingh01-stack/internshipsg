import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function DELETE() {
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

    // Delete user data from all tables
    await Promise.all([
      supabase.from('profiles').delete().eq('user_id', user.id),
      supabase.from('saved_jobs').delete().eq('user_id', user.id),
      supabase.from('applications').delete().eq('user_id', user.id),
    ]);

    // Delete user's uploaded files from storage
    const { data: files } = await supabase.storage
      .from('uploads')
      .list(`resumes`, { search: user.id });

    if (files && files.length > 0) {
      const filePaths = files.map(f => `resumes/${f.name}`);
      await supabase.storage.from('uploads').remove(filePaths);
    }

    // Delete the auth user (requires service role key)
    if (supabaseServiceKey) {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
      await adminSupabase.auth.admin.deleteUser(user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
