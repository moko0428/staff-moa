'use client';

import { useEffect } from 'react';

export default function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('[SwRegister] Service Worker registration failed:', err);
      });
    }
  }, []);

  return null;
}
