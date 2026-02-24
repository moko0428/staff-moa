'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { staggerItem, scaleOnHover } from '../atoms/animations';

interface StepCardProps {
  step: { title: string; desc: string; icon: ReactNode };
  index: number;
  isLast: boolean;
}

export const StepCard = ({ step, index, isLast }: StepCardProps) => (
  <motion.div
    variants={staggerItem}
    whileHover="hover"
    initial="rest"
    animate="rest"
    className="h-full min-h-0 flex flex-col"
  >
    <motion.div variants={scaleOnHover} className="h-full flex flex-col">
      <Card className="h-full min-h-0 flex flex-col relative overflow-visible">
        {!isLast && (
          <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
            <div className="size-7 rounded-full bg-background border border-border flex items-center justify-center">
              <ArrowRight className="size-4 text-muted-foreground" />
            </div>
          </div>
        )}
        <CardContent className="p-4 space-y-2 flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-10 bg-primary rounded-lg">
              <span className="text-xl font-semibold text-primary-foreground">
                {index + 1}
              </span>
            </div>
            <div className="flex items-center justify-center size-10 bg-primary/20 text-primary rounded-lg">
              {step.icon}
            </div>
          </div>
          <p className="font-bold text-foreground">{step.title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  </motion.div>
);
