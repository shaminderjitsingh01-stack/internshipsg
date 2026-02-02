// Cookie consent utilities

export type ConsentLevel = 'all' | 'essential' | null;

/**
 * Get current consent level
 */
export function getConsentLevel(): ConsentLevel {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cookie_consent') as ConsentLevel;
}

/**
 * Check if user has given consent for analytics cookies
 */
export function hasAnalyticsConsent(): boolean {
  return getConsentLevel() === 'all';
}

/**
 * Check if user has given any consent (to hide banner)
 */
export function hasConsent(): boolean {
  return getConsentLevel() !== null;
}

/**
 * Load Google Analytics only if user consented
 * Call this in your layout or _app
 */
export function loadAnalytics(measurementId: string): void {
  if (!hasAnalyticsConsent()) {
    console.log('[Analytics] User did not consent to analytics cookies');
    return;
  }

  // Check if already loaded
  if (typeof window.gtag === 'function') {
    console.log('[Analytics] Already loaded');
    return;
  }

  console.log('[Analytics] Loading Google Analytics...');

  // Load gtag script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId, {
    anonymize_ip: true, // PDPA compliance - anonymize IPs
  });
}

/**
 * Track page view (only if consented)
 */
export function trackPageView(url: string): void {
  if (!hasAnalyticsConsent() || !window.gtag) return;
  window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
    page_path: url,
  });
}

/**
 * Track event (only if consented)
 */
export function trackEvent(action: string, category: string, label?: string, value?: number): void {
  if (!hasAnalyticsConsent() || !window.gtag) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}
