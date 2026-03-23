'use client';

import { Check, QrCode, X } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { workerCheckinAction } from './actions';

type Status = 'idle' | 'loading' | 'done' | 'error';

function CheckinContent() {
  const searchParams = useSearchParams();
  const postId = searchParams.get('postId');
  const [status, setStatus] = useState<Status>('idle');

  if (!postId || isNaN(Number(postId))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <X className="size-12 text-destructive opacity-60" />
        <p className="text-muted-foreground text-sm">잘못된 QR 코드입니다.</p>
      </div>
    );
  }

  const handleCheckin = async () => {
    setStatus('loading');
    const result = await workerCheckinAction(Number(postId));
    if (result.ok) {
      setStatus('done');
    } else {
      setStatus('error');
      toast.error(result.message);
    }
  };

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 text-center">
        <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <Check className="size-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">출근 완료!</h1>
          <p className="text-muted-foreground text-sm">오늘도 수고 많으세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-6">
      <QrCode className="size-16 text-primary opacity-50" strokeWidth={1.5} />
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold">출근 확인</h1>
        <p className="text-sm text-muted-foreground">
          버튼을 눌러 오늘 행사 출근을 기록합니다
        </p>
      </div>
      <button
        type="button"
        onClick={handleCheckin}
        disabled={status === 'loading'}
        className="w-full max-w-sm py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base disabled:opacity-60 transition-opacity active:scale-[0.98]"
      >
        {status === 'loading' ? '처리 중...' : '출근 확인하기'}
      </button>
      {status === 'error' && (
        <p className="text-sm text-destructive">
          출근 처리에 실패했습니다. 다시 시도해주세요.
        </p>
      )}
    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-muted-foreground text-sm">
          로딩 중...
        </div>
      }
    >
      <CheckinContent />
    </Suspense>
  );
}
