'use client';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Plus, X } from 'lucide-react';
import type { WorkPart, WorkShift } from '../../../types';

interface EditWorkSlotsCardProps {
  workParts: WorkPart[];
  fieldErrors?: Record<string, string>;
  onAddPart: () => void;
  onRemovePart: (partIndex: number) => void;
  onUpdatePart: (partIndex: number, patch: Partial<Omit<WorkPart, 'shifts'>>) => void;
  onAddShift: (partIndex: number) => void;
  onRemoveShift: (partIndex: number, shiftIndex: number) => void;
  onUpdateShift: (partIndex: number, shiftIndex: number, field: keyof WorkShift, value: string) => void;
}

export const EditWorkSlotsCard = ({
  workParts,
  fieldErrors,
  onAddPart,
  onRemovePart,
  onUpdatePart,
  onAddShift,
  onRemoveShift,
  onUpdateShift,
}: EditWorkSlotsCardProps) => {
  return (
    <Card className="py-0 gap-2">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-0 pb-2">
        <CardTitle>근무 정보</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={onAddPart}>
          <Plus className="size-4 mr-1" />
          파트 추가
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {workParts.map((part, partIndex) => (
          <div
            key={partIndex}
            className="rounded-lg p-4 space-y-4 bg-muted/20"
          >
            {/* Part header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">
                파트 {partIndex + 1}
              </span>
              {workParts.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemovePart(partIndex)}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>

            {/* Part name */}
            <div className="flex flex-col gap-0.5">
              <Label className="text-xs text-muted-foreground">파트 이름 (선택)</Label>
              <Input
                value={part.name}
                onChange={(e) => onUpdatePart(partIndex, { name: e.target.value })}
                placeholder="예: 세팅/철수 파트"
                className="h-8 text-sm"
              />
            </div>

            {/* Part description */}
            <div className="flex flex-col gap-0.5">
              <Label className="text-xs text-muted-foreground">내용 (선택)</Label>
              <Textarea
                value={part.description ?? ''}
                onChange={(e) => onUpdatePart(partIndex, { description: e.target.value })}
                placeholder="파트 업무 내용을 간략히 작성해주세요."
                rows={2}
                className="text-sm"
              />
            </div>

            {/* Shifts */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-sm font-semibold">
                    근무 시간 <span className="text-red-500">*</span>
                  </span>
                  <span className="text-sm font-semibold">
                    근무 기간 <span className="text-red-500">*</span>
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAddShift(partIndex)}
                >
                  <Plus className="size-3 mr-1" />
                  날짜 추가
                </Button>
              </div>

              {part.shifts.map((shift, shiftIndex) => (
                <div
                  key={shiftIndex}
                  className="flex flex-col gap-2 rounded-md p-2 bg-background md:flex-row md:items-end md:gap-2"
                >
                  <div className="flex w-full min-w-0 flex-col gap-0.5 md:flex-1">
                    <Label className="text-xs text-muted-foreground">날짜</Label>
                    <Input
                      type="date"
                      value={shift.date}
                      onChange={(e) =>
                        onUpdateShift(partIndex, shiftIndex, 'date', e.target.value)
                      }
                      className="h-8 w-full min-w-0 text-sm"
                      required
                    />
                  </div>
                  <div className="flex w-full min-w-0 items-end gap-2 md:w-auto md:shrink-0">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:w-24 md:flex-initial">
                      <Label className="text-xs text-muted-foreground">시작</Label>
                      <Input
                        type="time"
                        value={shift.start}
                        onChange={(e) =>
                          onUpdateShift(partIndex, shiftIndex, 'start', e.target.value)
                        }
                        className="h-8 w-full min-w-0 text-sm"
                        required
                      />
                    </div>
                    <span className="shrink-0 pb-1 text-muted-foreground text-sm">
                      ~
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:w-24 md:flex-initial">
                      <Label className="text-xs text-muted-foreground">종료</Label>
                      <Input
                        type="time"
                        value={shift.end}
                        onChange={(e) =>
                          onUpdateShift(partIndex, shiftIndex, 'end', e.target.value)
                        }
                        className="h-8 w-full min-w-0 text-sm"
                        required
                      />
                    </div>
                    {part.shifts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 pb-1"
                        onClick={() => onRemoveShift(partIndex, shiftIndex)}
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 근무 조건 */}
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-semibold">
                근무 조건 <span className="text-red-500">*</span>
              </Label>

              {/* Location */}
              <div className="flex flex-col gap-0.5">
                <Label>장소</Label>
                <Input
                  value={part.location}
                  onChange={(e) => onUpdatePart(partIndex, { location: e.target.value })}
                  placeholder="예: 서울 강남구 역삼동"
                  required
                />
              </div>

              {/* Recruit count */}
              <div className="flex flex-col gap-0.5">
                <Label>모집인원</Label>
                <Input
                  type="number"
                  min="1"
                  value={part.recruit_count}
                  onChange={(e) => onUpdatePart(partIndex, { recruit_count: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            {/* 급여 */}
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-semibold">
                급여 <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor={`part-${partIndex}-pay_amount`}>급여 금액</Label>
                  <div className="flex gap-2 items-stretch">
                    <Input
                      id={`part-${partIndex}-pay_amount`}
                      type="number"
                      min="0"
                      className="min-w-0 flex-1"
                      value={part.pay_amount || ''}
                      onChange={(e) =>
                        onUpdatePart(partIndex, { pay_amount: Number(e.target.value) })
                      }
                      required
                    />
                    <Select
                      value={part.pay_type}
                      onValueChange={(v) =>
                        onUpdatePart(partIndex, { pay_type: v as WorkPart['pay_type'] })
                      }
                    >
                      <SelectTrigger
                        id={`part-${partIndex}-pay_type`}
                        aria-label="급여 유형"
                        className="w-[9.5rem] shrink-0"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">시급</SelectItem>
                        <SelectItem value="daily">일급</SelectItem>
                        <SelectItem value="weekly">주급</SelectItem>
                        <SelectItem value="monthly">월급</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={part.tax_withholding}
                      onChange={(e) =>
                        onUpdatePart(partIndex, { tax_withholding: e.target.checked })
                      }
                      className="size-4"
                    />
                    <span className="text-sm">3.3% 원천징수 공제</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={part.meal_included}
                      onChange={(e) =>
                        onUpdatePart(partIndex, {
                          meal_included: e.target.checked,
                          meal_amount: e.target.checked ? part.meal_amount : 0,
                        })
                      }
                      className="size-4"
                    />
                    <span className="text-sm">식대 포함</span>
                  </label>
                  {part.meal_included && (
                    <div className="flex flex-col gap-0.5">
                      <Label className="text-sm">식대 금액(원)</Label>
                      <Input
                        type="number"
                        min="0"
                        className="w-32"
                        value={part.meal_amount || ''}
                        onChange={(e) =>
                          onUpdatePart(partIndex, { meal_amount: Number(e.target.value) })
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {fieldErrors?.['work_slots'] && (
          <p className="text-sm text-red-500">{fieldErrors['work_slots']}</p>
        )}
      </CardContent>
    </Card>
  );
};
