'use client';

import { useState } from 'react';
import Link from 'next/link';
import TermsBottomSheet, { type TermsType } from './TermsBottomSheet';
import Image from 'next/image';

export default function Footer() {
  const [openTerms, setOpenTerms] = useState<TermsType | null>(null);

  return (
    <>
      <footer className="w-full bg-background border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* 상단: 로고 + 네비 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="-mt-4 flex items-center">
              <Image
                src="/assets/primary_logo_512.png"
                alt="고인력"
                width={100}
                height={100}
                className=" w-10 h-10"
              />
              <span className="text-2xl font-bold">고인력</span>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                서비스 소개
              </Link>
              <button
                type="button"
                onClick={() => setOpenTerms('service')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                이용약관
              </button>
              <button
                type="button"
                onClick={() => setOpenTerms('privacy')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                개인정보 처리방침
              </button>
            </nav>
          </div>

          {/* 회사 정보 */}
          <div className="space-y-1 mb-6 text-xs text-muted-foreground">
            <p>고인력 &nbsp;|&nbsp; 이준영</p>
            <p>Contact ljun925@naver.com</p>
          </div>

          {/* 구분선 */}
          <div className="border-t border-border mb-6" />

          {/* 하단: 카피라이트 */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} 고인력 All rights reserved.
          </p>
        </div>
      </footer>

      <TermsBottomSheet
        open={openTerms !== null}
        termsType={openTerms ?? 'service'}
        onClose={() => setOpenTerms(null)}
      />
    </>
  );
}
