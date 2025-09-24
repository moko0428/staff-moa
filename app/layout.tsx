import type { Metadata } from 'next';
import './globals.css';

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
      <body className="max-w-lg mx-auto">{children}</body>
    </html>
  );
}
