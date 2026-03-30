'use client';

import Image from 'next/image';
import { Check, QrCode, X } from 'lucide-react';
import type { StaffEntry } from '../../types';
import { AvatarCircle } from '../atoms/AvatarCircle';

interface Props {
  checkinUrl: string;
  staff: StaffEntry[];
  onCheckin: (id: string) => void;
  onClose: () => void;
}

export function QRModal({ checkinUrl, staff, onCheckin, onClose }: Props) {
  const unchecked = staff.filter((s) => !s.checkedIn);
  const checkedCount = staff.length - unchecked.length;
  const qrImageUrl = checkinUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(checkinUrl)}&size=200x200&margin=10`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center overflow-y-auto py-10 px-6 gap-8"
      onClick={onClose}
    >
      {/* 헤더 */}
      <div className="text-center space-y-1" onClick={(e) => e.stopPropagation()}>
        <p className="text-white/50 text-xs tracking-widest uppercase">출근 체크</p>
        <h2 className="text-white text-2xl font-bold">QR 스캔</h2>
        <p className="text-white/50 text-xs">스탭이 이 QR을 스캔하면 출근이 기록됩니다</p>
      </div>

      {/* QR 코드 */}
      <div
        className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-3 w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {qrImageUrl ? (
          <Image
            src={qrImageUrl}
            alt="출근 QR"
            width={200}
            height={200}
            unoptimized
            className="rounded-xl"
          />
        ) : (
          <QrCode className="size-44 text-black" strokeWidth={0.75} />
        )}
        {staff.length > 0 && (
          <p className="text-xs text-gray-500 font-medium">
            출근 {checkedCount} / {staff.length}명
          </p>
        )}
      </div>

      {/* 미출근 스탭 수동 처리 */}
      {unchecked.length > 0 && (
        <div className="w-full max-w-xs space-y-2" onClick={(e) => e.stopPropagation()}>
          <p className="text-white/50 text-xs text-center">
            — 미출근 스탭 ({unchecked.length}명) —
          </p>
          {unchecked.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onCheckin(s.id)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors text-left"
            >
              <AvatarCircle name={s.name} avatar={s.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{s.name}</p>
                {s.position && (
                  <p className="text-white/50 text-xs truncate">{s.position}</p>
                )}
              </div>
              <span className="text-xs text-white/60 border border-white/20 rounded-full px-2.5 py-1 shrink-0">
                출근
              </span>
            </button>
          ))}
        </div>
      )}

      {unchecked.length === 0 && staff.length > 0 && (
        <div className="text-center space-y-1" onClick={(e) => e.stopPropagation()}>
          <Check className="size-8 mx-auto text-emerald-400" />
          <p className="text-white text-sm font-medium">전원 출근 완료</p>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-2 text-white/70 hover:text-white text-sm border border-white/20 hover:border-white/40 rounded-full px-6 py-2.5 transition-colors"
      >
        <X className="size-4" />
        닫기
      </button>
    </div>
  );
}
