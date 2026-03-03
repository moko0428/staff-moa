'use client';

import { Button } from '@/app/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Props {
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  onCancel: () => void;
}

export function FormActionBar({ isPending, submitLabel, pendingLabel, onCancel }: Props) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        취소
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            {pendingLabel}
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  );
}
