import { motion } from 'framer-motion';
import { Card, CardContent } from '@/app/components/ui/card';
import { Marquee } from '@/components/ui/marquee';
import { Skeleton } from '@/components/ui/skeleton';
import { fadeIn } from '../atoms/animations';
import { SectionHeader } from '../molecules/SectionHeader';
import { ReviewCard } from '../molecules/ReviewCard';
import type { LandingReview } from '../../actions';

interface ReviewsSectionProps {
  reviews: LandingReview[];
  isLoading?: boolean;
}

const ReviewsSection = ({ reviews, isLoading }: ReviewsSectionProps) => (
  <section className="w-full overflow-hidden bg-background border-t border-border relative z-10">
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-6">
      <SectionHeader
        badge="사용자 후기"
        badgeTextColor="text-purple-500"
        badgeBgColor="bg-purple-500/20"
        title="실제 사용자들의 이야기"
        subtitle="많은 분들이 고인력과 함께하고 있습니다"
      />
    </div>

    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="relative pb-10"
    >
      {isLoading ? (
        <div className="flex gap-4 px-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-80 shrink-0 rounded-xl border bg-card p-5 space-y-4">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="size-4 rounded-full" />
                ))}
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
              <div className="flex items-center gap-3 pt-2 border-t">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="max-w-6xl mx-auto px-4 pb-10">
          <Card className="bg-card">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              아직 노출 중인 후기가 없습니다. (관리자 대시보드에서 후기를 선택할 수 있어요)
            </CardContent>
          </Card>
        </div>
      ) : (
        <Marquee pauseOnHover className="[--duration:30s]">
          {reviews.map((review, idx) => (
            <ReviewCard key={review.review_id ?? `review-${idx}`} review={review} />
          ))}
        </Marquee>
      )}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background to-transparent" />
    </motion.div>
  </section>
);

export default ReviewsSection;
