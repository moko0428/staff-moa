import type { Metadata } from 'next';

export const metadata: Metadata = { title: '출근 체크인' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
