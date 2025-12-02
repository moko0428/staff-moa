import { Button } from '@/components/ui/button';
import { LayoutGrid, CalendarDays } from 'lucide-react';

type ViewType = 'card' | 'calendar';

interface ScheduleViewToggleProps {
  viewType: ViewType;
  onChange: (view: ViewType) => void;
  className?: string;
  cardLabel?: string;
  calendarLabel?: string;
}

export function ScheduleViewToggle({
  viewType,
  onChange,
  className = 'flex justify-end gap-2 mb-4',
  cardLabel = '카드 뷰',
  calendarLabel = '달력 뷰',
}: ScheduleViewToggleProps) {
  return (
    <div className={className}>
      <Button
        type="button"
        variant={viewType === 'card' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('card')}
      >
        <LayoutGrid className="size-4" />
        {cardLabel}
      </Button>
      <Button
        type="button"
        variant={viewType === 'calendar' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('calendar')}
      >
        <CalendarDays className="size-4" />
        {calendarLabel}
      </Button>
    </div>
  );
}
