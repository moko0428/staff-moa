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
import { cn } from '@/lib/utils';
import type { WorkPart, WorkShift } from '../../../types';

interface WorkSlotsCardProps {
  workParts: WorkPart[];
  fieldErrors?: Record<string, string>;
  pasteHighlights?: Set<string>;
  /** 아코디언 등에서 상단 제목·카드 테두리 중복 제거 */
  plainSection?: boolean;
  onAddPart: () => void;
  onRemovePart: (partIndex: number) => void;
  onUpdatePart: (partIndex: number, patch: Partial<Omit<WorkPart, 'shifts'>>) => void;
  onAddShift: (partIndex: number) => void;
  onRemoveShift: (partIndex: number, shiftIndex: number) => void;
  onUpdateShift: (partIndex: number, shiftIndex: number, field: keyof WorkShift, value: string) => void;
  onToggleShiftMode: (partIndex: number, shiftIndex: number) => void;
  onUpdatePartTime: (partIndex: number, field: 'start' | 'end', value: string) => void;
}

export const WorkSlotsCard = ({
  workParts,
  fieldErrors,
  pasteHighlights,
  plainSection = false,
  onAddPart,
  onRemovePart,
  onUpdatePart,
  onAddShift,
  onRemoveShift,
  onUpdateShift,
  onToggleShiftMode,
  onUpdatePartTime,
}: WorkSlotsCardProps) => {
  const hl = (id: string) =>
    pasteHighlights?.has(id) ? 'ring-2 ring-blue-400' : '';

  return (
    <Card
      className={cn(
        plainSection && 'border-0 shadow-none bg-transparent py-0 gap-2',
      )}
    >
      <CardHeader
        className={cn(
          'flex flex-row items-center',
          plainSection
            ? 'justify-end px-4 py-0 pb-2'
            : 'justify-between',
        )}
      >
        {!plainSection && <CardTitle>근무 정보</CardTitle>}
        <Button type="button" variant="outline" size="sm" onClick={onAddPart}>
          <Plus className="size-4 mr-1" />
          파트 추가
        </Button>
      </CardHeader>
      <CardContent
        className={cn('space-y-6', plainSection && 'p-0')}
      >
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
                className={cn('h-8 text-sm', hl(`part-${partIndex}-name`))}
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

            {/* 공통 근무 시간 */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                근무 시간 <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-0.5">
                  <Label className="text-xs text-muted-foreground">시작</Label>
                  <Input
                    type="time"
                    value={part.shifts[0]?.start ?? ''}
                    onChange={(e) => onUpdatePartTime(partIndex, 'start', e.target.value)}
                    className="h-8 w-28 text-sm"
                    required
                  />
                </div>
                <span className="pb-1.5 text-muted-foreground text-sm">~</span>
                <div className="flex flex-col gap-0.5">
                  <Label className="text-xs text-muted-foreground">종료</Label>
                  <Input
                    type="time"
                    value={part.shifts[0]?.end ?? ''}
                    onChange={(e) => onUpdatePartTime(partIndex, 'end', e.target.value)}
                    className="h-8 w-28 text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 날짜 목록 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  근무 기간 <span className="text-red-500">*</span>
                </Label>
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

              {part.shifts.map((shift, shiftIndex) => {
                const isSingleDay = shift.date_end === undefined;
                return (
                  <div
                    key={shiftIndex}
                    className="flex items-end gap-2 rounded-md border p-2 bg-background"
                  >
                    {isSingleDay ? (
                      /* 당일 근무: 날짜 1개 */
                      <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                        <Label className="text-xs text-muted-foreground">날짜</Label>
                        <Input
                          type="date"
                          value={shift.date}
                          onChange={(e) =>
                            onUpdateShift(partIndex, shiftIndex, 'date', e.target.value)
                          }
                          className={cn(
                            'h-8 text-sm',
                            hl(`part-${partIndex}-shift-${shiftIndex}-date`),
                          )}
                          required
                        />
                      </div>
                    ) : (
                      /* 기간 근무: 시작일 ~ 종료일 */
                      <>
                        <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                          <Label className="text-xs text-muted-foreground">시작일</Label>
                          <Input
                            type="date"
                            value={shift.date}
                            onChange={(e) =>
                              onUpdateShift(partIndex, shiftIndex, 'date', e.target.value)
                            }
                            className={cn(
                              'h-8 text-sm',
                              hl(`part-${partIndex}-shift-${shiftIndex}-date`),
                            )}
                            required
                          />
                        </div>
                        <span className="shrink-0 pb-1.5 text-muted-foreground text-sm">~</span>
                        <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                          <Label className="text-xs text-muted-foreground">종료일</Label>
                          <Input
                            type="date"
                            value={shift.date_end ?? ''}
                            onChange={(e) =>
                              onUpdateShift(partIndex, shiftIndex, 'date_end', e.target.value)
                            }
                            className="h-8 text-sm"
                            required
                          />
                        </div>
                      </>
                    )}

                    {/* 하루 토글 — 오른쪽 */}
                    <Button
                      type="button"
                      variant={isSingleDay ? 'default' : 'outline'}
                      size="sm"
                      className="shrink-0 h-8 text-xs px-2.5"
                      onClick={() => onToggleShiftMode(partIndex, shiftIndex)}
                    >
                      하루
                    </Button>

                    {part.shifts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveShift(partIndex, shiftIndex)}
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
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
                  className={hl(`part-${partIndex}-location`)}
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
