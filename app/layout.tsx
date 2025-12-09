import type { Metadata } from 'next';
import './globals.css';
import HeaderNav from '@/components/HeaderNav';

export const metadata: Metadata = {
  title: 'Staff MOA',
  description: '스탭, 단기알바, 일일알바, 행사, 이벤트 구인 웹사이트',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-accent text-foreground">
        <HeaderNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
