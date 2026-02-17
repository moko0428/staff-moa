'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Loader2 } from 'lucide-react';
import { signInWithKakaoAction } from '../action';

function KakaoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 0.6C4.029 0.6 0 3.726 0 7.554C0 9.918 1.558 12.003 3.931 13.222L2.933 16.77C2.845 17.076 3.196 17.322 3.466 17.142L7.715 14.388C8.136 14.434 8.564 14.46 9 14.46C13.971 14.46 18 11.334 18 7.554C18 3.726 13.971 0.6 9 0.6Z"
        fill="#371D1E"
      />
    </svg>
  );
}

export function KakaoLoginButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithKakaoAction();
      if (result.ok && result.redirectTo) {
        router.push(result.redirectTo);
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="w-full h-12 text-sm font-normal bg-[#FEE500] hover:bg-[#FDD800] text-[#371D1E] border-0"
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <>
          <KakaoIcon />
          <span>카카오 계정으로 계속하기</span>
        </>
      )}
    </Button>
  );
}
