import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import Link from 'next/link';
import { User } from '@/types/mockData';
import { WorkPart, LegacySlot, isNewPart } from '../../types';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

const PAY_LABEL: Record<string, string> = {
  hourly: '시급',
  daily: '일급',
  weekly: '주급',
  monthly: '월급',
};

interface ApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  currentUser: User | null;
  applicationMessage: string;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
  workSlots?: Array<WorkPart | LegacySlot>;
  selectedPart?: string;
  onPartSelect?: (partName: string) => void;
  returnUrl?: string;
}

const ApplyModal = ({
  open,
  onOpenChange,
  title,
  currentUser,
  applicationMessage,
  onMessageChange,
  onSubmit,
  workSlots,
  selectedPart,
  onPartSelect,
  returnUrl,
}: ApplyModalProps) => {
  // v3 파트 기반 선택
  const newParts = workSlots?.filter(isNewPart) as WorkPart[] | undefined;
  const hasNewParts = newParts && newParts.length > 0;

  // v2 폴백: 현재 슬롯의 파트 선택
  const legacySlots = workSlots?.filter((s) => !isNewPart(s)) as
    | LegacySlot[]
    | undefined;
  const hasMultipleLegacySlots = legacySlots && legacySlots.length > 1;
  const firstLegacySlot = legacySlots?.[0];
  const hasLegacyParts =
    firstLegacySlot?.parts && firstLegacySlot.parts.length > 0;

  const hasParts = hasNewParts || hasLegacyParts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base">{title}에 지원하기</DialogTitle>
        </DialogHeader>
        {currentUser ? (
          <div className="mt-2 space-y-4 text-sm">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {currentUser.name}
                </span>
                님의 기본 정보가 함께 전달됩니다.
              </p>
              <Link
                href="/settings"
                className="text-xs text-primary underline underline-offset-2 shrink-0 ml-2"
                onClick={() => onOpenChange(false)}
              >
                정보 설정
              </Link>
            </div>

            {/* v3: 파트 선택 */}
            {hasNewParts && onPartSelect && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  파트 선택 <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-1.5">
                  {newParts!.map((part, idx) => {
                    const partKey = part.name || `파트 ${idx + 1}`;
                    return (
                      <label
                        key={idx}
                        className={`flex items-start gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
                          selectedPart === partKey
                            ? 'bg-primary/10 border-primary'
                            : 'bg-background border-input hover:bg-muted'
                        }`}
                      >
                        <input
                          type="radio"
                          name="apply-part"
                          value={partKey}
                          checked={selectedPart === partKey}
                          onChange={() => onPartSelect(partKey)}
                          className="size-4 mt-0.5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm">
                              {partKey}
                            </span>
                            {part.pay_amount !== undefined &&
                              part.pay_amount > 0 && (
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {PAY_LABEL[part.pay_type ?? 'daily']}{' '}
                                  {part.pay_amount.toLocaleString()}원
                                </span>
                              )}
                          </div>
                          {part.shifts && part.shifts.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {part.shifts
                                .map((shift) => {
                                  if (shift.date_end) {
                                    const s = format(parseISO(shift.date), 'MM.dd', { locale: ko });
                                    const e = format(parseISO(shift.date_end), 'MM.dd', { locale: ko });
                                    return `${s}~${e} ${shift.start}~${shift.end}`;
                                  }
                                  const dateStr = shift.date
                                    ? format(parseISO(shift.date), 'MM.dd(E)', { locale: ko })
                                    : '';
                                  return `${dateStr} ${shift.start}~${shift.end}`;
                                })
                                .join(', ')}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* v2 폴백: 레거시 파트 선택 */}
            {!hasNewParts && hasLegacyParts && onPartSelect && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  파트 선택 <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-1.5">
                  {firstLegacySlot!.parts!.map((part) => (
                    <label
                      key={part.label}
                      className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
                        selectedPart === part.label
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background border-input hover:bg-muted'
                      }`}
                    >
                      <input
                        type="radio"
                        name="apply-part"
                        value={part.label}
                        checked={selectedPart === part.label}
                        onChange={() => onPartSelect(part.label)}
                        className="size-4"
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="font-medium">
                          파트 {part.label}
                          {part.name ? ` (${part.name})` : ''}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {part.start} - {part.end} · {part.recruit_count}명
                          모집
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* v2 폴백: 다중 날짜 선택 (파트 없는 경우) */}
            {!hasNewParts &&
              !hasLegacyParts &&
              hasMultipleLegacySlots &&
              onPartSelect && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">근무 기간 선택</Label>
                  <div className="flex flex-wrap gap-2">
                    {legacySlots!.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onPartSelect(slot.date)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                          selectedPart === slot.date
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-input hover:bg-muted'
                        }`}
                      >
                        {slot.date}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            <div className="space-y-2">
              <Label
                htmlFor="apply-modal-message"
                className="text-sm font-medium"
              >
                지원 메시지 (선택)
              </Label>
              <Textarea
                id="apply-modal-message"
                placeholder="매니저에게 전할 메시지를 작성해주세요..."
                value={applicationMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                지원 동기, 경력 설명 등을 자유롭게 작성할 수 있습니다.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onMessageChange('');
                }}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onSubmit}
                disabled={hasParts && !selectedPart}
              >
                지원하기
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-2 space-y-4">
            <p className="text-sm text-muted-foreground">
              지원하려면 먼저 로그인해주세요.
            </p>
            <Button type="button" className="w-full" asChild>
              <Link
                href={returnUrl ? `/auth?returnUrl=${encodeURIComponent(returnUrl)}` : '/auth'}
                onClick={() => onOpenChange(false)}
              >
                로그인
              </Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApplyModal;
