'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import Header from '@/components/Header';
import SearchOverlay from '@/components/SearchOverlay';
import SettingsModal from '@/components/SettingsModal';
import { useState } from 'react';
import DetailModal from '@/components/DetailModal';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [selectedMeta, setSelectedMeta] = useState<any>(null);

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <title>StreamHub — Watch Movies, TV & Anime</title>
        <meta name="application-name" content="StreamHub" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="StreamHub" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body>
        <ServiceWorkerRegister />
        <Providers>
          <Header />
          <main style={{ minHeight: '100vh', paddingTop: '80px' }}>
            {children}
          </main>
          
          <SearchOverlay onSelectMeta={setSelectedMeta} />
          <SettingsModal />
          
          {selectedMeta && (
            <DetailModal
              meta={selectedMeta}
              onClose={() => setSelectedMeta(null)}
            />
          )}
        </Providers>
      </body>
    </html>
  );
}
