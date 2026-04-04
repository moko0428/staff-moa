import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  formatNumberWithComma,
  getPayTypeLabel,
} from '../../utils/post-detail-helpers';

interface WorkInfoGridProps {
  workDate?: string;
  dateEnd?: string;          // 기간 근무 종료일 (전체 date range의 max)
  workTimeStart?: string;
  workTimeEnd?: string;
  workLocation?: string;
  payAmount?: string | number;
  payType?: string;
  taxWithholding?: boolean;
  partCount?: number;        // v3 파트 수
}

const WorkInfoGrid = ({
  workDate,
  dateEnd,
  workTimeStart,
  workTimeEnd,
  workLocation,
  payAmount,
  payType,
  taxWithholding,
  partCount,
}: WorkInfoGridProps) => (
  <div className="grid grid-cols-2 gap-4">
    {workDate && (
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-start gap-1">
          <p className="text-sm text-muted-foreground">근무 기간</p>
          <p className="font-medium">
            {dateEnd
              ? `${format(parseISO(workDate), 'yyyy.MM.dd')} ~ ${format(parseISO(dateEnd), 'yyyy.MM.dd')}`
              : format(parseISO(workDate), 'yyyy년 MM월 dd일 (E)', { locale: ko })}
          </p>
          {partCount !== undefined && partCount > 1 && (
            <p className="text-xs text-muted-foreground">{partCount}개 파트</p>
          )}
        </div>
      </div>
    )}
    {workTimeStart && workTimeEnd && (
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-start gap-1">
          <p className="text-sm text-muted-foreground">근무 시간</p>
          <p className="font-medium">
            {workTimeStart} - {workTimeEnd}
            {partCount !== undefined && partCount > 1 && (
              <span className="text-xs text-muted-foreground ml-1">(파트 1 기준)</span>
            )}
          </p>
        </div>
      </div>
    )}
    {workLocation && (
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-start gap-1">
          <p className="text-sm text-muted-foreground">근무 장소</p>
          <p className="font-medium">{workLocation}</p>
          {partCount !== undefined && partCount > 1 && (
            <p className="text-xs text-muted-foreground">(파트 1 기준)</p>
          )}
        </div>
      </div>
    )}
    {payAmount && (
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-start gap-1">
          <p className="text-sm text-muted-foreground">급여</p>
          <p className="font-medium text-primary">
            {getPayTypeLabel(payType)} {formatNumberWithComma(payAmount)}원
            {taxWithholding && (
              <span className="text-xs text-muted-foreground ml-1">
                (3.3% 공제)
              </span>
            )}
          </p>
          {partCount !== undefined && partCount > 1 && (
            <p className="text-xs text-muted-foreground">(파트 1 기준)</p>
          )}
        </div>
      </div>
    )}
  </div>
);

export default WorkInfoGrid;
