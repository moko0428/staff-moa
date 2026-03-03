'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { motion, MotionConfig } from 'framer-motion';
import { Zap, Search, User, Briefcase, Building2, Star } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Skeleton } from '@/components/ui/skeleton';
import { staggerContainer, fadeInUp, staggerItem } from '../atoms/animations';
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
  if (count >= 100) return `${count}+`;
  return String(count);
};

const toCountTicker = (count: number): { tickerValue: number; suffix?: string } => {
  if (count >= 1000) return { tickerValue: Math.floor(count / 1000), suffix: 'K+' };
  if (count >= 100) return { tickerValue: count, suffix: '+' };
  return { tickerValue: count };
};

interface HeroSectionProps {
  stats: LandingStats | null;
  isLoading?: boolean;
  shouldReduceMotion?: boolean;
}

const HeroSection = ({ stats, isLoading, shouldReduceMotion }: HeroSectionProps) => {
  const statsItems: StatItem[] = [
    {
      label: '등록 스탭',
      display: stats ? formatCount(stats.memberCount) : '-',
      ...(stats ? toCountTicker(stats.memberCount) : {}),
      icon: <User className="size-4 sm:size-6" />,
    },
    {
      label: '활성 공고',
      display: stats ? formatCount(stats.activePostCount) : '-',
      ...(stats ? toCountTicker(stats.activePostCount) : {}),
      icon: <Briefcase className="size-4 sm:size-6" />,
    },
    {
      label: '파트너 업체',
      display: stats ? formatCount(stats.managerCount) : '-',
      ...(stats ? toCountTicker(stats.managerCount) : {}),
      icon: <Building2 className="size-4 sm:size-6" />,
    },
    {
      label: '평균 평점',
      display:
        stats && stats.averageRating !== null ? `${stats.averageRating.toFixed(1)}` : '-',
      tickerValue:
        stats && stats.averageRating !== null
          ? Number(stats.averageRating.toFixed(1))
          : undefined,
      decimalPlaces: 1,
      icon: <Star className="size-4 sm:size-6" />,
    },
  ];

  return (
    <MotionConfig reducedMotion={shouldReduceMotion ? 'always' : 'never'}>
    <section className="h-full w-full flex items-center justify-center relative z-10 bg-primary">
      <div className="max-w-3xl w-full mx-auto px-4 flex flex-col items-center justify-center">
        <motion.div
          className="space-y-4 sm:space-y-12"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center gap-2 bg-white/10 rounded-full px-4 py-2 w-fit mx-auto text-center"
          >
            <Zap className="size-4 text-white" />
            <span className="text-xs font-semibold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              기업과 인재를 잇는 신뢰형 매칭 플랫폼
            </span>
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-4 w-full max-w-xl mx-auto">
            <h1 className="text-2xl sm:text-4xl font-bold leading-tight text-white text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              사람을 찾는 기업과 <br /> 기회를 찾는 인재를 연결하다
            </h1>
            <p className="text-white text-xs sm:text-lg text-center w-full drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              정교한 매칭 시스템과 통합 스케줄·경력 관리 솔루션으로
              <br />
              채용의 모든 단계를 하나로.
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 justify-center">
            <Button asChild variant="ghost" size="lg">
              <Link
                href="/post"
                className="border border-white/50 rounded-full px-4 py-2 hover:bg-white/10"
              >
                <Search className="size-4 text-white" />
                <span className="text-white">공고 둘러보기</span>
              </Link>
            </Button>
            <InteractiveHoverButton className="border border-white/50 rounded-lg px-6 py-1 hover:bg-white/10 bg-primary/10 text-white">
              <Link href="/auth">무료로 시작하기</Link>
            </InteractiveHoverButton>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 pt-2 sm:pt-4 w-full">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 sm:gap-3">
                  <Skeleton className="size-8 sm:size-14 rounded-lg bg-white/10" />
                  <Skeleton className="h-6 sm:h-9 w-16 bg-white/10" />
                  <Skeleton className="h-4 w-14 bg-white/10" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 pt-2 sm:pt-4"
            >
              {statsItems.map((s, idx) => (
                <motion.div
                  key={s.label}
                  variants={staggerItem}
                  custom={idx}
                  className="flex flex-col items-center justify-center gap-2 sm:gap-3 *:text-white"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center justify-center gap-2 bg-white/10 rounded-lg p-2 sm:p-4">
                    {s.icon}
                  </div>
                  <p className="text-lg sm:text-3xl font-bold text-white">
                    {typeof s.tickerValue === 'number' && Number.isFinite(s.tickerValue) ? (
                      <>
                        <NumberTicker
                          startValue={0}
                          value={s.tickerValue}
                          decimalPlaces={s.decimalPlaces ?? 0}
                          className="text-white"
                        />
                        {s.suffix ? <span>{s.suffix}</span> : null}
                      </>
                    ) : (
                      <span>{s.display}</span>
                    )}
                  </p>
                  <p className="text-xs sm:text-sm text-white/80">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
    </MotionConfig>
  );
};

export default HeroSection;
