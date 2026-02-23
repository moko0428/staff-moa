'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import type { LandingPopup as LandingPopupType } from '../popup-actions';

const DISMISS_PREFIX = 'popup_dismiss_until_';

function getDismissKey(popupId: string) {
  return DISMISS_PREFIX + popupId;
}

function isDismissedForToday(popupId: string): boolean {
  try {
    const until = localStorage.getItem(getDismissKey(popupId));
    if (!until) return false;
    return Date.now() < parseInt(until, 10);
  } catch {
    return false;
  }
}

function dismissForDay(popupId: string) {
  try {
    const until = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(getDismissKey(popupId), String(until));
  } catch {
    // ignore
  }
}

interface Props {
  popup: LandingPopupType;
}

export default function LandingPopup({ popup }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isDismissedForToday(popup.popup_id)) {
      setOpen(true);
    }
  }, [popup.popup_id]);

  if (!open) return null;

  const handleClose = () => setOpen(false);

  const handleDismissForDay = () => {
    dismissForDay(popup.popup_id);
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 이미지 */}
        {popup.image_url && (
          <div className="w-full aspect-video overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={popup.image_url}
              alt={popup.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="px-5 pt-5 pb-3 space-y-2">
          <h2 className="text-base font-bold text-gray-900 leading-snug">{popup.title}</h2>
          <p className="text-sm text-gray-500 whitespace-pre-line leading-relaxed">
            {popup.content}
          </p>

          {/* CTA 링크 */}
          {popup.link_url && (
            <div className="pt-1">
              <Button asChild className="w-full" size="sm">
                <Link href={popup.link_url} onClick={handleClose}>
                  {popup.link_text || '자세히 보기'}
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center border-t border-gray-200">
          <button
            onClick={handleDismissForDay}
            className="flex-1 py-3 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            하루 동안 보지 않기
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <button
            onClick={handleClose}
            className="flex-1 py-3 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
        </div>

        {/* X 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-2.5 right-2.5 size-7 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          aria-label="팝업 닫기"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
