import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/sonner';
import GoogleAnalyticsRouteTracker from '@/app/components/GoogleAnalyticsRouteTracker';

export const metadata: Metadata = {
  title: 'Staff MOA',
  description: '스탭, 단기알바, 일일알바, 행사, 이벤트 구인 웹사이트',
};

const GA_ID = process.env.GA_ID!;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-accent text-foreground">
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
        <GoogleAnalyticsRouteTracker gaId={GA_ID} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main>{children}</main>
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
