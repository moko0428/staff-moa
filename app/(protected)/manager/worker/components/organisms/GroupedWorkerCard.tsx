'use client';

import {
  Card,
  CardContent,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import UserAvatar from '@/app/common/components/UserAvatar';
import {
  Star,
  XCircle,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPastSchedule } from '../../utils/workerHelpers';
import type { GroupedWorker, ApplicationStatus } from '../../types';

interface GroupedWorkerCardProps {
  worker: GroupedWorker;
  onToggleFavorite: (applicantId: string) => void;
  onToggleBlacklist: (applicantId: string) => void;
  onScheduleClick: (scheduleId: string) => void;
  onStatusChange: (scheduleId: string, newStatus: ApplicationStatus) => void;
  onProfileClick: (worker: GroupedWorker) => void;
}

export const GroupedWorkerCard = ({
  worker,
  onToggleFavorite,
  onToggleBlacklist,
  onScheduleClick,
  onStatusChange,
  onProfileClick,
}: GroupedWorkerCardProps) => {
  const getStatusBadge = (status: ApplicationStatus) => {
    const badges = {
      pending: {
        label: '대기',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      },
      accepted: {
        label: '승인',
        className: 'bg-green-100 text-green-700 border-green-200',
      },
      rejected: {
        label: '거절',
        className: 'bg-red-100 text-red-700 border-red-200',
      },
    };
    return badges[status];
  };

  const renderRating = (rating?: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'size-3',
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => onProfileClick(worker)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <UserAvatar src={worker.applicantPhoto} name={worker.applicantName} className="w-12 h-12" />
            <div>
              <h3 className="font-semibold text-lg">{worker.applicantName}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {worker.applicantAge && <span>{worker.applicantAge}세</span>}
                {worker.applicantGender && (
                  <span>· {worker.applicantGender}</span>
                )}
              </div>
              {worker.workerManagement?.rating &&
                renderRating(worker.workerManagement.rating)}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Button
              size="sm"
              variant={
                worker.workerManagement?.is_favorite ? 'default' : 'outline'
              }
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(worker.applicantId);
              }}
              className="h-7 w-7 p-0"
            >
              <Star
                className={cn(
                  'size-3',
                  worker.workerManagement?.is_favorite &&
                    'fill-yellow-400 text-yellow-400'
                )}
              />
            </Button>
            <Button
              size="sm"
              variant={
                worker.workerManagement?.is_blacklisted
                  ? 'destructive'
                  : 'outline'
              }
              onClick={(e) => {
                e.stopPropagation();
                onToggleBlacklist(worker.applicantId);
              }}
              className="h-7 w-7 p-0"
            >
              <XCircle className="size-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 text-sm">
          <Star className="size-4 fill-yellow-400 text-yellow-400" />
          <span className="text-muted-foreground">근태 점수:</span>
          <span className="font-medium">
            {worker.applicantAttendanceScore ?? 50}점
          </span>
        </div>

        {worker.workerManagement?.notes && (
          <div className="mb-3 p-2 bg-muted rounded text-xs text-muted-foreground line-clamp-2">
            {worker.workerManagement.notes}
          </div>
        )}

        <div className="border-t pt-3">
          {worker.schedules.length > 0 && worker.schedules[0].postId !== 0 ? (
            <>
              <p className="text-sm font-medium mb-2 flex items-center gap-1">
                <Calendar className="size-4" />
                지원 내역 ({worker.schedules.length}건)
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {worker.schedules.map((schedule) => {
                  const isPast = isPastSchedule({ postDate: schedule.postDate });
                  const statusBadge = getStatusBadge(
                    isPast ? 'accepted' : schedule.status
                  );
                  return (
                    <div
                      key={schedule.id}
                      className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleClick(schedule.id);
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {schedule.postTitle}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3" />
                                {schedule.postDate || '날짜 미정'}
                              </span>
                              {schedule.postLocation && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3" />
                                  {schedule.postLocation.length > 10
                                    ? `${schedule.postLocation.slice(0, 10)}...`
                                    : schedule.postLocation}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs shrink-0',
                              statusBadge.className
                            )}
                          >
                            {statusBadge.label}
                          </Badge>
                        </div>
                      </div>
                      {!isPast && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                          {schedule.status === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs text-green-600 hover:bg-green-50 hover:text-green-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange(schedule.id, 'accepted');
                                }}
                              >
                                <CheckCircle2 className="size-3 mr-1" />
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange(schedule.id, 'rejected');
                                }}
                              >
                                <XCircle className="size-3 mr-1" />
                                거절
                              </Button>
                            </>
                          ) : schedule.status === 'accepted' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange(schedule.id, 'pending');
                                }}
                              >
                                <Clock className="size-3 mr-1" />
                                대기로
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange(schedule.id, 'rejected');
                                }}
                              >
                                <XCircle className="size-3 mr-1" />
                                거절로
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange(schedule.id, 'pending');
                                }}
                              >
                                <Clock className="size-3 mr-1" />
                                대기로
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs text-green-600 hover:bg-green-50 hover:text-green-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStatusChange(schedule.id, 'accepted');
                                }}
                              >
                                <CheckCircle2 className="size-3 mr-1" />
                                승인으로
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">지원 내역이 없습니다.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
