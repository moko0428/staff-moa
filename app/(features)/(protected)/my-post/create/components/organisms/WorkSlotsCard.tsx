'use client';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Calendar } from '@/app/components/ui/calendar';
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import type { WorkType, WorkSlot } from '../../../types';

interface WorkSlotsCardProps {
  workType: WorkType;
  workSlots: WorkSlot[];
  selectedSingleDate: Date | undefined;
  selectedRange: DateRange | undefined;
  multiDraftDate: Date | undefined;
  multiDraftStart: string;
  multiDraftEnd: string;
  fieldErrors?: Record<string, string>;
  onSwitchToSingle: () => void;
  onSwitchToRange: () => void;
  onSwitchToMulti: () => void;
  onSingleDateSelect: (d: Date | undefined) => void;
  onRangeSelect: (range: DateRange | undefined) => void;
  onMultiDraftDateSelect: (d: Date | undefined) => void;
  onMultiDraftStartChange: (v: string) => void;
  onMultiDraftEndChange: (v: string) => void;
  onUpsertMultiSlot: (slot: Pick<WorkSlot, 'date' | 'start' | 'end'>) => void;
  onUpdateMultiSlotTime: (
    date: string,
    patch: Partial<Pick<WorkSlot, 'start' | 'end'>>,
  ) => void;
  onRemoveMultiSlot: (date: string) => void;
  onPatchCommonFields: (
    patch: Partial<
      Pick<
        WorkSlot,
        | 'start'
        | 'end'
        | 'location'
        | 'pay_type'
        | 'pay_amount'
        | 'tax_withholding'
        | 'meal_included'
        | 'meal_amount'
      >
    >,
  ) => void;
}

