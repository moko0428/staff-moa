import type { Metadata } from 'next';

export const metadata: Metadata = { title: '관심 공고' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
