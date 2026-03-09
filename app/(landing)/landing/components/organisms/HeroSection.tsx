'use client';

import Link from 'next/link';
import { motion, MotionConfig } from 'framer-motion';
import { Zap, Search } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { staggerContainer, fadeInUp } from '../atoms/animations';
import Image from 'next/image';

interface HeroSectionProps {
  shouldReduceMotion?: boolean;
}

const HeroSection = ({ shouldReduceMotion }: HeroSectionProps) => {
  return (
    <MotionConfig reducedMotion={shouldReduceMotion ? 'always' : 'never'}>
      <section className="w-full flex flex-col items-center relative z-10 bg-primary py-20 lg:py-28">
        <div className="max-w-3xl w-full mx-auto flex flex-col items-center">
          <motion.div
            className="space-y-10"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* 타이틀 */}
            <motion.div
              variants={fadeInUp}
              className="flex items-center justify-center gap-2 bg-white/20 rounded-full px-4 py-2 w-fit mx-auto text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
            >
              <Zap className="size-4 text-white" />
              <span className="text-xs font-semibold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
                사람을 찾는 기업과 기회를 찾는 인재를 연결하다
              </span>
            </motion.div>

            {/* 로고 */}
            <motion.div
              variants={fadeInUp}
              className="space-y-4 w-full max-w-xl mx-auto flex flex-col items-center justify-center"
            >
              <Image
                src={'/assets/white_text_logo.png'}
                alt="white_text_logo"
                width={200}
                height={200}
                className="w-80 h-auto -mt-24 -mb-16 ml-8"
              />
              <div className="space-y-2">
                <h1 className="text-xl md:text-2xl leading-tight text-white text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
                  기업과 인재를 잇는 신뢰형 매칭 플랫폼
                </h1>
                <p className="text-white text-lg text-center w-full drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
                  매칭 · 스케줄 · 경력 관리 까지 채용의 모든 과정을 하나로.
                </p>
              </div>
            </motion.div>

            {/* 버튼 */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap gap-3 justify-center"
            >
              <Button asChild variant="ghost" size="lg">
                <Link
                  href="/post"
                  className="border border-white/50 rounded-full px-4 py-2 hover:bg-white/10"
                >
                  <Search className="size-4 text-white" />
                  <span className="text-white text-sm">공고 찾기</span>
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link
                  href="/auth"
                  className="border border-white/50 rounded-full px-4 py-2 hover:bg-white/10"
                >
                  <span className="text-white text-sm">공고 작성하기</span>
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
};

export default HeroSection;
