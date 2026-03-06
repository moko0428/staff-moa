'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Skeleton } from '@/components/ui/skeleton';
import { staggerContainer, staggerItem } from '../atoms/animations';
import type { LandingStats } from '../../actions';

type StatItem = {
  label: string;
  display: string;
  icon: ReactNode;
  tickerValue?: number;
  suffix?: string;
  decimalPlaces?: number;
};

const formatCount = (count: number): string => {
  if (count >= 1000) return `${Math.floor(count / 1000)}K+`;
  return `${count}+`;
};

const toCountTicker = (
  count: number,
): { tickerValue: number; suffix?: string } => {
  if (count >= 1000)
    return { tickerValue: Math.floor(count / 1000), suffix: 'K+' };
  return { tickerValue: count, suffix: '+' };
};

interface HeroStatsProps {
  stats: LandingStats | null;
  isLoading?: boolean;
}

export const HeroStats = ({ stats, isLoading }: HeroStatsProps) => {
  const items: StatItem[] = [
    {
      label: '등록 스탭',
      display: stats ? formatCount(stats.memberCount) : '-',
      ...(stats ? toCountTicker(stats.memberCount) : {}),
      icon: <span className="text-4xl">👤</span>,
    },

    {
      label: '파트너 업체',
      display: stats ? formatCount(stats.managerCount) : '-',
      ...(stats ? toCountTicker(stats.managerCount) : {}),
      icon: <span className="text-4xl">🏢</span>,
    },
    {
      label: '신뢰 평점',
      display:
        stats && stats.averageAttendanceScore !== null
          ? `${stats.averageAttendanceScore}`
          : '-',
      tickerValue: stats?.averageAttendanceScore || 50,
      decimalPlaces: 1,
      icon: <span className="text-4xl">🌟</span>,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 md:gap-6 pt-4 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/30 bg-white/20 px-4 py-5 md:px-5 md:py-6 min-h-[150px] md:min-h-[170px] backdrop-blur-sm"
          >
            <Skeleton className="size-16 rounded-xl bg-white/30" />
            <Skeleton className="h-9 w-20 bg-white/30" />
            <Skeleton className="h-5 w-16 bg-white/30" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto px-4 py-10">
      <header className="flex flex-col items-center justify-center gap-1">
        <h2 className="text-2xl font-bold text-foreground">
          고인력과 함께 성장하는 사람들
        </h2>
        <span className="text-sm text-foreground/90">
          스탭과 매니저를 연결하는 고인력
        </span>
      </header>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-3 gap-4 md:gap-6 pt-4 w-full"
      >
        {items.map((s, idx) => (
          <motion.div
            key={s.label}
            variants={staggerItem}
            custom={idx}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-background px-4 py-5 md:px-5 md:py-6 min-h-[150px] md:min-h-[170px] backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.2)] *:text-foreground"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center gap-2 bg-background rounded-xl p-4">
              {s.icon}
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
              {typeof s.tickerValue === 'number' &&
              Number.isFinite(s.tickerValue) ? (
                <>
                  <NumberTicker
                    startValue={0}
                    value={s.tickerValue}
                    decimalPlaces={s.decimalPlaces ?? 0}
                    className="text-foreground"
                  />
                  {s.suffix ? <span>{s.suffix}</span> : null}
                </>
              ) : (
                <span>{s.display}</span>
              )}
            </p>
            <p className="text-sm md:text-base text-foreground/90">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
