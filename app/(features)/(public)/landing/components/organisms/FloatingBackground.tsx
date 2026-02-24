'use client';

import { motion } from 'framer-motion';

const FloatingBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    <motion.div
      className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
      animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute top-40 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
      animate={{ y: [0, 20, 0], rotate: [0, -5, 5, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute bottom-40 left-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"
      animate={{ y: [0, -15, 0], rotate: [0, 3, -3, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

export default FloatingBackground;
