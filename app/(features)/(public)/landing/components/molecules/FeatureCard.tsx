'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/app/components/ui/card';
import { staggerItem, scaleOnHover } from '../atoms/animations';

const featureColorClasses: Record<string, string> = {
  blue: 'bg-gradient-to-b from-blue-500 to-blue-300',
  pink: 'bg-gradient-to-b from-pink-500 to-pink-300',
  green: 'bg-gradient-to-b from-green-500 to-green-300',
  orange: 'bg-gradient-to-b from-orange-500 to-orange-300',
  purple: 'bg-gradient-to-b from-purple-500 to-purple-300',
};

const levelColorClasses: Record<string, string> = {
  스탭: 'text-blue-500 bg-blue-500/10',
  매니저: 'text-green-500 bg-green-500/10',
  전체: 'text-purple-500 bg-purple-500/10',
};

interface FeatureCardProps {
  feature: {
    icon: ReactNode;
    title: string;
    level: string;
    desc: string;
    color: string;
  };
}

export const FeatureCard = ({ feature }: FeatureCardProps) => (
  <motion.div variants={staggerItem} whileHover="hover" initial="rest" animate="rest">
    <motion.div variants={scaleOnHover}>
      <Card className="h-full border-none shadow-md hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-4 space-y-2">
          <div
            className={`flex items-center justify-center size-10 ${featureColorClasses[feature.color]} rounded-lg text-white`}
          >
            {feature.icon}
          </div>
          <div className="flex gap-1 items-center">
            <p className="font-bold text-foreground">{feature.title}</p>
            <p
              className={`text-xs leading-relaxed ${levelColorClasses[feature.level]} rounded-full px-2 py-1`}
            >
              {feature.level}
            </p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  </motion.div>
);
