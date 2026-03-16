'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Users } from 'lucide-react';

import { cn } from '@/lib/utils';
import { parseDateString } from '@/lib/dateUtils';
import type { ScheduleWithPost } from '../types/scheduleTypes';

import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import UserAvatar from '@/app/common/components/UserAvatar';

interface ScheduleDetailModalProps {
  schedule: ScheduleWithPost;
  onClose: () => void;
}

export default function ScheduleDetailModal({
  schedule,
  onClose,
}: ScheduleDetailModalProps) {
  // schedule.date를 파싱하여 표시할 날짜 문자열 생성
  const getScheduleDateDisplay = () => {
    const dates = parseDateString(schedule.date);
    if (dates.length === 0) return '';

    if (dates.length === 1) {
      return format(parseISO(dates[0]), 'yyyy년 MM월 dd일 (E)', { locale: ko });
    } else if (schedule.date.includes('~')) {
      const firstDate = format(parseISO(dates[0]), 'yyyy년 MM월 dd일 (E)', {
        locale: ko,
      });
      const lastDate = format(
        parseISO(dates[dates.length - 1]),
        'MM월 dd일 (E)',
        { locale: ko }
      );
      return `${firstDate} ~ ${lastDate}`;
    } else {
      return dates
        .map((d) => format(parseISO(d), 'MM월 dd일 (E)', { locale: ko }))
        .join(', ');
    }
  };

  // 근무 일수 계산 (기간 또는 불연속 날짜 모두 포함)
  const workDates = parseDateString(schedule.date);
  const workDaysCount = workDates.length || 1;
  const totalSalary = workDaysCount * schedule.salary;

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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-sm', statusBadge.className)}
            >
              {statusBadge.label}
            </Badge>
            <DialogTitle>{schedule.title}</DialogTitle>
          </div>
          <DialogDescription>{getScheduleDateDisplay()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    근무 시간
                  </Label>
                  <p className="font-semibold">{schedule.time}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">
                    근무 장소
                  </Label>
                  <p className="font-semibold">{schedule.location}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">급여</Label>
                  <p className="font-semibold text-primary">
                    {totalSalary.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">
                    지급일
                  </Label>
                  <p className="font-semibold">{schedule.paymentDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 모집 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">모집 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">
                  모집 인원
                </Label>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">
                    {schedule.currentApplicants}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">
                    {schedule.recruitCount}명
                  </span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      (schedule.currentApplicants / schedule.recruitCount) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* 상세 설명 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">상세 설명</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">
                  업무 설명
                </Label>
                <p className="mt-1 text-sm leading-relaxed">
                  {schedule.description}
                </p>
              </div>
              {schedule.preparation && (
                <div>
                  <Label className="text-sm text-muted-foreground">
                    준비사항
                  </Label>
                  <p className="mt-1 text-sm leading-relaxed">
                    {schedule.preparation}
                  </p>
                </div>
              )}
              {schedule.requirements && (
                <div>
                  <Label className="text-sm text-muted-foreground">
                    자격 요건
                  </Label>
                  <p className="mt-1 text-sm leading-relaxed">
                    {schedule.requirements}
                  </p>
                </div>
              )}
              {schedule.preferences && (
                <div>
                  <Label className="text-sm text-muted-foreground">
                    우대 사항
                  </Label>
                  <p className="mt-1 text-sm leading-relaxed">
                    {schedule.preferences}
                  </p>
                </div>
              )}
              {schedule.notes && (
                <div>
                  <Label className="text-sm text-muted-foreground">
                    기타 사항
                  </Label>
                  <p className="mt-1 text-sm leading-relaxed">
                    {schedule.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 참여자 목록 (예정/진행중/완료 공통) */}
          {schedule.participants && schedule.participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="size-4" />
                  참여자 목록
                  <Badge variant="secondary" className="ml-auto">
                    {schedule.participants.length}명
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {schedule.participants.map((p) => {
                  const isReviewed = !!p.review;
                  return (
                    <div
                      key={p.userId}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted"
                    >
                      {/* 아바타 */}
                      <UserAvatar src={p.avatar} name={p.userName} className="w-12 h-12 border-2 border-white shadow-sm" fallbackClassName="text-lg" />
                      {/* 정보 */}
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {p.userName}
                          </span>
                          {isReviewed && (
                            <Badge variant="outline" className="text-xs">
                              {p.review?.score}점
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                          {p.phone && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-16">
                                전화번호
                              </span>
                              <a
                                href={`tel:${p.phone}`}
                                className="text-primary hover:underline"
                              >
                                {p.phone}
                              </a>
                            </div>
                          )}
                          {p.kakaoId && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-16">
                                카카오톡
                              </span>
                              <span className="text-foreground">
                                {p.kakaoId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* 매니저 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">담당자 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">담당자</Label>
                <p className="font-semibold">{schedule.managerInfo.name}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">연락처</Label>
                <p className="font-semibold">{schedule.managerInfo.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* 키워드 */}
          {schedule.keywords && schedule.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {schedule.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
