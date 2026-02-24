'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { fadeInUp } from '../atoms/animations';

const CtaSection = () => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-100px' }}
    variants={fadeInUp}
    className="bg-gradient-to-b from-primary/60 to-primary relative z-10"
  >
    <div className="max-w-6xl mx-auto px-4 py-12 sm:py-14 text-background space-y-4 text-center">
      <motion.h3 variants={fadeInUp} className="text-2xl sm:text-3xl font-bold">
        지금 바로 시작해보세요
      </motion.h3>
      <motion.p variants={fadeInUp} className="text-sm sm:text-base text-background/80">
        가입 후 공고를 등록하거나 원하는 공고에 지원해보세요.
      </motion.p>
      <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 justify-center">
        <InteractiveHoverButton className="border border-white/50 rounded-lg px-6 py-1 hover:bg-white/10 bg-primary/10 text-white">
          <Link href="/auth">회원가입</Link>
        </InteractiveHoverButton>
      </motion.div>
    </div>
  </motion.section>
);

export default CtaSection;
