import HeaderNav from '@/app/components/HeaderNav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '고인력',
  description: '스탭, 단기알바, 일일알바, 행사, 이벤트 구인 웹사이트',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gradient-to-b from-primary/60 to-background">
      <HeaderNav />
      {children}
    </div>
  );
}
