import { NextResponse } from 'next/server';
import { getJobsFromDB, getStats, getIndustries } from '@/lib/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const industry = searchParams.get('industry') || undefined;

  try {
    const [jobs, stats, industries] = await Promise.all([
      getJobsFromDB(search, industry),
      getStats(),
      getIndustries(),
    ]);

    return NextResponse.json({
      jobs,
      stats,
      industries,
    });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
