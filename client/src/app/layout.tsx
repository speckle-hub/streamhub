'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import Header from '@/components/Header';
import SearchOverlay from '@/components/SearchOverlay';
import SettingsModal from '@/components/SettingsModal';
import { useState, useEffect } from 'react';
import DetailModal from '@/components/DetailModal';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [selectedMeta, setSelectedMeta] = useState<any>(null);
  const [envError, setEnvError] = useState<string | null>(null);

  // Diagnostic: Check if critical env vars are missing on the client side
  // (Note: only NEXT_PUBLIC_ vars are available here, but we can check the health API)
  const checkHealth = async () => {
    try {
      console.log("[Diagnostic] Checking system health...");
      const res = await fetch('/api/health');
      if (!res.ok) {
        const body = await res.json();
        console.error("[Diagnostic] Health check failed:", body);
        setEnvError(`Server Error: ${body.database || 'Check logs'}`);
      } else {
        console.log("[Diagnostic] Health check passed.");
      }
    } catch (err) {
      console.error("[Diagnostic] Health check connection error:", err);
      setEnvError("Connection Error: Backend unreachable");
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Global API failure logger
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && !args[0].toString().includes('/api/health')) {
          console.error(`[API Failure] ${args[0]}: ${response.status} ${response.statusText}`);
        }
        return response;
      } catch (error) {
        console.error(`[API Connection Error] ${args[0]}:`, error);
        throw error;
      }
    };
  }, []);

  return (
    <html lang="en" className={`${inter.variable} dark text-white antialiased`}>
      <head>
        <title>StreamHub — Watch Movies, TV & Anime</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
      </head>
      <body className="bg-[#0a0a0a] min-h-screen">
        {envError && (
          <div style={{
            background: '#ff4757',
            color: 'white',
            padding: '12px',
            textAlign: 'center',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            ⚠️ Runtime Error: {envError} — Please check Vercel Environment Variables.
          </div>
        )}
        <ServiceWorkerRegister />
        <Providers>
          <Header />
          <main style={{ minHeight: '100vh', paddingTop: envError ? '120px' : '80px' }}>
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
