import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export default function UserAvatar({
  src,
  name,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const initial = (name?.trim() || '?').charAt(0).toUpperCase();

  return (
    <Avatar className={className}>
      <AvatarImage
        src={src ?? undefined}
        alt={name ?? ''}
        className="object-cover"
      />
      <AvatarFallback
        className={cn(
          'bg-primary/50 text-primary-foreground font-semibold',
          fallbackClassName,
        )}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
