'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadAnalytics } from '@/lib/cookies';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie_consent', 'all');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShowBanner(false);

    // Load analytics immediately after consent
    if (GA_MEASUREMENT_ID) {
      loadAnalytics(GA_MEASUREMENT_ID);
    }
  };

  const acceptEssential = () => {
    localStorage.setItem('cookie_consent', 'essential');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShowBanner(false);
    // Analytics NOT loaded - user declined
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-white font-semibold">Cookie Consent</h3>
            </div>
            <p className="text-zinc-400 text-sm">
              We use cookies to enhance your experience. Essential cookies are required for the site to function.
              Analytics cookies help us improve our services.{' '}
              <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                Learn more
              </Link>
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={acceptEssential}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
            >
              Essential Only
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
