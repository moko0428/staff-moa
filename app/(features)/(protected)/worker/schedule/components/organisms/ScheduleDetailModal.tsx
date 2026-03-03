'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Clock, Calendar as CalendarIcon, Pencil, X, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  updatePersonalScheduleAction,
  deletePersonalScheduleAction,
  cancelApplicationAction,
} from '../../actions';
import {
  normalizeTimeRangeString,
  getPerDatePayItems,
} from '../../utils/scheduleUtils';
import type { ScheduleWithPost, PostWithApplicationStatus } from '../../types';

interface Props {
  schedule: ScheduleWithPost;
  onClose: () => void;
  onRefresh: () => void;
}

const statusConfig = {
  upcoming: { label: '예정', className: 'bg-blue-100 text-blue-700' },
  ongoing: { label: '진행중', className: 'bg-orange-100 text-orange-700' },
  completed: { label: '완료', className: 'bg-green-100 text-green-700' },
};

export function ScheduleDetailModal({ schedule, onClose, onRefresh }: Props) {
  const isPersonalSchedule = schedule.id.startsWith('personal-');
  const personalScheduleId = isPersonalSchedule ? schedule.id.replace('personal-', '') : null;

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const parseTime = (timeStr: string) => {
    const match = timeStr.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
    if (match) return { startTime: match[1], endTime: match[2] };
    return { startTime: '', endTime: '' };
  };

  const { startTime, endTime } = parseTime(schedule.time);

  const [formData, setFormData] = useState({
    title: schedule.title,
    date: schedule.date,
    startTime,
    endTime,
    location: schedule.location || '',
    payType: ((schedule as PostWithApplicationStatus).payType || 'daily') as
      | 'hourly'
      | 'daily'
      | 'weekly'
      | 'monthly',
    payAmount: schedule.salary?.toString() || '',
    description: schedule.description || '',
    managerName: schedule.managerInfo?.name || '',
    managerContactType: (schedule.managerInfo?.contactType || 'phone') as
      | 'phone'
      | 'kakao'
      | 'email'
      | 'other',
    managerPhone: schedule.managerInfo?.phone || '',
  });

  const config = statusConfig[schedule.status];

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setIsDeleting(true);
    try {
      if (isPersonalSchedule && personalScheduleId) {
        const result = await deletePersonalScheduleAction(personalScheduleId);
        if (result.ok) {
          toast.success(result.message);
          onRefresh();
          onClose();
        } else {
          toast.error(result.message);
        }
      } else if (schedule.applicationId) {
        const result = await cancelApplicationAction(schedule.applicationId);
        if (result.ok) {
          toast.success(result.message);
          onRefresh();
          onClose();
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      toast.error('삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    if (!personalScheduleId) return;
    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast.error('제목, 시작 시간, 종료 시간은 필수 입력 항목입니다.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updatePersonalScheduleAction(personalScheduleId, {
        title: formData.title,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        payType: formData.payType,
        payAmount: formData.payAmount,
        description: formData.description,
        managerName: formData.managerName,
        managerContactType: formData.managerContactType,
        managerPhone: formData.managerPhone,
      });
      if (result.ok) {
        toast.success(result.message);
        onRefresh();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Failed to update schedule:', error);
      toast.error('수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const payType = (schedule as PostWithApplicationStatus).payType || 'daily';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              {isEditMode ? (
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-xl font-semibold"
                  placeholder="제목"
                />
              ) : (
                <DialogTitle className="text-xl">{schedule.title}</DialogTitle>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isPersonalSchedule && !isEditMode && (
                <Button size="sm" variant="outline" onClick={() => setIsEditMode(true)} className="flex items-center gap-1">
                  <Pencil className="size-4" />
                  수정
                </Button>
              )}
              {isPersonalSchedule && isEditMode && (
                <Button size="sm" variant="outline" onClick={() => setIsEditMode(false)} className="flex items-center gap-1">
                  <X className="size-4" />
                  취소
                </Button>
              )}
            </div>
          </div>
          {!isEditMode && (
            <div className="flex items-center gap-2 mt-2">
              <Badge className={cn('text-xs', config.className)}>{config.label}</Badge>
              {isPersonalSchedule && (
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  개인 일정
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 업무 정보 */}
          <div>
            <h3 className="font-semibold mb-2">업무 정보</h3>
            {isEditMode ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-date">날짜</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-startTime">시작 시간</Label>
                    <Input
                      id="edit-startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-endTime">종료 시간</Label>
                    <Input
                      id="edit-endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-location">장소</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="장소"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-payType">급여 타입</Label>
                    <Select
                      value={formData.payType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, payType: value as typeof formData.payType })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">시급</SelectItem>
                        <SelectItem value="daily">일급</SelectItem>
                        <SelectItem value="weekly">주급</SelectItem>
                        <SelectItem value="monthly">월급</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-payAmount">급여 (원)</Label>
                    <Input
                      id="edit-payAmount"
                      type="number"
                      value={formData.payAmount}
                      onChange={(e) => setFormData({ ...formData, payAmount: e.target.value })}
                      placeholder="급여"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="size-4" />
                  <span>{schedule.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4" />
                  <span>{normalizeTimeRangeString(schedule.time) || schedule.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{schedule.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💰</span>
                  <span className="flex flex-col gap-1">
                    {(() => {
                      const items = getPerDatePayItems(schedule);
                      if (items.length === 0) {
                        const label =
                          payType === 'weekly' ? '주급' : payType === 'monthly' ? '월급' : payType === 'hourly' ? '시급' : '일급';
                        return `${schedule.salary.toLocaleString()}원 (${label})`;
                      }
                      if (items.length <= 1) {
                        const single = items[0];
                        if (payType === 'hourly') {
                          return `${single.payAmount.toLocaleString()}원 (시급 ${schedule.salary.toLocaleString()}원 × ${single.workHours}h)`;
                        }
                        const label = payType === 'weekly' ? '주급' : payType === 'monthly' ? '월급' : '일급';
                        return `${single.payAmount.toLocaleString()}원 (${label})`;
                      }
                      return (
                        <>
                          {items.map(({ dateStr, workHours, payAmount }) => (
                            <span key={dateStr}>
                              {format(parseISO(dateStr), 'yyyy.MM.dd (E)', { locale: ko })}: {payAmount.toLocaleString()}원
                              {payType === 'hourly' && ` (${workHours}h × 시급)`}
                            </span>
                          ))}
                        </>
                      );
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 업무 내용 */}
          <div>
            <h3 className="font-semibold mb-2">업무 내용</h3>
            {isEditMode ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="업무 내용"
                className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {schedule.description || '없음'}
              </p>
            )}
          </div>

          {/* 담당자 정보 */}
          <div>
            <h3 className="font-semibold mb-2">담당자 정보</h3>
            {isEditMode ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-managerName">이름</Label>
                  <Input
                    id="edit-managerName"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    placeholder="담당자 이름"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contactType">연락처 유형</Label>
                  <Select
                    value={formData.managerContactType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, managerContactType: value as typeof formData.managerContactType })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">전화번호</SelectItem>
                      <SelectItem value="kakao">카카오톡 ID</SelectItem>
                      <SelectItem value="email">이메일</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-managerPhone">연락처</Label>
                  <Input
                    id="edit-managerPhone"
                    type={
                      formData.managerContactType === 'email'
                        ? 'email'
                        : formData.managerContactType === 'phone'
                        ? 'tel'
                        : 'text'
                    }
                    value={formData.managerPhone}
                    onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                    placeholder={
                      formData.managerContactType === 'phone'
                        ? '010-1234-5678'
                        : formData.managerContactType === 'kakao'
                        ? '카카오톡 ID'
                        : formData.managerContactType === 'email'
                        ? 'example@email.com'
                        : '연락처 정보'
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <div>이름: {schedule.managerInfo?.name || '없음'}</div>
                <div>
                  {schedule.managerInfo?.contactType === 'kakao'
                    ? '카카오톡'
                    : schedule.managerInfo?.contactType === 'email'
                    ? '이메일'
                    : schedule.managerInfo?.contactType === 'other'
                    ? '연락처'
                    : '전화번호'}
                  : {schedule.managerInfo?.phone || '없음'}
                </div>
              </div>
            )}
          </div>

          {!isEditMode && schedule.notes && (
            <div>
              <h3 className="font-semibold mb-2">참고사항</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">{schedule.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {isEditMode ? (
            <>
              <Button variant="outline" onClick={() => setIsEditMode(false)} disabled={isSubmitting}>
                취소
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? '저장 중...' : '저장'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1"
              >
                <Trash2 className="size-4" />
                {isDeleting ? '삭제 중...' : '스케줄 삭제'}
              </Button>
              <Button variant="outline" onClick={onClose}>닫기</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
