import { Star } from 'lucide-react';

export const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`size-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
        }`}
      />
    ))}
  </div>
);
