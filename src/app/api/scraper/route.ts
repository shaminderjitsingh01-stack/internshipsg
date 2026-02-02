import { NextResponse } from 'next/server';

// API route to trigger scraper (protected by secret key or same-origin)
export async function POST(request: Request) {
  // Check authorization
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // Allow if: no secret set, valid bearer token, or same-origin request
  const isValidBearer = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isSameOrigin = origin && host && origin.includes(host.split(':')[0]);
  const noSecretSet = !cronSecret;

  if (!isValidBearer && !isSameOrigin && !noSecretSet) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Import scraper dynamically to avoid issues if env vars not set
    const { runScraper } = await import('@/lib/scraper');
    const result = await runScraper();

    return NextResponse.json({
      ...result,
      success: true,
      message: 'Scraper completed',
    });
  } catch (error: any) {
    console.error('Scraper error:', error);
    return NextResponse.json(
      { error: error.message || 'Scraper failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to check scraper status
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Scraper API is ready. Send POST request to run.',
  });
}
