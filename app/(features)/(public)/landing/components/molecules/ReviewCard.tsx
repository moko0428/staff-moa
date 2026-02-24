import { Card, CardContent } from '@/app/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
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

interface ReviewCardProps {
  review: LandingReview;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const maskedName = maskName(review.user_name);
  return (
    <Card className="w-80 shrink-0 bg-card hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-5 space-y-4">
        <StarRating rating={review.rating} />
        <p className="text-sm text-foreground leading-relaxed line-clamp-3">
          &ldquo;{review.content}&rdquo;
        </p>
        <div className="flex items-center gap-3 pt-2 border-t">
          <Avatar className="size-10">
            <AvatarImage src={review.user_avatar ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {maskedName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{maskedName}</p>
            <p className="text-xs text-muted-foreground">사용자</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
