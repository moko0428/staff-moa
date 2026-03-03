import { Wallet, TrendingUp, Circle } from 'lucide-react';
import type { EarningsData } from '../../types';

type Props = {
  earnings: EarningsData;
};

export function EarningsSection({ earnings }: Props) {
  const formatWon = (value: number) =>
    new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(Math.round(value || 0));

  return (
    <div className="flex items-center gap-3 px-1 mb-2 py-2 overflow-x-auto scroll-none bg-background w-full justify-around">
      <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
        <Wallet className="size-4 text-blue-600" />
        <span className="text-muted-foreground">주</span>
        <span className="font-semibold">{formatWon(earnings.thisWeek)}원</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
        <TrendingUp className="size-4 text-green-600" />
        <span className="text-muted-foreground">월</span>
        <span className="font-semibold">{formatWon(earnings.thisMonth)}원</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
        <Circle className="size-4 text-purple-600" />
        <span className="text-muted-foreground">연</span>
        <span className="font-semibold">{formatWon(earnings.thisYear)}원</span>
      </div>
    </div>
  );
}
