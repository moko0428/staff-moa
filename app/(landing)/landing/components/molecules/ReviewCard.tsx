import { Card, CardContent } from '@/app/components/ui/card';
import { StarRating } from '../atoms/StarRating';
import type { LandingReview } from '../../actions';

const maskName = (name: string | null): string => {
  if (!name) return '익명';
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  if (trimmed.length === 2) return trimmed[0] + 'O';
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  return first + 'O'.repeat(trimmed.length - 2) + last;
};

const roleLabel: Record<string, string> = {
  member: '스탭',
  manager: '매니저',
  pending_manager: '매니저',
  admin: '관리자',
};

interface ReviewCardProps {
  review: LandingReview;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const maskedName = maskName(review.user_name);
  const role = review.user_role ? (roleLabel[review.user_role] ?? review.user_role) : null;

  return (
    <Card className="w-64 shrink-0 bg-card hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-4 space-y-3">
        <StarRating rating={review.rating} />
        <p className="text-xs text-foreground leading-relaxed line-clamp-3">
          &ldquo;{review.content}&rdquo;
        </p>
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm font-medium text-foreground">{maskedName}</p>
          {role && (
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              {role}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
