'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface Props {
  value: string;
  positions: string[];
  onChange: (v: string) => void;
}

export function PositionDropdown({ value, positions, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs transition-colors group"
      >
        <span className={value ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          {value || '미배정'}
        </span>
        <ChevronDown className="size-3 opacity-40 group-hover:opacity-70 transition-opacity" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-popover border rounded-xl shadow-lg p-1 min-w-[120px]">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent rounded-lg transition-colors text-muted-foreground"
          >
            미배정
            {!value && <Check className="size-3 ml-auto text-primary" />}
          </button>
          {positions.length > 0 && <div className="border-t my-1" />}
          {positions.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent rounded-lg transition-colors"
            >
              {p}
              {p === value && <Check className="size-3 ml-auto text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
