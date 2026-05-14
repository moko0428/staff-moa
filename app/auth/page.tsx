'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import EmailLoginForm from './components/organisms/EmailLoginForm';
import SignUpFormBase from './components/organisms/SignUpFormBase';
import { KakaoLoginButton } from './components/KakaoLoginButton';
import Link from 'next/link';

type Tab = 'login' | 'join';

/* ─────────────────────────────────────────
   메인 페이지 (searchParams 접근)
───────────────────────────────────────── */
const AuthPageInner = () => {
  const [tab, setTab] = useState<Tab>('login');
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') ?? undefined;

  const logoSection = (
    <div className="bg-primary px-4 pt-16 pb-14 flex flex-col items-center gap-4 md:flex-1 md:justify-center md:pt-0 md:pb-0">
      <Link href="/">
        <Image
          src="/assets/white_text_logo.png"
          alt="고인력"
          width={100}
          height={100}
          className="h-60 w-auto -mt-20 md:mt-0"
          priority
        />
      </Link>
      <p className="text-white/80 text-md tracking-wide font-bold -mt-20">
        스팟워커 구인구직 플랫폼
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {logoSection}

      <div className="flex-1 bg-background px-4 pt-6 pb-12 flex flex-col gap-6 md:flex-none md:w-mobile md:justify-center md:px-10">
        {/* 탭 */}
        <div className="flex rounded-xl bg-muted p-1">
          {(['login', 'join'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === t
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {t === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* 폼 */}
        {tab === 'login' ? (
          <div className="flex flex-col gap-5">
            <EmailLoginForm
              onJoinClick={() => setTab('join')}
              returnUrl={returnUrl}
            />
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">또는</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <KakaoLoginButton label="카카오 로그인" returnUrl={returnUrl} />
          </div>
        ) : (
          <SignUpFormBase role="member" onLoginClick={() => setTab('login')} />
        )}
      </div>
    </div>
  );
};

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}
