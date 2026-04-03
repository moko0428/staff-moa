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

const WorkSlotDetail = ({ slots }: WorkSlotDetailProps) => (
  <div className="space-y-2">
    {slots.map((slot, index) => {
      if (isNewPart(slot)) {
        // v3: WorkPart with shifts
        const part = slot as WorkPart;
        return (
          <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
            {/* Part name + pay */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {part.name || `파트 ${index + 1}`}
              </span>
              {part.pay_amount !== undefined && part.pay_amount > 0 && (
                <span className="text-sm font-medium text-primary">
                  {PAY_LABEL[part.pay_type ?? 'daily'] ?? '급여'} {formatNumberWithComma(part.pay_amount)}원
                </span>
              )}
            </div>
            {/* Shifts */}
            {part.shifts && part.shifts.length > 0 && (
              <div className="space-y-1">
                {part.shifts.map((shift, si) => (
                  <div
                    key={si}
                    className="flex items-center justify-between text-xs text-muted-foreground bg-background rounded px-2 py-1"
                  >
                    <span className="font-medium text-foreground">
                      {shift.date
                        ? format(parseISO(shift.date), 'MM.dd (E)', { locale: ko })
                        : shift.date}
                    </span>
                    <span>
                      {shift.start} - {shift.end}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* Recruit count */}
            {part.recruit_count > 0 && (
              <p className="text-xs text-muted-foreground">{part.recruit_count}명 모집</p>
            )}
          </div>
        );
      }

      // v2/v1: LegacySlot
      const legacySlot = slot as LegacySlot;
      const hasParts = legacySlot.parts && legacySlot.parts.length > 0;
      const legacyStart = legacySlot.start_time || legacySlot.start;
      const legacyEnd = legacySlot.end_time || legacySlot.end;

      return (
        <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
          {/* Date + pay */}
          <div className="flex items-center justify-between">
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

          {/* Parts or legacy time */}
          {hasParts ? (
            <div className="space-y-1">
              {legacySlot.parts!.map((part, pi) => (
                <div
                  key={pi}
                  className="flex items-center justify-between text-xs text-muted-foreground bg-background rounded px-2 py-1"
                >
                  <span className="font-medium text-foreground">
                    파트 {part.label}{part.name ? ` (${part.name})` : ''}
                  </span>
                  <span>
                    {part.start} - {part.end}
                  </span>
                  <span>{part.recruit_count}명</span>
                </div>
              ))}
            </div>
          ) : legacyStart && legacyEnd ? (
            <p className="text-sm text-muted-foreground">
              {legacyStart} - {legacyEnd}
            </p>
          ) : null}
        </div>
      );
    })}
  </div>
);

export default WorkSlotDetail;
