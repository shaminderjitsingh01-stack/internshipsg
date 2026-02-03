import { Suspense } from 'react';
import JobsPageClient from './JobsPageClient';

export const dynamic = 'force-dynamic';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <JobsPageClient />
    </Suspense>
  );
}
