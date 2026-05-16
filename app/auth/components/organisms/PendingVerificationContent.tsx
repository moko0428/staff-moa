'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { resendVerificationAction, verifyEmailOtpAction } from '../../action';
import { createClient } from '@/utils/supabase/client';

interface PendingVerificationContentProps {
  email: string;
  /** 제목 엘리먼트 - 모달은 DialogTitle, 전체 페이지는 h2 */
  titleElement: React.ReactNode;
}

export default function PendingVerificationContent({
  email,
  titleElement,
}: PendingVerificationContentProps) {
  const router = useRouter();
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // 같은 브라우저의 다른 탭에서 인증이 완료되면 자동으로 /post로 이동 (fallback)
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/post?welcome=1');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleResend = async () => {
    const result = await resendVerificationAction(email);
    if (result.ok) {
      toast.success(result.message);
      setCooldown(60);
      setOtpCode('');
      setOtpError('');
    } else {
      toast.error(result.message);
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown]);

  const handleVerify = async () => {
    if (otpCode.length !== 8) {
      setOtpError('8자리 코드를 입력해주세요.');
      return;
    }
    // dev 전용: 12345678 입력 시 즉시 성공
    if (process.env.NODE_ENV === 'development' && otpCode === '12345678') {
      router.push('/post?welcome=1');
      return;
    }

    setVerifying(true);
    setOtpError('');
    const result = await verifyEmailOtpAction(email, otpCode);
    setVerifying(false);
    if (result.ok && result.redirectTo) {
      router.push(result.redirectTo);
    } else {
      setOtpError(result.message);
    }
  };

  return (
    <>
      {/* 아이콘 */}
      <div className="flex justify-center mb-5">
        <div className="bg-primary/10 rounded-full p-5">
          <Mail className="size-10 text-primary" />
        </div>
      </div>

      {/* 제목 (호출부에서 주입) */}
      {titleElement}

      {/* 이메일 */}
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <Mail className="size-3.5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{email}</span>
      </div>

      {/* 단계 안내 */}
      <div className="bg-muted rounded-xl p-4 mb-4 flex flex-col gap-3">
        {[
          '받은 메일함을 확인해주세요',
          '고인력에서 보낸 인증 메일을 열어주세요',
          '메일의 8자리 코드를 아래에 입력해주세요',
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="size-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="text-sm">{step}</span>
          </div>
        ))}
      </div>

      {/* OTP 입력 */}
      <div className="mb-4">
        <input
          type="text"
          inputMode="numeric"
          maxLength={8}
          value={otpCode}
          onChange={(e) => {
            setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8));
            setOtpError('');
          }}
          placeholder="00000000"
          className="w-full text-center text-2xl font-bold tracking-[0.4em] border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {otpError && (
          <p className="mt-1.5 text-xs text-destructive text-center">{otpError}</p>
        )}
      </div>

      {/* 스팸 안내 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex gap-2">
        <span className="text-base">💡</span>
        <p className="text-xs text-amber-800 leading-relaxed">
          메일이 보이지 않나요?{' '}
          <span className="font-semibold">스팸 메일함</span>도 함께 확인해주세요.
        </p>
      </div>

      {/* 버튼 */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleVerify}
          disabled={verifying || otpCode.length !== 8}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50 transition-opacity"
        >
          {verifying ? '인증 중...' : '인증하기'}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="w-full py-3 rounded-xl border border-border font-semibold text-sm disabled:opacity-50 transition-opacity"
        >
          {cooldown > 0 ? `재전송 대기 (${cooldown}초)` : '인증 메일 다시 보내기'}
        </button>
      </div>
    </>
  );
}
