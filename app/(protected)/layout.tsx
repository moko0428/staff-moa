import HeaderNav from '@/app/components/HeaderNav';
import Footer from '@/app/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '고인력',
  description: '스탭 구인은 고인력에서 시작됩니다.',
};

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-accent">
      <HeaderNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4">{children}</main>
      <Footer />
    </div>
  );
}
