import { cn } from '@/lib/utils';

export default function SectionBadge({
  title,
  textColor,
  bgColor,
}: {
  title: string;
  /**
   * Tailwind class string. 예) "text-primary", "text-purple-500"
   */
  textColor: string;
  /**
   * Tailwind class string. 예) "bg-primary/10", "bg-purple-500/20"
   */
  bgColor: string;
}) {
  return (
    <div className="flex items-center justify-center">
      <h2
        className={cn('text-xs font-bold p-2 px-4 rounded-full', textColor, bgColor)}
      >
        {title}
      </h2>
    </div>
  );
}
