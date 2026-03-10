import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `고인력 | 공고 #${id}`,
    description: '스탭, 단기알바, 일일알바, 행사, 이벤트 구인 웹사이트',
  };
}

export default function PostLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 max-w-7xl w-full mx-auto p-4">{children}</main>
    </div>
  );
}
