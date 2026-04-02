'use client';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
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
import type { WorkSlot, WorkPart } from '../../../types';

interface WorkSlotsCardProps {
  workSlots: WorkSlot[];
  fieldErrors?: Record<string, string>;
  pasteHighlights?: Set<string>;
  /** 아코디언 등에서 상단 제목·카드 테두리 중복 제거 */
  plainSection?: boolean;
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
  onUpdateSlot: (index: number, patch: Partial<Omit<WorkSlot, 'parts'>>) => void;
  onAddPart: (slotIndex: number) => void;
  onRemovePart: (slotIndex: number, partIndex: number) => void;
  onUpdatePart: (slotIndex: number, partIndex: number, patch: Partial<WorkPart>) => void;
}

export const WorkSlotsCard = ({
  workSlots,
  fieldErrors,
  pasteHighlights,
  plainSection = false,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
  onAddPart,
  onRemovePart,
  onUpdatePart,
}: WorkSlotsCardProps) => {
  const hl = (id: string) =>
    pasteHighlights?.has(id) ? 'ring-2 ring-blue-400' : '';

  return (
    <Card
      className={cn(
        plainSection && 'border-0 shadow-none bg-transparent',
      )}
    >
      <CardHeader
        className={cn(
          'flex flex-row items-center',
          plainSection ? 'justify-end' : 'justify-between',
        )}
      >
        {!plainSection && <CardTitle>근무 정보</CardTitle>}
        <Button type="button" variant="outline" size="sm" onClick={onAddSlot}>
          <Plus className="size-4 mr-1" />
          날짜 추가
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {workSlots.map((slot, slotIndex) => (
          <div
            key={slotIndex}
            className="border rounded-lg p-4 space-y-4 bg-muted/20"
          >
            {/* Slot header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">
                근무 {slotIndex + 1}
              </span>
              {workSlots.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveSlot(slotIndex)}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>

            {/* Date + Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>
                  날짜 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={slot.date}
                  onChange={(e) =>
                    onUpdateSlot(slotIndex, { date: e.target.value })
                  }
                  className={hl(`slot-${slotIndex}-date`)}
                  required
                />
              </div>
              <div>
                <Label>
                  장소 <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={slot.location}
                  onChange={(e) =>
                    onUpdateSlot(slotIndex, { location: e.target.value })
                  }
                  className={hl(`slot-${slotIndex}-location`)}
                  placeholder="예: 서울 강남구 역삼동"
                  required
                />
              </div>
            </div>

            {/* Pay */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>
                  급여 유형 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={slot.pay_type}
                  onValueChange={(v) =>
                    onUpdateSlot(slotIndex, { pay_type: v as WorkSlot['pay_type'] })
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
                  value={slot.pay_amount || ''}
                  onChange={(e) =>
                    onUpdateSlot(slotIndex, { pay_amount: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slot.tax_withholding}
                    onChange={(e) =>
                      onUpdateSlot(slotIndex, { tax_withholding: e.target.checked })
                    }
                    className="size-4"
                  />
                  <span className="text-sm">3.3% 원천징수 공제</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slot.meal_included}
                    onChange={(e) =>
                      onUpdateSlot(slotIndex, {
                        meal_included: e.target.checked,
                        meal_amount: e.target.checked ? slot.meal_amount : 0,
                      })
                    }
                    className="size-4"
                  />
                  <span className="text-sm">식대 포함</span>
                </label>
                {slot.meal_included && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">식대 금액(원)</Label>
                    <Input
                      type="number"
                      min="0"
                      className="w-32"
                      value={slot.meal_amount || ''}
                      onChange={(e) =>
                        onUpdateSlot(slotIndex, { meal_amount: Number(e.target.value) })
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Parts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">근무 파트</Label>
                {slot.parts.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onAddPart(slotIndex)}
                  >
                    <Plus className="size-3 mr-1" />
                    파트 추가
                  </Button>
                )}
              </div>

              {slot.parts.map((part, partIndex) => (
                <div
                  key={partIndex}
                  className={cn(
                    'rounded-md border p-3 space-y-2',
                    'bg-background',
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      파트 {part.label}
                    </span>
                    {slot.parts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemovePart(slotIndex, partIndex)}
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="md:col-span-2">
                      <Label className="text-xs text-muted-foreground">파트 이름 (선택)</Label>
                      <Input
                        value={part.name}
                        onChange={(e) =>
                          onUpdatePart(slotIndex, partIndex, { name: e.target.value })
                        }
                        placeholder="예: 오전 파트"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        시작 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="time"
                        value={part.start}
                        onChange={(e) =>
                          onUpdatePart(slotIndex, partIndex, { start: e.target.value })
                        }
                        className="h-8 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        종료 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="time"
                        value={part.end}
                        onChange={(e) =>
                          onUpdatePart(slotIndex, partIndex, { end: e.target.value })
                        }
                        className="h-8 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        모집인원 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={part.recruit_count}
                        onChange={(e) =>
                          onUpdatePart(slotIndex, partIndex, {
                            recruit_count: Number(e.target.value),
                          })
                        }
                        className="h-8 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
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
