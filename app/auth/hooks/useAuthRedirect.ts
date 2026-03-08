'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuthRedirect = (redirectTo?: string) => {
  const router = useRouter();
  useEffect(() => {
    if (redirectTo) {
      router.push(redirectTo);
    }
  }, [redirectTo, router]);
};
