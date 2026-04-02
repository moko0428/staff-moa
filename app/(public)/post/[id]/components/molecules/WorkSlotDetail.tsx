import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { WorkSlot } from '../../types';
import { formatNumberWithComma } from '../../utils/post-detail-helpers';

interface WorkSlotDetailProps {
  slots: WorkSlot[];
}

const WorkSlotDetail = ({ slots }: WorkSlotDetailProps) => (
  <div className="space-y-2">
    {slots.map((slot, index) => {
      const hasParts = slot.parts && slot.parts.length > 0;
      const legacyStart = slot.start_time || slot.start;
      const legacyEnd = slot.end_time || slot.end;

      return (
        <div
          key={index}
          className="p-3 bg-muted rounded-lg space-y-2"
        >
          {/* Date + pay */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {format(parseISO(slot.date), 'MM.dd (E)', { locale: ko })}
            </span>
            {slot.pay_amount !== undefined && (
              <span className="text-sm font-medium text-primary">
                {formatNumberWithComma(slot.pay_amount)}원
              </span>
            )}
          </div>

          {/* Parts or legacy time */}
          {hasParts ? (
            <div className="space-y-1">
              {slot.parts!.map((part, pi) => (
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
