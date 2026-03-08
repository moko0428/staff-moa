export type PenaltyItem = {
  reason: string;
  deduction: number;
};

export const PENALTY_TYPES: Record<string, { min: number; max: number }> = {
  '지각': { min: 1, max: 5 },
  '노쇼': { min: 10, max: 20 },
  '중간퇴근': { min: 3, max: 10 },
  '무단외출': { min: 5, max: 15 },
  '업무태만': { min: 1, max: 7 },
  '고객클레임': { min: 5, max: 15 },
} as const;
