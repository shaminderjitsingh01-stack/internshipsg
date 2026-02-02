'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { loadAnalytics, trackPageView, hasAnalyticsConsent } from '@/lib/cookies';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Load analytics on mount (if consented)
  useEffect(() => {
    if (GA_MEASUREMENT_ID && hasAnalyticsConsent()) {
      loadAnalytics(GA_MEASUREMENT_ID);
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams]);

  // Listen for consent changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cookie_consent' && e.newValue === 'all' && GA_MEASUREMENT_ID) {
        loadAnalytics(GA_MEASUREMENT_ID);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return null; // This component doesn't render anything
}
