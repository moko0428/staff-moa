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
import type { EditWorkSlot } from '../../../types';

interface EditWorkSlotsCardProps {
  workSlots: EditWorkSlot[];
  fieldErrors?: Record<string, string>;
  onAddWorkSlot: () => void;
  onRemoveWorkSlot: (index: number) => void;
  onWorkSlotChange: (
    index: number,
    field: keyof EditWorkSlot,
    value: string | number | boolean,
  ) => void;
}

export const EditWorkSlotsCard = ({
  workSlots,
  fieldErrors,
  onAddWorkSlot,
  onRemoveWorkSlot,
  onWorkSlotChange,
}: EditWorkSlotsCardProps) => {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>날짜/시간/급여 정보</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={onAddWorkSlot}>
          <Plus className="size-4 mr-2" />
          추가
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {workSlots.map((slot, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">슬롯 {index + 1}</span>
              {workSlots.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveWorkSlot(index)}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>
                  날짜 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={slot.date}
                  onChange={(e) =>
                    onWorkSlotChange(index, 'date', e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label>
                  시작 시간 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="time"
                  value={slot.start}
                  onChange={(e) =>
                    onWorkSlotChange(index, 'start', e.target.value)
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
                  value={slot.end}
                  onChange={(e) =>
                    onWorkSlotChange(index, 'end', e.target.value)
                  }
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
                    onWorkSlotChange(index, 'location', e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label>
                  급여 유형 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={slot.pay_type}
                  onValueChange={(v) =>
                    onWorkSlotChange(
                      index,
                      'pay_type',
                      v as EditWorkSlot['pay_type'],
                    )
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
                    onWorkSlotChange(
                      index,
                      'pay_amount',
                      Number(e.target.value),
                    )
                  }
                  required
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`tax-${index}`}
                  checked={slot.tax_withholding}
                  onChange={(e) =>
                    onWorkSlotChange(
                      index,
                      'tax_withholding',
                      e.target.checked,
                    )
                  }
                  className="size-4"
                />
                <Label htmlFor={`tax-${index}`} className="cursor-pointer">
                  3.3% 원천징수 공제
                </Label>
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
