
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/layout/header';
import { Providers } from '@/components/layout/providers';
import { Footer } from '@/components/layout/footer';


export const metadata: Metadata = {
  title: 'VINscout',
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
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground flex flex-col min-h-screen">
        <Providers>
            <Header />
            <main className="flex-1 bg-gradient-to-b from-background to-gray-900">{children}</main>
            <Footer />
            <Toaster />
        </Providers>
      </body>
    </html>
  );
}
