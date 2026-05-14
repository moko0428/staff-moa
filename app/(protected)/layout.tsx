import ConditionalHeaderNav from '@/app/components/ConditionalHeaderNav';
import ConditionalFooter from '@/app/components/ConditionalFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  description: '스탭 구인은 고인력에서 시작됩니다.',
};

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-accent">
      <ConditionalHeaderNav />
      <main className="max-w-7xl w-full mx-auto">{children}</main>
      <ConditionalFooter />
    </div>
  );
}
