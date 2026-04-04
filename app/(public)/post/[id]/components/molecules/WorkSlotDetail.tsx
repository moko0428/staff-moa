import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { WorkPart, LegacySlot, isNewPart } from '../../types';
import { formatNumberWithComma } from '../../utils/post-detail-helpers';

const PAY_LABEL: Record<string, string> = {
  hourly: '시급',
  daily: '일급',
  weekly: '주급',
  monthly: '월급',
};

interface WorkSlotDetailProps {
  slots: Array<WorkPart | LegacySlot>;
}

const formatShiftDate = (date: string, dateEnd?: string): string => {
  const start = format(parseISO(date), 'MM.dd (E)', { locale: ko });
  if (dateEnd) {
    const end = format(parseISO(dateEnd), 'MM.dd (E)', { locale: ko });
    return `${start} ~ ${end}`;
  }
  return start;
};

const WorkSlotDetail = ({ slots }: WorkSlotDetailProps) => (
  <div className="space-y-3">
    {slots.map((slot, index) => {
      if (isNewPart(slot)) {
        // v3: WorkPart with shifts
        const part = slot as WorkPart;
        return (
          <div key={index} className="rounded-lg border overflow-hidden">
            {/* 파트 헤더 */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-muted/50 border-b">
              <span className="text-sm font-semibold">
                {part.name || `파트 ${index + 1}`}
              </span>
              {part.pay_amount !== undefined && part.pay_amount > 0 && (
                <span className="text-sm font-medium text-primary">
                  {PAY_LABEL[part.pay_type ?? 'daily'] ?? '급여'}{' '}
                  {formatNumberWithComma(part.pay_amount)}원
                </span>
              )}
            </div>

            {/* 파트 상세 */}
            <div className="px-3 py-3 space-y-2.5">
              {/* 파트 설명 */}
              {part.description && (
                <p className="text-sm text-muted-foreground">{part.description}</p>
              )}

              {/* 장소 */}
              {part.location && (
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground shrink-0">장소</span>
                  <span className="font-medium">{part.location}</span>
                </div>
              )}

              {/* 날짜·시간 목록 */}
              {part.shifts && part.shifts.length > 0 && (
                <div className="space-y-1">
                  {part.shifts.map((shift, si) => (
                    <div
                      key={si}
                      className="flex items-center justify-between text-xs bg-muted rounded px-2.5 py-1.5"
                    >
                      <span className="font-medium text-foreground">
                        {shift.date ? formatShiftDate(shift.date, shift.date_end) : ''}
                      </span>
                      <span className="text-muted-foreground">
                        {shift.start} ~ {shift.end}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* 모집·원천징수·식대 */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {part.recruit_count > 0 && (
                  <span>{part.recruit_count}명 모집</span>
                )}
                {part.tax_withholding && (
                  <span>원천징수 3.3%</span>
                )}
                {part.meal_included && (
                  <span>
                    식대 포함
                    {part.meal_amount && part.meal_amount > 0
                      ? ` (${formatNumberWithComma(part.meal_amount)}원)`
                      : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }

      // v2/v1: LegacySlot
      const legacySlot = slot as LegacySlot;
      const hasParts = legacySlot.parts && legacySlot.parts.length > 0;
      const legacyStart = legacySlot.start_time || legacySlot.start;
      const legacyEnd = legacySlot.end_time || legacySlot.end;

      return (
        <div key={index} className="rounded-lg border overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 bg-muted/50 border-b">
            <span className="text-sm font-medium">
              {legacySlot.date
                ? format(parseISO(legacySlot.date), 'MM.dd (E)', { locale: ko })
                : legacySlot.date}
            </span>
            {legacySlot.pay_amount !== undefined && (
              <span className="text-sm font-medium text-primary">
                {formatNumberWithComma(legacySlot.pay_amount)}원
              </span>
            )}
          </div>

          <div className="px-3 py-2.5 space-y-2">
            {hasParts ? (
              <div className="space-y-1">
                {legacySlot.parts!.map((part, pi) => (
                  <div
                    key={pi}
                    className="flex items-center justify-between text-xs bg-muted rounded px-2.5 py-1.5"
                  >
                    <span className="font-medium text-foreground">
                      파트 {part.label}{part.name ? ` (${part.name})` : ''}
                    </span>
                    <span className="text-muted-foreground">
                      {part.start} - {part.end}
                    </span>
                    <span className="text-muted-foreground">{part.recruit_count}명</span>
                  </div>
                ))}
              </div>
            ) : legacyStart && legacyEnd ? (
              <p className="text-sm text-muted-foreground">
                {legacyStart} - {legacyEnd}
              </p>
            ) : null}
          </div>
        </div>
      );
    })}
  </div>
);

export default WorkSlotDetail;
