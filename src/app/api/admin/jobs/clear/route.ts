import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function DELETE() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get count before deletion
    const { count: beforeCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });

    // Delete all jobs
    const { error } = await supabase
      .from('jobs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (neq with impossible ID)

    if (error) {
      console.error('Error clearing jobs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get count after deletion
    const { count: afterCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message: `Deleted ${beforeCount || 0} jobs`,
      before: beforeCount || 0,
      after: afterCount || 0,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
