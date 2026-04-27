'use client';

import { useState } from 'react';
import Link from 'next/link';
import TermsBottomSheet, { type TermsType } from './TermsBottomSheet';
import Image from 'next/image';
import { MessageCircle } from 'lucide-react';

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
          <div className="flex items-start justify-between mb-6">
            {/* 좌측: 회사 정보 텍스트 */}
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>고인력 | ljun925@naver.com</p>
              <p>사업자등록번호: 352-24-02564</p>
            </div>

            {/* 우측: 카카오 오픈채팅 아이콘 */}
            <div className="flex gap-3">
              <a href="https://open.kakao.com/o/seHtamsi" target="_blank" rel="noopener noreferrer"
                 className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-muted">
                  <MessageCircle className="w-5 h-5 text-muted-foreground" />
                </span>
                <span>문의</span>
              </a>
              <a href="https://open.kakao.com/o/gfnl6lsi" target="_blank" rel="noopener noreferrer"
                 className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-muted">
                  <MessageCircle className="w-5 h-5 text-muted-foreground" />
                </span>
                <span>채팅방</span>
              </a>
            </div>
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
