import type { Metadata } from 'next';
import { Suspense } from 'react';
import localFont from 'next/font/local';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/sonner';
import GoogleAnalyticsRouteTracker from '@/app/components/GoogleAnalyticsRouteTracker';
import SwRegister from '@/app/components/SwRegister';

export const metadata: Metadata = {
  title: {
    default: '고인력 | 단기알바·스탭 구인구직',
    template: '%s | 고인력',
  },
  description: '단기알바, 스탭, 일일알바, 행사·이벤트 구인구직 플랫폼. 고인력에서 빠르게 구인하고 지원하세요.',
  keywords: ['단기알바', '스탭 구인', '일일알바', '행사알바', '이벤트 스탭', '구인구직', '고인력'],
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://www.goinlyeog.com',
  },
  openGraph: {
    title: '고인력 | 단기알바·스탭 구인구직',
    description: '단기알바, 스탭, 일일알바, 행사·이벤트 구인구직 플랫폼. 고인력에서 빠르게 구인하고 지원하세요.',
    images: [{ url: 'https://www.goinlyeog.com/opengraph-image', width: 1200, height: 630 }],
    url: 'https://www.goinlyeog.com',
    siteName: '고인력',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '고인력 | 단기알바·스탭 구인구직',
    description: '단기알바, 스탭, 일일알바, 행사·이벤트 구인구직 플랫폼.',
    images: ['https://www.goinlyeog.com/opengraph-image'],
  },
  icons: {
    apple: [{ url: '/assets/primary_logo_192.png', sizes: '192x192' }],
    icon: [
      {
        url: '/assets/primary_logo_192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/assets/primary_logo_512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
};

const GA_ID = process.env.GA_ID!;

const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.ttf',
  display: 'swap',
  weight: '100 900',
  variable: '--font-pretendard',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`min-h-screen bg-background text-foreground overscroll-none antialiased ${pretendard.variable} ${pretendard.className}`}
      >
        {/* Google tag (gtag.js) */}
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <Suspense fallback={null}>
          <GoogleAnalyticsRouteTracker gaId={GA_ID} />
        </Suspense>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  name: '고인력',
                  alternateName: 'goinlyeog',
                  url: 'https://www.goinlyeog.com',
                },
                {
                  '@type': 'Organization',
                  name: '고인력',
                  url: 'https://www.goinlyeog.com',
                  logo: 'https://www.goinlyeog.com/assets/primary_logo_512.png',
                },
              ],
            }),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main>{children}</main>
          <Toaster />
          <Analytics />
          <SwRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
