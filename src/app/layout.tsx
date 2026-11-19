import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';

const bp = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata: Metadata = {
  title: 'TLE 学習アプリ - アクティブリコール学習',
  description: '経静脈的リード抜去術（TLE）ガイドライン・抜去手技・危機管理 アクティブリコール想起訓練Webアプリ',
  manifest: `${bp}/manifest.json`,
  icons: {
    icon: [
      { url: `${bp}/favicon.svg?v=3`, type: 'image/svg+xml' },
      { url: `${bp}/icon-192x192.png?v=3`, sizes: '192x192', type: 'image/png' },
      { url: `${bp}/icon-512x512.png?v=3`, sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: `${bp}/apple-touch-icon.png?v=3`, sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TLE学習',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen bg-white text-slate-900 flex flex-col selection:bg-teal-500/20 selection:text-slate-900">
        <Header />
        <PWAInstallBanner />
        <main className="flex-1 flex flex-col pb-16 bg-white">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
