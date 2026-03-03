import { cn } from '@/lib/utils';

const SectionBadge = ({
  title,
  textColor,
  bgColor,
}: {
  title: string;
  textColor: string;
  bgColor: string;
}) => (
  <div className="flex items-center justify-center">
    <h2 className={cn('text-xs font-bold p-2 px-4 rounded-full', textColor, bgColor)}>
      {title}
    </h2>
  </div>
);

export default SectionBadge;
