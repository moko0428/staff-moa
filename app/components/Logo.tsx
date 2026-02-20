import { Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <Briefcase className="size-6 text-primary" />
      <span className="text-2xl font-bold">고인력</span>
    </Link>
  );
}
