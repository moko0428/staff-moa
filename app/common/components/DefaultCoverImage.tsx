import Image from 'next/image';
import { cn } from '@/lib/utils';

interface DefaultCoverImageProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function DefaultCoverImage({ className, style }: DefaultCoverImageProps) {
  return (
    <div
      className={cn('relative bg-muted flex items-center justify-center overflow-hidden', className)}
      style={style}
    >
      <Image
        src="/assets/primary_text_logo.png"
        alt="기본 커버 이미지"
        width={160}
        height={60}
        className="opacity-25 object-contain"
      />
    </div>
  );
}
