import type { Metadata } from 'next';

export const metadata: Metadata = { title: '공고 수정' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
