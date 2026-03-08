import Link from 'next/link';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';
import { fadeInUp, staggerContainer } from '../atoms/animations';

const CtaSection = () => (
  <section className="w-full bg-gradient-to-b from-primary/60 to-primary relative z-10 flex flex-col pb-[env(safe-area-inset-bottom)]">
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto px-4 py-14 text-primary-foreground space-y-4 text-center"
    >
      <motion.h3 variants={fadeInUp} className="text-3xl font-bold">
        지금 바로 시작해보세요
      </motion.h3>
      <motion.p variants={fadeInUp} className="text-base text-primary-foreground/80">
        가입 후 공고를 등록하거나 원하는 공고에 지원해보세요.
      </motion.p>
      <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 justify-center">
        <InteractiveHoverButton className="border border-white/50 rounded-lg px-6 py-1 hover:bg-white/10 bg-primary/10 text-white">
          <Link href="/auth">회원가입</Link>
        </InteractiveHoverButton>
      </motion.div>
    </motion.div>

    <footer className="bg-black/30 text-primary-foreground/70">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-primary-foreground" />
          <span className="text-sm font-semibold text-primary-foreground">고인력</span>
        </div>
        <div className="text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} goinlyeog All rights reserved.
        </div>
      </div>
    </footer>
  </section>
);

export default CtaSection;
