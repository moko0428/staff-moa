'use client';

import { motion } from 'framer-motion';
import { staggerContainer } from '../atoms/animations';
import { SectionHeader } from '../molecules/SectionHeader';
import { StepCard } from '../molecules/StepCard';
import { steps } from '../../data/landing-data';

const HowItWorksSection = () => (
  <section className="bg-background border-t border-b border-border relative z-10">
    <div className="max-w-6xl mx-auto px-4 py-12 sm:py-14 space-y-6">
      <SectionHeader
        badge="이용 방법"
        badgeTextColor="text-primary"
        badgeBgColor="bg-primary/10"
        title="4단계로 간편하게"
        subtitle="누구나 쉽게 사용할 수 있습니다."
      />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:items-stretch"
      >
        {steps.map((step, idx) => (
          <StepCard
            key={step.title}
            step={step}
            index={idx}
            isLast={idx === steps.length - 1}
          />
        ))}
      </motion.div>
    </div>
  </section>
);

export default HowItWorksSection;
