'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { ScheduleItem } from '../molecules/ScheduleItem';
import type { ScheduleWithPost } from '../../../types/scheduleTypes';

interface ScheduleStatusColumnProps {
  title: string;
  icon: React.ReactNode;
  schedules: ScheduleWithPost[];
  onScheduleClick: (schedule: ScheduleWithPost) => void;
  clickableCompleted: boolean;
}

const ScheduleStatusColumn = ({
  title,
  icon,
  schedules,
  onScheduleClick,
  clickableCompleted,
}: ScheduleStatusColumnProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-3 overflow-x-auto pb-2 md:block md:overflow-x-visible">
          {schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-0 w-full">
              스케줄이 없습니다.
            </p>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="min-w-[300px] md:min-w-0 md:mb-2"
              >
                <ScheduleItem
                  schedule={schedule}
                  onClick={() => onScheduleClick(schedule)}
                  clickable={clickableCompleted}
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface CardViewProps {
  categorizedSchedules: {
    upcoming: ScheduleWithPost[];
    ongoing: ScheduleWithPost[];
    completed: ScheduleWithPost[];
  };
  onScheduleClick: (schedule: ScheduleWithPost) => void;
}

export const CardView = ({ categorizedSchedules, onScheduleClick }: CardViewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
      <ScheduleStatusColumn
        title="예정 스케줄"
        icon={<Clock className="size-5 text-blue-500" />}
        schedules={categorizedSchedules.upcoming}
        onScheduleClick={onScheduleClick}
        clickableCompleted={false}
      />
      <ScheduleStatusColumn
        title="진행중 스케줄"
        icon={<CalendarIcon className="size-5 text-orange-500" />}
        schedules={categorizedSchedules.ongoing}
        onScheduleClick={onScheduleClick}
        clickableCompleted={false}
      />
      <ScheduleStatusColumn
        title="완료된 스케줄"
        icon={<CheckCircle2 className="size-5 text-green-500" />}
        schedules={categorizedSchedules.completed}
        onScheduleClick={onScheduleClick}
        clickableCompleted={true}
      />
    </div>
  );
};
