import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { CallbackPageInner } from './callback-inner';

export const dynamic = 'force-dynamic';

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground text-center">
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
