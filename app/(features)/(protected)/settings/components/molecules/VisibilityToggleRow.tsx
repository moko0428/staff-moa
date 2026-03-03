import { type LucideIcon } from 'lucide-react';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';

type Props = {
  icon: LucideIcon;
  label: string;
  description: string;
  previewValue: string;
  checked: boolean;
  onCheckedChange: () => void;
};

export function VisibilityToggleRow({
  icon: Icon,
  label,
  description,
  previewValue,
  checked,
  onCheckedChange,
}: Props) {
  const isUnset = previewValue === '미설정';
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <Icon className="size-4 text-muted-foreground" />
        <div>
          <Label className="font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
            isUnset
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary/10 text-primary font-medium'
          }`}
        >
          {previewValue}
        </span>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}
