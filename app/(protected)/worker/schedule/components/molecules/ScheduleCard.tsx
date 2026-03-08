import { Badge } from '@/app/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/app/components/ui/card';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { normalizeTimeRangeString, getPerDatePayItems } from '../../utils/scheduleUtils';
import type { ScheduleWithPost, PostWithApplicationStatus } from '../../types';

interface ScheduleCardProps {
  schedule: ScheduleWithPost;
  onClick: () => void;
  compact?: boolean;
  showApplicationStatus?: boolean;
}

const statusConfig = {
  upcoming: { label: '예정', className: 'bg-blue-100 text-blue-700' },
  ongoing: { label: '진행중', className: 'bg-orange-100 text-orange-700' },
  completed: { label: '완료', className: 'bg-green-100 text-green-700' },
};

const applicationStatusConfig = {
  pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  accepted: { label: '승인됨', className: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: '거절됨', className: 'bg-red-100 text-red-700 border-red-200' },
};

const payTypeConfig = {
  hourly: { label: '시급', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  daily: { label: '일급', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  weekly: { label: '주급', className: 'bg-pink-100 text-pink-700 border-pink-200' },
  monthly: { label: '월급', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

export function ScheduleCard({
  schedule,
  onClick,
  compact = false,
  showApplicationStatus = false,
}: ScheduleCardProps) {
  const config = statusConfig[schedule.status];
  const applicationStatus = (schedule as PostWithApplicationStatus).applicationStatus;
  const appStatusConfig = applicationStatus ? applicationStatusConfig[applicationStatus] : null;
  const payType = (schedule as PostWithApplicationStatus).payType || 'daily';
  const payTypeLabel = payTypeConfig[payType];

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow flex-shrink-0',
        compact && 'min-w-[160px] max-w-[calc(50%-6px)]'
      )}
      onClick={onClick}
    >
      <CardHeader className={cn('pb-3', compact && 'pb-1.5 px-3 pt-3')}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className={cn('font-semibold truncate', compact && 'text-sm')}
              title={schedule.title}
            >
              {schedule.title}
            </h3>
            <div className={cn('flex items-center gap-2 flex-wrap', compact ? 'mt-1.5 gap-1' : 'mt-2')}>
              {!showApplicationStatus && (
                <Badge className={cn('text-xs', config.className)}>{config.label}</Badge>
              )}
              {showApplicationStatus && appStatusConfig && (
                <Badge variant="outline" className={cn('text-xs', appStatusConfig.className)}>
                  {appStatusConfig.label}
                </Badge>
              )}
              <Badge variant="outline" className={cn('text-xs', payTypeLabel.className)}>
                {payTypeLabel.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn('pt-0', compact && 'pt-0 px-3 pb-3')}>
        <div className={cn('space-y-2 text-sm', compact && 'space-y-1 text-xs')}>
          <div className={cn('flex items-center gap-2 text-muted-foreground', compact && 'gap-1.5')}>
            <CalendarIcon className={cn('size-4', compact && 'size-3.5')} />
            <span className={compact ? 'truncate' : ''}>{schedule.date}</span>
          </div>
          <div className={cn('flex items-center gap-2 text-muted-foreground', compact && 'gap-1.5')}>
            <Clock className={cn('size-4', compact && 'size-3.5')} />
            <span className={compact ? 'truncate' : ''}>
              {normalizeTimeRangeString(schedule.time) || schedule.time}
            </span>
          </div>
          <div className={cn('flex items-center gap-2 text-muted-foreground', compact && 'gap-1.5')}>
            <span className={compact ? 'text-[10px]' : ''}>📍</span>
            <span className="truncate">{schedule.location}</span>
          </div>
          <div className={cn('flex items-center gap-2 text-muted-foreground', compact && 'gap-1.5')}>
            <span className={compact ? 'text-[10px]' : ''}>💰</span>
            <span className="flex flex-col gap-0.5">
              {(() => {
                const items = getPerDatePayItems(schedule);
                if (items.length === 0) {
                  const label =
                    payType === 'weekly'
                      ? '주급'
                      : payType === 'monthly'
                      ? '월급'
                      : payType === 'hourly'
                      ? '시급'
                      : '일급';
                  return `${schedule.salary.toLocaleString()}원 (${label})`;
                }
                if (items.length <= 1) {
                  const single = items[0];
                  if (payType === 'hourly') {
                    return `${single.payAmount.toLocaleString()}원 (시급 ${schedule.salary.toLocaleString()}원 × ${single.workHours}h)`;
                  }
                  const label =
                    payType === 'weekly' ? '주급' : payType === 'monthly' ? '월급' : '일급';
                  return `${single.payAmount.toLocaleString()}원 (${label})`;
                }
                return (
                  <>
                    {items.map(({ dateStr, payAmount }) => (
                      <span key={dateStr}>
                        {format(parseISO(dateStr), 'M/d', { locale: ko })}: {payAmount.toLocaleString()}원
                      </span>
                    ))}
                  </>
                );
              })()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
