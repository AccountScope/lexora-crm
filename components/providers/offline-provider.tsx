'use client';

import { useEffect } from 'react';
import { serviceWorker } from '@/lib/offline/service-worker';
import { OfflineStatusBanner } from '@/components/offline/status-banner';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker on mount
    if ('serviceWorker' in navigator) {
      serviceWorker.register().then((registration) => {
        if (registration) {
          console.log('[App] Service worker registered');
        }
      });
    }
  }, []);

  return (
    <>
      <OfflineStatusBanner />
      {children}
    </>
  );
}
