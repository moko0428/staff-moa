import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '고인력',
  description: '스탭 구인은 고인력에서 시작됩니다.',
};

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-background">
      <main className="max-w-7xl w-full mx-auto p-4">{children}</main>
    </div>
  );
}
