'use client';

import { motion } from 'framer-motion';

interface SectionDotsProps {
  total: number;
  activeIndex: number;
  goTo: (index: number) => void;
}

export const SectionDots = ({ total, activeIndex, goTo }: SectionDotsProps) => (
  <div
    className="fixed left-1/2 -translate-x-1/2 z-50 flex gap-2.5 items-center bg-white rounded-full px-3 py-2 shadow-lg"
    style={{ bottom: 'max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom)))' }}
  >
    {Array.from({ length: total }).map((_, i) => (
      <button
        key={i}
        onClick={() => goTo(i)}
        aria-label={`${i + 1}번 섹션으로 이동`}
        className="relative size-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
      >
        {i === activeIndex && (
          <motion.span
            layoutId="active-dot"
            className="absolute inset-0 rounded-full bg-primary"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </button>
    ))}
  </div>
);
