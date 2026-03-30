'use client';

import type { StaffPosition } from '../../types';
import { POSITION_CONFIG } from '../../constants';

export function PositionBadge({ value }: { value: StaffPosition }) {
  const cfg = POSITION_CONFIG[value];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${cfg.badge}`}
    >
      {cfg.showDot && <span className={`size-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  );
}
