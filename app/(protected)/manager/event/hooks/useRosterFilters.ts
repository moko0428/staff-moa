'use client';

import { useState } from 'react';
import type { FilterCheckin, StaffEntry, StaffPosition } from '../types';

export function useRosterFilters(currentStaff: StaffEntry[], currentPositions: string[]) {
  const [filterPositionState, setFilterPositionState] = useState<StaffPosition | null>(null);
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterCheckin, setFilterCheckin] = useState<FilterCheckin>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const reset = () => {
    setFilterPositionState(null);
    setFilterPosition('all');
    setFilterCheckin('all');
    setSearchQuery('');
  };

  const positionsForFilter =
    currentPositions.length > 0
      ? currentPositions
      : Array.from(new Set(currentStaff.map((s) => s.position).filter(Boolean)));

  const filteredSorted = currentStaff
    .filter((s) => {
      if (filterPositionState && s.positionState !== filterPositionState) return false;
      if (filterPosition !== 'all' && s.position !== filterPosition) return false;
      if (filterCheckin === 'checked' && !s.checkedIn) return false;
      if (filterCheckin === 'unchecked' && s.checkedIn) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !(s.phone ?? '').includes(q) &&
          !s.position.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.checkedIn !== b.checkedIn) return a.checkedIn ? -1 : 1;
      return a.name.localeCompare(b.name, 'ko');
    });

  const positionStateCounts = (['waiting', 'assigned'] as StaffPosition[]).reduce(
    (acc, s) => ({
      ...acc,
      [s]: currentStaff.filter((e) => e.positionState === s).length,
    }),
    {} as Record<StaffPosition, number>,
  );

  const positionCounts = currentPositions.reduce(
    (acc, p) => ({
      ...acc,
      [p]: currentStaff.filter((s) => s.position === p).length,
    }),
    {} as Record<string, number>,
  );

  const hasActiveFilter =
    !!searchQuery ||
    !!filterPositionState ||
    filterPosition !== 'all' ||
    filterCheckin !== 'all';

  return {
    filterPositionState,
    filterPosition,
    filterCheckin,
    searchQuery,
    setFilterPositionState,
    setFilterPosition,
    setFilterCheckin,
    setSearchQuery,
    reset,
    filteredSorted,
    positionStateCounts,
    positionCounts,
    positionsForFilter,
    hasActiveFilter,
  };
}
