'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleAuthCallback } from './action';

function CallbackPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      code: searchParams.get('code'),
      token_hash: searchParams.get('token_hash'),
      type: searchParams.get('type'),
    }),
    [searchParams]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await handleAuthCallback(params);
      if (cancelled) return;
      if (!result.ok && result.message) {
        setError(result.message);
      }
      router.replace(result.redirectTo);
    })();
    return () => {
      cancelled = true;
    };
  }, [params, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-sm text-gray-600 text-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p>이메일 인증을 확인하고 있습니다...</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3 text-sm text-gray-600 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p>이메일 인증을 확인하고 있습니다...</p>
          </div>
        </div>
      }
    >
      <CallbackPageInner />
    </Suspense>
  );
}
