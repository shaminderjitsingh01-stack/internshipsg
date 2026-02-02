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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF and Word documents are allowed.' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // Generate unique filename
    const extension = file.name.split('.').pop();
    const filename = `${user.id}-${Date.now()}.${extension}`;
    const path = `resumes/${filename}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      // If bucket doesn't exist, return a user-friendly message
      if (error.message.includes('not found')) {
        return NextResponse.json({
          error: 'File storage not configured. Please contact support.'
        }, { status: 500 });
      }
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error('Upload resume error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
