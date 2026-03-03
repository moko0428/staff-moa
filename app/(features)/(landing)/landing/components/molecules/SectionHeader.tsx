import { motion } from 'framer-motion';
import { fadeInUp } from '../atoms/animations';
import SectionBadge from '../section-badge';

interface SectionHeaderProps {
  badge: string;
  badgeTextColor: string;
  badgeBgColor: string;
  title: string;
  subtitle: string;
}

export const SectionHeader = ({
  badge,
  badgeTextColor,
  badgeBgColor,
  title,
  subtitle,
}: SectionHeaderProps) => (
  <>
    <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
      <SectionBadge title={badge} textColor={badgeTextColor} bgColor={badgeBgColor} />
    </motion.div>

    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="flex flex-col items-center justify-center gap-2"
    >
      <h2 className="text-xl sm:text-4xl font-bold text-foreground">{title}</h2>
      <small className="text-sm text-muted-foreground">{subtitle}</small>
    </motion.div>
  </>
);
