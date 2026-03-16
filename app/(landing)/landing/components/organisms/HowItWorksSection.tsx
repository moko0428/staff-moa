'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  CircleCheckBig,
  AlarmCheck,
  User,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/ui/button';
import { SectionHeader } from '../molecules/SectionHeader';
import { steps } from '../../data/landing-data';

const iconMap: Record<string, LucideIcon> = {
  Users,
  User,
  Search,
  CircleCheckBig,
  AlarmCheck,
};

const STEP_IMAGES = ['1.jpeg', '2.jpeg', '3.jpeg', '4.jpeg', '5.jpeg'];

const HowItWorksSection = () => {
  const [selected, setSelected] = useState(0);
  const current = steps[selected];

  return (
    <section className="w-full bg-background border-t border-border relative z-10">
      <div className="max-w-5xl mx-auto px-4 py-8 w-full flex flex-col gap-4 lg:py-12 lg:gap-6">
        <SectionHeader
          badge="시작하기"
          badgeTextColor="text-primary"
          badgeBgColor="bg-primary/10"
          title="5단계로 시작하는 고인력"
          subtitle="간편해요"
        />

        {/* 모바일: 3열 그리드 탭 */}
        <div className="grid grid-cols-5 gap-2 lg:hidden shrink-0">
          {steps.map((step, i) => {
            const ChipIcon = iconMap[step.iconName];
            return (
              <button
                key={step.title}
                onClick={() => setSelected(i)}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-xs transition-colors',
                  i === selected
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <ChipIcon className="size-4 shrink-0" />
                <span className="text-[10px] text-center leading-tight line-clamp-2">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* 콘텐츠 — 모바일: flex-col, 데스크톱: 1:2:1 그리드 */}
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_1fr_1fr] lg:gap-6 lg:h-[520px]">
          {/* 데스크톱: 수직 탭 목록 */}
          <div className="hidden lg:flex flex-col gap-1 border-r border-border pr-10 justify-center overflow-hidden">
            {steps.map((step, i) => {
              const TabIcon = iconMap[step.iconName];
              return (
                <button
                  key={step.title}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'flex-wrap items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors text-left w-full',
                    i === selected
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <TabIcon className="size-4 shrink-0" />
                  {step.title}
                </button>
              );
            })}
          </div>

          {/* 비주얼 — 모바일: 너비 기준(70%), 데스크톱: 높이 기준(70%) */}
          <div className="relative flex justify-center shrink-0 lg:flex-none lg:min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`img-${selected}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-[70%] lg:hidden"
              >
                <Image
                  src={`/assets/landing/${STEP_IMAGES[selected]}`}
                  alt={`step ${selected + 1}`}
                  width={433}
                  height={882}
                  priority={selected === 0}
                  className="w-full h-auto object-contain rounded-xl shadow-xl border border-border"
                />
              </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div
                key={`img-lg-${selected}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="hidden lg:flex absolute inset-0 items-center justify-center"
              >
                <div
                  className="h-[70%] relative"
                  style={{ aspectRatio: '433/882' }}
                >
                  <Image
                    src={`/assets/landing/${STEP_IMAGES[selected]}`}
                    alt={`step ${selected + 1}`}
                    fill
                    priority={selected === 0}
                    className="object-contain"
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 설명 */}
          <div className="relative lg:flex-none lg:min-h-0 lg:overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`desc-${selected}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col justify-center gap-3 pb-4 lg:absolute lg:inset-0 lg:pb-0"
              >
                <p className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 w-fit">
                  STEP {selected + 1}
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  {current.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {current.desc}
                </p>
                {current.link && current.link.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {current.link.map((item) => (
                      <Button
                        key={item.href}
                        asChild
                        size="sm"
                        variant="outline"
                      >
                        <Link href={item.href} target="_blank">
                          {item.label}
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
