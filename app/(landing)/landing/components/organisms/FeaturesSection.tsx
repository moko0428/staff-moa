import { motion } from 'framer-motion';
import { staggerContainer } from '../atoms/animations';
import { SectionHeader } from '../molecules/SectionHeader';
import { FeatureCard } from '../molecules/FeatureCard';
import { features } from '../../data/landing-data';

const FeaturesSection = () => (
  <section className="w-full overflow-hidden bg-background border-t border-border relative z-10">
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-8">
      <SectionHeader
        badge="주요 기능"
        badgeTextColor="text-purple-500"
        badgeBgColor="bg-purple-500/20"
        title="모든 기능을 한 곳에서"
        subtitle="역할별 사용자 중심의 편리한 기능을 제공합니다."
      />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {features.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </motion.div>
    </div>
  </section>
);

export default FeaturesSection;
