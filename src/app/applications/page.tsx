import { Suspense } from 'react';
import ApplicationsClient from './ApplicationsClient';

export const dynamic = 'force-dynamic';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ApplicationsClient />
    </Suspense>
  );
}
