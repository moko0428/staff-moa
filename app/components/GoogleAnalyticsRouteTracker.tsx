'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalyticsRouteTracker({
  gaId,
}: {
  gaId: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!gaId) return;
    if (typeof window === 'undefined') return;
    if (typeof window.gtag !== 'function') return;

    const qs = searchParams?.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;

    // SPA 라우팅에서도 pageview 기록
    window.gtag('config', gaId, { page_path: url });
  }, [gaId, pathname, searchParams]);

  return null;
}

