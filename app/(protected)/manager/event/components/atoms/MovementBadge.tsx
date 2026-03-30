'use client';

import type { MovementStatus } from '../../types';
import { MOVEMENT_CONFIG } from '../../constants';

export function MovementBadge({ status }: { status: MovementStatus }) {
  const cfg = MOVEMENT_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-semibold shrink-0 ${cfg.badge}`}
    >
      {cfg.showDot && <span className={`size-1.5 rounded-full shrink-0 ${cfg.dot}`} />}
      {cfg.label}
    </span>
  );
}
