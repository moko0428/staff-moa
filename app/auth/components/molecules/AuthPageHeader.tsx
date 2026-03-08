import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface AuthPageHeaderProps {
  title: string;
  description?: string;
  backHref: string;
}

const AuthPageHeader = ({ title, description, backHref }: AuthPageHeaderProps) => (
  <div>
    <div className="flex items-center gap-2">
      <Link href={backHref}>
        <ChevronLeft className="size-6" />
      </Link>
      <header>
        <h2 className="text-xl font-semibold">{title}</h2>
      </header>
    </div>
    {description && (
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    )}
  </div>
);

export default AuthPageHeader;
