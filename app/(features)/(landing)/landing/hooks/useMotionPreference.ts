'use client';

import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function useMotionPreference() {
  const prefersReducedMotion = useReducedMotion();
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & {
      connection?: { effectiveType: string; saveData: boolean; addEventListener: (e: string, fn: () => void) => void; removeEventListener: (e: string, fn: () => void) => void };
      mozConnection?: typeof nav.connection;
      webkitConnection?: typeof nav.connection;
    };
    const conn = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;

    if (!conn) return;

    const check = () => {
      setIsSlowNetwork(
        conn.effectiveType === '2g' ||
          conn.effectiveType === 'slow-2g' ||
          conn.saveData === true,
      );
    };

    check();
    conn.addEventListener('change', check);
    return () => conn.removeEventListener('change', check);
  }, []);

  return { shouldReduceMotion: !!prefersReducedMotion || isSlowNetwork };
}
