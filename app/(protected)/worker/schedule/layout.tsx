import type { Metadata } from 'next';

export const metadata: Metadata = { title: '내 스케줄' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
