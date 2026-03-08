'use client';

import { Badge } from '@/app/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { parseDateString } from '@/lib/dateUtils';
import type { ScheduleWithPost } from '../../../types/scheduleTypes';

interface ScheduleItemProps {
  schedule: ScheduleWithPost;
  onClick: () => void;
  clickable?: boolean;
}

export const ScheduleItem = ({ schedule, onClick, clickable }: ScheduleItemProps) => {
  const statusBadge = {
    upcoming: {
      label: '예정',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    ongoing: {
      label: '진행중',
      className: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    completed: {
      label: '완료',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
  }[schedule.status];

  const isClickable = clickable || schedule.status !== 'completed';

  return (
    <div
      className={`p-3 border rounded-lg ${
        isClickable
          ? 'cursor-pointer hover:bg-muted hover:border-primary transition-colors'
          : ''
      }`}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={cn('text-xs', statusBadge.className)}
            >
              {statusBadge.label}
            </Badge>
            <h3 className="font-semibold text-sm truncate">{schedule.title}</h3>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-1">
              <CalendarIcon className="size-3 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
                {(() => {
                  const dates = parseDateString(schedule.date);
                  if (dates.length === 0) return schedule.date;

                  if (dates.length === 1) {
                    return format(parseISO(dates[0]), 'yyyy.MM.dd (E)', {
                      locale: ko,
                    });
                  } else if (schedule.date.includes('~')) {
                    const firstDate = format(parseISO(dates[0]), 'MM.dd', {
                      locale: ko,
                    });
                    const lastDate = format(
                      parseISO(dates[dates.length - 1]),
                      'MM.dd (E)',
                      { locale: ko }
                    );
                    return `${firstDate} ~ ${lastDate}`;
                  } else {
                    return `${format(parseISO(dates[0]), 'MM.dd', {
                      locale: ko,
                    })} 외 ${dates.length - 1}일`;
                  }
                })()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {schedule.time}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">📍</span>
              <span className="text-xs text-muted-foreground">
                {schedule.location}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Users className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              참여자: {schedule.participants.length}명
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
