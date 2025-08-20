
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/layout/header';
import { Providers } from '@/components/layout/providers';
import { Footer } from '@/components/layout/footer';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Vinchaser',
  description: 'Community-based stolen vehicle recovery.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=IBM+Plex+Mono:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground flex flex-col min-h-screen">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </Providers>
        <Script src='https://storage.ko-fi.com/cdn/scripts/overlay-widget.js' strategy="afterInteractive" />
        <Script id="kofi-widget" strategy="afterInteractive">
          {`
            kofiWidgetOverlay.draw('autofind', {
              'type': 'floating-chat',
              'floating-chat.donateButton.text': 'Support me',
              'floating-chat.donateButton.background-color': '#00b9fe',
              'floating-chat.donateButton.text-color': '#fff'
            });
          `}
        </Script>
      </body>
    </html>
  );
}
