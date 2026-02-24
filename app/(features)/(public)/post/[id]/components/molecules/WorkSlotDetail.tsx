import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { WorkSlot } from '../../types';
import { formatNumberWithComma } from '../../utils/post-detail-helpers';

interface WorkSlotDetailProps {
  slots: WorkSlot[];
}

const WorkSlotDetail = ({ slots }: WorkSlotDetailProps) => (
  <div className="space-y-2">
    {slots.map((slot, index) => (
      <div
        key={index}
        className="flex items-center justify-between p-3 bg-muted rounded-lg"
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {format(parseISO(slot.date), 'MM.dd (E)', { locale: ko })}
          </span>
          <span className="text-sm text-muted-foreground">
            {slot.start_time || slot.start} - {slot.end_time || slot.end}
          </span>
        </div>
        <span className="text-sm font-medium text-primary">
          {formatNumberWithComma(slot.pay_amount)}원
        </span>
      </div>
    ))}
  </div>
);

export default WorkSlotDetail;
