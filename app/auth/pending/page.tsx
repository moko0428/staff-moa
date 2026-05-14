'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PendingVerificationContent from '../components/organisms/PendingVerificationContent';

const PendingPageInner = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') ?? '';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm bg-background rounded-2xl border shadow-sm p-6">
        <PendingVerificationContent
          email={email}
          titleElement={
            <h2 className="text-center text-lg font-bold mb-3">
              이메일 인증을 진행해주세요
            </h2>
          }
        />
      </div>
    </div>
  );
};

export default function PendingPage() {
  return (
    <Suspense>
      <PendingPageInner />
    </Suspense>
  );
}
