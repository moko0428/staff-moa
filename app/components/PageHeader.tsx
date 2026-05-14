'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  title: React.ReactNode;
  right?: React.ReactNode;
}

export default function PageHeader({ title, right }: Props) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-40 bg-background flex items-center justify-between border-b border-border px-4 h-16">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors"
      >
        <ChevronLeft className="size-5" />
      </button>
      <h1 className="font-bold text-base">{title}</h1>
      <div className="flex items-center justify-end min-w-8">
        {right ?? null}
      </div>
    </div>
  );
}
