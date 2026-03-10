import HeaderNav from '@/app/components/HeaderNav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '고인력 | 공고',
  description: '스탭, 단기알바, 일일알바, 행사, 이벤트 구인 웹사이트',
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeaderNav />
      <main className="flex-1 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
