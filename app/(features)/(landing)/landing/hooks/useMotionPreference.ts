'use client';

import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function useMotionPreference() {
  const prefersReducedMotion = useReducedMotion();
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);

  useEffect(() => {
    const conn =
      (navigator as any).connection ??
      (navigator as any).mozConnection ??
      (navigator as any).webkitConnection;

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
