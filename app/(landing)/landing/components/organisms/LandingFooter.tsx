'use client';

import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import { fadeIn } from '../atoms/animations';

const LandingFooter = () => (
  <motion.footer
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={fadeIn}
    className="bg-zinc-900 text-zinc-300 relative z-10"
  >
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-2">
        <Briefcase className="size-4 text-white" />
        <span className="text-sm font-semibold text-white">고인력</span>
      </div>
      <div className="text-xs text-zinc-400">
        © {new Date().getFullYear()} goinlyeog All rights reserved.
      </div>
    </div>
  </motion.footer>
);

export default LandingFooter;
