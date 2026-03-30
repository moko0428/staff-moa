'use client';

import { Check, Clock, MapPin, MessageSquare } from 'lucide-react';
import type { StaffEntry } from '../../types';
import { POSITION_CONFIG } from '../../constants';
import { formatPhone } from '../../utils';
import { AvatarCircle } from '../atoms/AvatarCircle';
import { MovementBadge } from '../atoms/MovementBadge';
import { PositionBadge } from '../atoms/PositionBadge';
import { PositionDropdown } from './PositionDropdown';

interface Props {
  entry: StaffEntry;
  positions: string[];
  isSelected: boolean;
  memoOpen: boolean;
  onSelect: () => void;
  onPositionChange: (v: string) => void;
  onMemoToggle: () => void;
  onMemoChange: (v: string) => void;
  onNameChange?: (v: string) => void;
  onPhoneChange?: (v: string) => void;
}

export function StaffCard({
  entry,
  positions,
  isSelected,
  memoOpen,
  onSelect,
  onPositionChange,
  onMemoToggle,
  onMemoChange,
  onNameChange,
  onPhoneChange,
}: Props) {
  const positionCfg = POSITION_CONFIG[entry.positionState];
  const phone = formatPhone(entry.phone);

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        isSelected
          ? `border-primary/40 ${positionCfg.cardBg || 'bg-card'}`
          : `border-border ${positionCfg.cardBg || 'bg-card'}`
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 체크박스 */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1 size-4 cursor-pointer accent-primary shrink-0"
        />

        {/* 아바타 */}
        <AvatarCircle name={entry.name} avatar={entry.avatar} />

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {/* 이름 + 이동상태 뱃지 */}
              {onNameChange ? (
                <input
                  type="text"
                  value={entry.name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="이름"
                  autoFocus={!entry.name}
                  className="font-semibold text-sm bg-transparent outline-none border-b border-border focus:border-primary min-w-[60px] w-full max-w-[160px]"
                />
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm leading-snug">{entry.name}</span>
                  {entry.attendanceScore !== null && (
                    <span className="text-xs font-normal text-muted-foreground">
                      ({entry.attendanceScore}점)
                    </span>
                  )}
                  {entry.movementStatus ? (
                    <MovementBadge status={entry.movementStatus} />
                  ) : (
                    <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium shrink-0">
                      대기중
                    </span>
                  )}
                </div>
              )}

              {/* 역할 + 전화번호 */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {positions.length > 0 ? (
                  <PositionDropdown
                    value={entry.position}
                    positions={positions}
                    onChange={onPositionChange}
                  />
                ) : (
                  <input
                    type="text"
                    value={entry.position}
                    onChange={(e) => onPositionChange(e.target.value)}
                    placeholder="역할"
                    className="text-xs text-muted-foreground bg-transparent outline-none border-b border-transparent hover:border-border focus:border-primary w-20 transition-colors"
                  />
                )}
                {onPhoneChange ? (
                  <>
                    {positions.length > 0 && (
                      <span className="text-muted-foreground/30 text-xs">·</span>
                    )}
                    <input
                      type="text"
                      value={entry.phone ?? ''}
                      onChange={(e) => onPhoneChange(e.target.value)}
                      placeholder="전화번호"
                      className="text-xs text-muted-foreground bg-transparent outline-none border-b border-transparent hover:border-border focus:border-primary w-28 transition-colors"
                    />
                  </>
                ) : (
                  phone && (
                    <>
                      <span className="text-muted-foreground/30 text-xs">·</span>
                      <a
                        href={`tel:${entry.phone}`}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        {phone}
                      </a>
                    </>
                  )
                )}
              </div>
            </div>

            {/* 포지션 배지 */}
            <PositionBadge value={entry.positionState} />
          </div>

          {/* 시간 기록 */}
          {(entry.arrivedAt || entry.checkedInAt || entry.checkedOutAt) && (
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
              {entry.arrivedAt && (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <MapPin className="size-3" />
                  {entry.arrivedAt} 도착
                </span>
              )}
              {entry.checkedInAt && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3" />
                  {entry.checkedInAt} 출근
                </span>
              )}
              {entry.checkedOutAt && (
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <Clock className="size-3" />
                  {entry.checkedOutAt} 퇴근
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 메모 */}
      <div className="mt-2.5 pl-[calc(1rem+2.5rem+0.75rem)]">
        <button
          type="button"
          onClick={onMemoToggle}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className={`size-3 ${entry.memo ? 'text-primary' : ''}`} />
          <span className={entry.memo ? 'text-foreground/70' : ''}>
            {entry.memo
              ? entry.memo.length > 50
                ? `${entry.memo.slice(0, 50)}…`
                : entry.memo
              : '메모 추가'}
          </span>
        </button>
        {memoOpen && (
          <textarea
            value={entry.memo}
            onChange={(e) => onMemoChange(e.target.value)}
            placeholder="행사 종료 후 근태 점수 산정에 참고됩니다"
            autoFocus
            className="mt-2 w-full text-xs border rounded-xl p-3 bg-background resize-none outline-none focus:ring-1 focus:ring-ring"
            rows={3}
          />
        )}
      </div>
    </div>
  );
}
