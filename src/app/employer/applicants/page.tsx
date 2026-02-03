import { Suspense } from 'react';
import ApplicantsPageClient from './ApplicantsPageClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" /></div>}>
      <ApplicantsPageClient />
    </Suspense>
  );
}
