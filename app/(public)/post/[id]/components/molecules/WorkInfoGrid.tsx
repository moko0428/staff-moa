import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { WorkSlot } from '../../types';
import {
  formatNumberWithComma,
  getPayTypeLabel,
} from '../../utils/post-detail-helpers';

interface WorkInfoGridProps {
  workDate?: string;
  workTimeStart?: string;
  workTimeEnd?: string;
  workLocation?: string;
  payAmount?: string | number;
  payType?: string;
  firstSlot?: WorkSlot;
  totalSlots?: number;
}

const WorkInfoGrid = ({
  workDate,
  workTimeStart,
  workTimeEnd,
  workLocation,
  payAmount,
  payType,
  firstSlot,
  totalSlots = 1,
}: WorkInfoGridProps) => (
  <div className="grid grid-cols-2 gap-4">
    {workDate && (
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">근무일</p>
          <p className="font-medium">
            {totalSlots > 1
              ? `${format(parseISO(workDate), 'yyyy.MM.dd')} 외 ${totalSlots - 1}일`
              : format(parseISO(workDate), 'yyyy년 MM월 dd일 (E)', {
                  locale: ko,
                })}
          </p>
        </div>
      </div>
    )}
    {workTimeStart && workTimeEnd && (
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">근무 시간</p>
          <p className="font-medium">
            {workTimeStart} - {workTimeEnd}
          </p>
        </div>
      </div>
    )}
    {workLocation && (
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">근무 장소</p>
          <p className="font-medium">{workLocation}</p>
        </div>
      </div>
    )}
    {payAmount && (
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">급여</p>
          <p className="font-medium text-primary">
            {getPayTypeLabel(payType)} {formatNumberWithComma(payAmount)}원
            {firstSlot?.tax_withholding && (
              <span className="text-xs text-muted-foreground ml-1">
                (3.3% 공제)
              </span>
            )}
          </p>
        </div>
      </div>
    )}
  </div>
);

export default WorkInfoGrid;
