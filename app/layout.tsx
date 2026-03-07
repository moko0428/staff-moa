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
  title: '고인력',
  description: '스탭, 단기알바, 일일알바, 행사, 이벤트 구인 웹사이트',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    url: 'https://www.goinlyeog.com',
    title: '고인력',
    description: '스탭, 단기알바, 일일알바, 행사, 이벤트 구인 웹사이트',
    siteName: '고인력',
    images: [{ url: 'https://www.goinlyeog.com/assets/primary_logo_512.png' }],
  },
  twitter: {
    card: 'summary',
    title: '고인력',
    description: '스탭, 단기알바, 일일알바, 행사, 이벤트 구인 웹사이트',
    images: ['https://www.goinlyeog.com/assets/primary_logo_512.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '고인력',
    startupImage: '/assets/primary_logo_512.png',
  },
  icons: {
    apple: [{ url: '/assets/primary_logo_192.png', sizes: '192x192' }],
    icon: [
      { url: '/assets/primary_logo_192.png', sizes: '192x192', type: 'image/png' },
      { url: '/assets/primary_logo_512.png', sizes: '512x512', type: 'image/png' },
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
        className={`min-h-screen bg-accent text-foreground overscroll-none antialiased ${pretendard.variable} ${pretendard.className}`}
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
