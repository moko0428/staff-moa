'use client';

import { useState, useMemo } from 'react';
import * as React from 'react';
import { toast } from 'sonner';
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
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Calendar } from '@/app/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { Plus, X } from 'lucide-react';
import { format, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  createPersonalScheduleAction,
  createPersonalSchedulesBulkAction,
} from '../../actions';
import type { DateMode, ScheduleSlot } from '../../types';

interface Props {
  selectedDate: Date;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPersonalScheduleModal({ selectedDate, onClose, onSuccess }: Props) {
  const [dateMode, setDateMode] = useState<DateMode>('single');
  const [selectedSingleDate, setSelectedSingleDate] = useState<Date | undefined>(selectedDate);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined);
  const [multiDraftDate, setMultiDraftDate] = useState<Date | undefined>(undefined);
  const [multiDraftStart, setMultiDraftStart] = useState('09:00');
  const [multiDraftEnd, setMultiDraftEnd] = useState('18:00');
  const [multiSlots, setMultiSlots] = useState<ScheduleSlot[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    payType: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    payAmount: '',
    description: '',
    managerName: '',
    managerContactType: 'phone' as 'phone' | 'kakao' | 'email' | 'other',
    managerPhone: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDates = useMemo(() => {
    if (dateMode === 'single') {
      return selectedSingleDate ? [format(selectedSingleDate, 'yyyy-MM-dd')] : [];
    }
    if (dateMode === 'range') {
      const from = selectedRange?.from;
      const to = selectedRange?.to ?? selectedRange?.from;
      if (!from || !to) return from ? [format(from, 'yyyy-MM-dd')] : [];
      return eachDayOfInterval({ start: from, end: to }).map((d) => format(d, 'yyyy-MM-dd'));
    }
    return multiSlots.map((s) => s.date).sort();
  }, [dateMode, selectedSingleDate, selectedRange, multiSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error('제목은 필수 입력 항목입니다.');
      return;
    }

    if (dateMode === 'multi') {
      if (multiSlots.length === 0) {
        toast.error('최소 하나의 날짜를 추가해주세요.');
        return;
      }
      const invalid = multiSlots.find((s) => !s.startTime || !s.endTime);
      if (invalid) {
        toast.error('모든 날짜의 시작/종료 시간을 입력해주세요.');
        return;
      }
    } else {
      if (selectedDates.length === 0) {
        toast.error('날짜를 선택해주세요.');
        return;
      }
      if (!formData.startTime || !formData.endTime) {
        toast.error('시작 시간과 종료 시간은 필수 입력 항목입니다.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (dateMode === 'multi') {
        const schedules = multiSlots.map((slot) => ({
          title: formData.title,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: formData.location,
          payType: formData.payType,
          payAmount: formData.payAmount,
          description: formData.description,
          managerName: formData.managerName,
          managerContactType: formData.managerContactType,
          managerPhone: formData.managerPhone,
        }));
        const result = await createPersonalSchedulesBulkAction(schedules);
        if (result.ok) {
          toast.success(result.message);
          onSuccess();
        } else {
          toast.error(result.message);
        }
      } else if (selectedDates.length === 1) {
        const result = await createPersonalScheduleAction({
          title: formData.title,
          date: selectedDates[0],
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
          onSuccess();
        } else {
          toast.error(result.message);
        }
      } else {
        const schedules = selectedDates.map((date) => ({
          title: formData.title,
          date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          payType: formData.payType,
          payAmount: formData.payAmount,
          description: formData.description,
          managerName: formData.managerName,
          managerContactType: formData.managerContactType,
          managerPhone: formData.managerPhone,
        }));
        const result = await createPersonalSchedulesBulkAction(schedules);
        if (result.ok) {
          toast.success(result.message);
          onSuccess();
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error('Failed to create personal schedule:', error);
      toast.error('스케줄 추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>개인 스케줄 추가</DialogTitle>
          <DialogDescription>날짜와 시간을 선택하여 스케줄을 추가합니다</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 제목 */}
          <div>
            <Label htmlFor="ps-title">
              제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ps-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 카페 아르바이트"
              required
            />
          </div>

          {/* 기간 타입 선택 */}
          <div>
            <Label>날짜 선택</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button
                type="button"
                size="sm"
                variant={dateMode === 'single' ? 'default' : 'outline'}
                onClick={() => { setDateMode('single'); setSelectedRange(undefined); setMultiSlots([]); }}
              >
                하루
              </Button>
              <Button
                type="button"
                size="sm"
                variant={dateMode === 'range' ? 'default' : 'outline'}
                onClick={() => { setDateMode('range'); setSelectedSingleDate(undefined); setMultiSlots([]); }}
              >
                기간
              </Button>
              <Button
                type="button"
                size="sm"
                variant={dateMode === 'multi' ? 'default' : 'outline'}
                onClick={() => { setDateMode('multi'); setSelectedSingleDate(undefined); setSelectedRange(undefined); }}
              >
                여러 날짜
              </Button>
              <span className="text-xs text-muted-foreground ml-1">
                {dateMode === 'single' ? '하루만 선택' : dateMode === 'range' ? '시작일~종료일 선택' : '날짜별 시간 지정'}
              </span>
            </div>
          </div>

          {/* 날짜 선택 UI */}
          <div className="rounded-lg border p-3">
            {dateMode === 'single' && (
              <Calendar mode="single" selected={selectedSingleDate} onSelect={(d) => setSelectedSingleDate(d)} />
            )}
            {dateMode === 'range' && (
              <Calendar mode="range" selected={selectedRange} onSelect={(range) => setSelectedRange(range)} />
            )}
            {dateMode === 'multi' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">날짜 선택</Label>
                    <Calendar mode="single" selected={multiDraftDate} onSelect={(d) => setMultiDraftDate(d)} />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">시간 선택</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">시작</Label>
                          <Input type="time" value={multiDraftStart} onChange={(e) => setMultiDraftStart(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">종료</Label>
                          <Input type="time" value={multiDraftEnd} onChange={(e) => setMultiDraftEnd(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => {
                        if (!multiDraftDate || !multiDraftStart || !multiDraftEnd) return;
                        const ds = format(multiDraftDate, 'yyyy-MM-dd');
                        setMultiSlots((prev) => {
                          const exists = prev.some((s) => s.date === ds);
                          const next = exists
                            ? prev.map((s) => s.date === ds ? { ...s, startTime: multiDraftStart, endTime: multiDraftEnd } : s)
                            : [...prev, { date: ds, startTime: multiDraftStart, endTime: multiDraftEnd }];
                          return next.sort((a, b) => a.date.localeCompare(b.date));
                        });
                      }}
                      disabled={!multiDraftDate || !multiDraftStart || !multiDraftEnd}
                    >
                      <Plus className="size-4 mr-2" />
                      추가
                    </Button>

                    <div className="rounded-md border p-3">
                      <p className="text-sm font-medium mb-2">추가된 날짜/시간</p>
                      {multiSlots.length === 0 ? (
                        <p className="text-xs text-muted-foreground">아직 추가된 날짜가 없습니다.</p>
                      ) : (
                        <div className={cn('space-y-2', multiSlots.length >= 2 && 'max-h-48 overflow-y-auto pr-1')}>
                          {multiSlots.map((s) => (
                            <div
                              key={s.date}
                              className="flex flex-col md:flex-row md:items-center gap-2 rounded-md border p-2 bg-primary/5 border-primary/20"
                            >
                              <Badge variant="secondary" className="w-fit">{s.date}</Badge>
                              <div className="grid grid-cols-2 gap-2 flex-1">
                                <Input
                                  type="time"
                                  value={s.startTime}
                                  onChange={(e) =>
                                    setMultiSlots((prev) =>
                                      prev.map((sl) => sl.date === s.date ? { ...sl, startTime: e.target.value } : sl)
                                    )
                                  }
                                />
                                <Input
                                  type="time"
                                  value={s.endTime}
                                  onChange={(e) =>
                                    setMultiSlots((prev) =>
                                      prev.map((sl) => sl.date === s.date ? { ...sl, endTime: e.target.value } : sl)
                                    )
                                  }
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setMultiSlots((prev) => prev.filter((sl) => sl.date !== s.date))}
                                title="삭제"
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 선택된 날짜 요약 */}
          {selectedDates.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">선택 {selectedDates.length}일</Badge>
              {selectedDates.slice(0, 10).map((d) => (
                <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
              ))}
              {selectedDates.length > 10 && (
                <span className="text-xs text-muted-foreground">외 {selectedDates.length - 10}일</span>
              )}
            </div>
          )}

          {/* 시간 (single/range 모드에서만) */}
          {dateMode !== 'multi' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ps-startTime">
                  시작 시간 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ps-startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ps-endTime">
                  종료 시간 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ps-endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          {/* 장소 */}
          <div>
            <Label htmlFor="ps-location">장소</Label>
            <Input
              id="ps-location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="예: 강남역 스타벅스"
            />
          </div>

          {/* 급여 타입 & 급여 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ps-payType">급여 타입</Label>
              <Select
                value={formData.payType}
                onValueChange={(value) => setFormData({ ...formData, payType: value as 'hourly' | 'daily' | 'weekly' | 'monthly' })}
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
              <Label htmlFor="ps-payAmount">급여 (원)</Label>
              <Input
                id="ps-payAmount"
                type="number"
                value={formData.payAmount}
                onChange={(e) => setFormData({ ...formData, payAmount: e.target.value })}
                placeholder="예: 10000"
              />
            </div>
          </div>

          {/* 업무 내용 */}
          <div>
            <Label htmlFor="ps-description">업무 내용</Label>
            <textarea
              id="ps-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="업무 내용을 입력하세요"
              className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* 담당자 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ps-managerName">담당자 이름</Label>
              <Input
                id="ps-managerName"
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                placeholder="예: 김매니저"
              />
            </div>
            <div>
              <Label htmlFor="ps-contactType">연락처 유형</Label>
              <Select
                value={formData.managerContactType}
                onValueChange={(value) => setFormData({ ...formData, managerContactType: value as 'phone' | 'kakao' | 'email' | 'other' })}
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
          </div>
          <div>
            <Label htmlFor="ps-managerPhone">담당자 연락처</Label>
            <Input
              id="ps-managerPhone"
              type={formData.managerContactType === 'email' ? 'email' : formData.managerContactType === 'phone' ? 'tel' : 'text'}
              value={formData.managerPhone}
              onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
              placeholder={
                formData.managerContactType === 'phone' ? '010-1234-5678'
                  : formData.managerContactType === 'kakao' ? '카카오톡 ID'
                  : formData.managerContactType === 'email' ? 'example@email.com'
                  : '연락처 정보'
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>취소</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? '저장 중...' : '저장'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