export const WorkSlotsCard = ({
  workType,
  workSlots,
  selectedSingleDate,
  selectedRange,
  multiDraftDate,
  multiDraftStart,
  multiDraftEnd,
  fieldErrors,
  onSwitchToSingle,
  onSwitchToRange,
  onSwitchToMulti,
  onSingleDateSelect,
  onRangeSelect,
  onMultiDraftDateSelect,
  onMultiDraftStartChange,
  onMultiDraftEndChange,
  onUpsertMultiSlot,
  onUpdateMultiSlotTime,
  onRemoveMultiSlot,
  onPatchCommonFields,
}: WorkSlotsCardProps) => {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>날짜/시간/급여 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 근무 타입 선택 */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={workType === 'single' ? 'default' : 'outline'}
            onClick={onSwitchToSingle}
          >
            하루
          </Button>
          <Button
            type="button"
            size="sm"
            variant={workType === 'range' ? 'default' : 'outline'}
            onClick={onSwitchToRange}
          >
            기간
          </Button>
          <Button
            type="button"
            size="sm"
            variant={workType === 'multi' ? 'default' : 'outline'}
            onClick={onSwitchToMulti}
          >
            여러 날짜
          </Button>
          <span className="text-xs text-muted-foreground ml-1">
            {workType === 'single'
              ? '하루만 선택'
              : workType === 'range'
                ? '시작일~종료일 선택'
                : '여러 날짜 선택'}
          </span>
        </div>

        {/* 날짜 선택 UI */}
        <div className="rounded-lg border p-3">
          {workType === 'single' && (
            <Calendar
              mode="single"
              selected={selectedSingleDate}
              onSelect={onSingleDateSelect}
            />
          )}
          {workType === 'range' && (
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={onRangeSelect}
            />
          )}
          {workType === 'multi' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">날짜 선택</Label>
                  <Calendar
                    mode="single"
                    selected={multiDraftDate}
                    onSelect={onMultiDraftDateSelect}
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">시간 선택</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          시작
                        </Label>
                        <Input
                          type="time"
                          value={multiDraftStart}
                          onChange={(e) =>
                            onMultiDraftStartChange(e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          종료
                        </Label>
                        <Input
                          type="time"
                          value={multiDraftEnd}
                          onChange={(e) =>
                            onMultiDraftEndChange(e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      if (!multiDraftDate) return;
                      if (!multiDraftStart || !multiDraftEnd) return;
                      const ds = format(multiDraftDate, 'yyyy-MM-dd');
                      onUpsertMultiSlot({
                        date: ds,
                        start: multiDraftStart,
                        end: multiDraftEnd,
                      });
                    }}
                    disabled={
                      !multiDraftDate || !multiDraftStart || !multiDraftEnd
                    }
                  >
                    <Plus className="size-4 mr-2" />
                    추가
                  </Button>

                  <div className="rounded-md border p-3">
                    <p className="text-sm font-medium mb-2">추가된 날짜/시간</p>
                    {workSlots.filter((s) => s.date).length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        아직 추가된 날짜가 없습니다.
                      </p>
                    ) : (
                      <div
                        className={cn(
                          'space-y-2',
                          workSlots.filter((s) => s.date).length >= 2 &&
                            'max-h-48 overflow-y-auto pr-1',
                        )}
                      >
                        {workSlots
                          .filter((s) => s.date)
                          .slice()
                          .sort((a, b) => a.date.localeCompare(b.date))
                          .map((s) => (
                            <div
                              key={s.date}
                              className={cn(
                                'flex flex-col md:flex-row md:items-center gap-2 rounded-md border p-2',
                                'bg-primary/5 border-primary/20',
                              )}
                            >
                              <Badge variant="secondary" className="w-fit">
                                {s.date}
                              </Badge>
                              <div className="grid grid-cols-2 gap-2 flex-1">
                                <Input
                                  type="time"
                                  value={s.start}
                                  onChange={(e) =>
                                    onUpdateMultiSlotTime(s.date, {
                                      start: e.target.value,
                                    })
                                  }
                                />
                                <Input
                                  type="time"
                                  value={s.end}
                                  onChange={(e) =>
                                    onUpdateMultiSlotTime(s.date, {
                                      end: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveMultiSlot(s.date)}
                                className="self-end md:self-auto"
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
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            선택 {workSlots.filter((s) => s.date).length}일
          </Badge>
          <div className="flex flex-wrap gap-2">
            {workSlots
              .map((s) => s.date)
              .filter(Boolean)
              .slice(0, 14)
              .map((d) => (
                <Badge
                  key={d}
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  {d}
                  {workType === 'multi' && (
                    <button
                      type="button"
                      className="ml-1 hover:text-red-600"
                      onClick={() => onRemoveMultiSlot(d)}
                      title="삭제"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </Badge>
              ))}
            {workSlots.filter((s) => s.date).length > 14 && (
              <span className="text-xs text-muted-foreground">
                외 {workSlots.filter((s) => s.date).length - 14}일
              </span>
            )}
          </div>
        </div>

        {/* 공통 필드: 시간/장소/급여 */}
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {workType === 'single'
                ? '하루 정보'
                : '공통 정보(선택된 날짜에 일괄 적용)'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {workType !== 'multi' && (
              <>
                <div>
                  <Label>
                    시작 시간 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={workSlots[0]?.start ?? ''}
                    onChange={(e) =>
                      onPatchCommonFields({ start: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>
                    종료 시간 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={workSlots[0]?.end ?? ''}
                    onChange={(e) =>
                      onPatchCommonFields({ end: e.target.value })
                    }
                    required
                  />
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <Label>
                장소 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={workSlots[0]?.location ?? ''}
                onChange={(e) =>
                  onPatchCommonFields({ location: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>
                급여 유형 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={workSlots[0]?.pay_type ?? 'hourly'}
                onValueChange={(v) =>
                  onPatchCommonFields({ pay_type: v as WorkSlot['pay_type'] })
                }
              >
                <SelectTrigger>
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
            <div>
              <Label>
                급여 금액 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                value={workSlots[0]?.pay_amount || ''}
                onChange={(e) =>
                  onPatchCommonFields({ pay_amount: Number(e.target.value) })
                }
                required
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="tax-withholding"
                checked={workSlots[0]?.tax_withholding ?? false}
                onChange={(e) =>
                  onPatchCommonFields({ tax_withholding: e.target.checked })
                }
                className="size-4"
              />
              <Label htmlFor="tax-withholding" className="cursor-pointer">
                3.3% 원천징수 공제
              </Label>
            </div>

            <div className="md:col-span-2 rounded-md border p-3">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="meal-included"
                    checked={workSlots[0]?.meal_included ?? false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      onPatchCommonFields({
                        meal_included: checked,
                        meal_amount: checked
                          ? Math.max(0, workSlots[0]?.meal_amount ?? 0)
                          : 0,
                      });
                    }}
                    className="size-4"
                  />
                  <Label htmlFor="meal-included" className="cursor-pointer">
                    식대 포함
                  </Label>
                </div>

                <div className="flex items-center gap-2 md:ml-auto w-full md:w-auto">
                  <Label htmlFor="meal-amount" className="text-sm">
                    식대 금액(원)
                  </Label>
                  <Input
                    id="meal-amount"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className={cn(
                      'w-full md:w-44',
                      !(workSlots[0]?.meal_included ?? false) && 'opacity-60',
                    )}
                    value={
                      (workSlots[0]?.meal_included ?? false)
                        ? (workSlots[0]?.meal_amount ?? 0)
                        : 0
                    }
                    onChange={(e) =>
                      onPatchCommonFields({
                        meal_amount: Number(e.target.value) || 0,
                      })
                    }
                    disabled={!(workSlots[0]?.meal_included ?? false)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                식대는 선택한 모든 날짜 슬롯에 동일하게 적용됩니다.
              </p>
            </div>
          </div>
        </div>
        {fieldErrors?.['work_slots'] && (
          <p className="text-sm text-red-500">{fieldErrors['work_slots']}</p>
        )}
      </CardContent>
    </Card>
  );
};
