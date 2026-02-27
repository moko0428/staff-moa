'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Input } from '@/app/components/ui/input';
import { Star, ChevronRight, ChevronLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { parseDateString } from '@/lib/dateUtils';
import { PENALTY_TYPES } from '../../constants';
import type { PenaltyItem } from '../../constants';
import type { ScheduleWithPost } from '../../../types/scheduleTypes';

interface AttendanceReviewModalProps {
  schedule: ScheduleWithPost;
  onClose: () => void;
  onSubmit: (
    postId: string,
    userId: string,
    score: number,
    comment: string,
    penaltyItems?: PenaltyItem[]
  ) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const AttendanceReviewModal = ({
  schedule,
  onClose,
  onSubmit,
  isSubmitting,
}: AttendanceReviewModalProps) => {
  const [selectedParticipant, setSelectedParticipant] = useState<
    ScheduleWithPost['participants'][0] | null
  >(null);
  const [reviewData, setReviewData] = useState<{
    score: number;
    comment: string;
    penaltyItems: PenaltyItem[];
  }>({ score: 0, comment: '', penaltyItems: [] });

  const handleScoreChange = (score: number) => {
    setReviewData((prev) => ({ ...prev, score }));
  };

  const handleCommentChange = (comment: string) => {
    setReviewData((prev) => ({ ...prev, comment }));
  };

  const handlePenaltyToggle = (reason: string, checked: boolean) => {
    setReviewData((prev) => {
      if (checked) {
        const penaltyType = PENALTY_TYPES[reason];
        return {
          ...prev,
          penaltyItems: [...prev.penaltyItems, { reason, deduction: penaltyType.min }],
        };
      } else {
        return {
          ...prev,
          penaltyItems: prev.penaltyItems.filter((item) => item.reason !== reason),
        };
      }
    });
  };

  const handlePenaltyDeductionChange = (reason: string, deduction: number) => {
    const penaltyType = PENALTY_TYPES[reason];
    const clamped = Math.min(Math.max(deduction, penaltyType.min), penaltyType.max);
    setReviewData((prev) => ({
      ...prev,
      penaltyItems: prev.penaltyItems.map((item) =>
        item.reason === reason ? { ...item, deduction: clamped } : item
      ),
    }));
  };

  const totalPenalty = reviewData.penaltyItems.reduce((sum, item) => sum + item.deduction, 0);

  const handleSubmit = () => {
    if (selectedParticipant && reviewData.score > 0 && reviewData.comment.trim()) {
      onSubmit(
        schedule.id,
        selectedParticipant.userId,
        reviewData.score,
        reviewData.comment,
        reviewData.penaltyItems
      );
      setSelectedParticipant(null);
      setReviewData({ score: 0, comment: '', penaltyItems: [] });
    }
  };

  const handleSelectParticipant = (participant: ScheduleWithPost['participants'][0]) => {
    setSelectedParticipant(participant);
    setReviewData({
      score: participant.review?.score || 0,
      comment: participant.review?.comment || '',
      penaltyItems: participant.review?.penaltyItems || [],
    });
  };

  const handleBack = () => {
    setSelectedParticipant(null);
    setReviewData({ score: 0, comment: '', penaltyItems: [] });
  };

  const getScheduleDateDisplay = () => {
    const dates = parseDateString(schedule.date);
    if (dates.length === 0) return '';

    if (dates.length === 1) {
      return format(parseISO(dates[0]), 'yyyy년 MM월 dd일', { locale: ko });
    } else {
      const firstDate = format(parseISO(dates[0]), 'yyyy년 MM월 dd일', { locale: ko });
      const lastDate = format(parseISO(dates[dates.length - 1]), 'MM월 dd일', { locale: ko });
      return `${firstDate} ~ ${lastDate}`;
    }
  };

  const canSubmit = reviewData.score > 0 && reviewData.comment.trim().length > 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            근태 평가 - {schedule.title}
            {selectedParticipant && ` > ${selectedParticipant.userName}`}
          </DialogTitle>
          <DialogDescription>
            {getScheduleDateDisplay()}{' '}
            {selectedParticipant
              ? '지원자의 근태를 평가해주세요.'
              : '평가할 참여자를 선택해주세요.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedParticipant ? (
            schedule.participants.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                참여한 지원자가 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {schedule.participants.map((participant) => {
                  const isReviewed = participant.review !== undefined;

                  return (
                    <Card
                      key={participant.userId}
                      className="p-4 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleSelectParticipant(participant)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-primary">
                              {participant.userName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold">{participant.userName}</h4>
                            {isReviewed && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <Star className="size-3 fill-yellow-400 text-yellow-400" />
                                <span>
                                  평가 완료: {participant.review?.score}점
                                  {participant.review?.penaltyItems &&
                                    participant.review.penaltyItems.length > 0 && (
                                      <span className="text-red-500 ml-1">
                                        · 감점 -{participant.review.penaltyItems.reduce((s, i) => s + i.deduction, 0)}점
                                      </span>
                                    )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isReviewed ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              평가 완료
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              평가 대기
                            </Badge>
                          )}
                          <ChevronRight className="size-5 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          ) : (
            <div className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-2"
              >
                <ChevronLeft className="size-4 mr-1" />
                목록으로 돌아가기
              </Button>

              <Card className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-lg text-primary">
                      {selectedParticipant.userName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">
                      {selectedParticipant.userName}
                    </h4>
                    {selectedParticipant.review && (
                      <Badge variant="outline" className="mt-1">
                        <Star className="size-3 mr-1" />
                        기존 평가: {selectedParticipant.review.score}점
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="score">
                      점수 <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleScoreChange(star * 20)}
                          className={`p-1 ${
                            reviewData.score >= star * 20
                              ? 'text-yellow-400'
                              : 'text-muted-foreground/50'
                          } hover:text-yellow-400 transition-colors`}
                        >
                          <Star className="size-8 fill-current" />
                        </button>
                      ))}
                      <span className="ml-2 text-lg font-semibold text-foreground">
                        {reviewData.score}점
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label>감점 항목</Label>
                    <div className="mt-2 space-y-2 rounded-md border p-3">
                      {Object.entries(PENALTY_TYPES).map(([reason, range]) => {
                        const isChecked = reviewData.penaltyItems.some((item) => item.reason === reason);
                        const currentItem = reviewData.penaltyItems.find((item) => item.reason === reason);
                        return (
                          <div key={reason} className="flex items-center gap-3">
                            <Checkbox
                              id={`penalty-${reason}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => handlePenaltyToggle(reason, !!checked)}
                            />
                            <label
                              htmlFor={`penalty-${reason}`}
                              className="flex-1 text-sm cursor-pointer select-none"
                            >
                              {reason}
                              <span className="text-xs text-muted-foreground ml-1">
                                (-{range.min} ~ -{range.max})
                              </span>
                            </label>
                            {isChecked && (
                              <Input
                                type="number"
                                min={range.min}
                                max={range.max}
                                value={currentItem?.deduction ?? range.min}
                                onChange={(e) =>
                                  handlePenaltyDeductionChange(reason, Number(e.target.value))
                                }
                                className="w-20 h-8 text-sm text-center"
                              />
                            )}
                          </div>
                        );
                      })}
                      {totalPenalty > 0 && (
                        <div className="pt-2 mt-2 border-t flex justify-between items-center">
                          <span className="text-sm font-medium">총 감점</span>
                          <span className="text-sm font-semibold text-red-500">-{totalPenalty}점</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="comment">
                      평가 내용 <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      id="comment"
                      className="w-full min-h-[150px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mt-2"
                      value={reviewData.comment}
                      onChange={(e) => handleCommentChange(e.target.value)}
                      placeholder="근무 태도, 시간 준수, 책임감 등을 평가해주세요."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      취소
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      onClick={handleSubmit}
                      disabled={!canSubmit || isSubmitting}
                    >
                      {isSubmitting
                        ? '저장 중...'
                        : selectedParticipant.review
                          ? '평가 수정'
                          : '평가 저장'}
                    </Button>
                  </div>
                </div>
              </Card>
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
};
