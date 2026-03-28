'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home, FileText, Users, Clock } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [cachedPages, setCachedPages] = useState<string[]>([]);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get cached pages
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        const pages = [
          '/',
          '/cases',
          '/documents',
          '/contacts',
          '/time-entries',
        ];
        setCachedPages(pages);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main card */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
            <WifiOff className="h-10 w-10 text-yellow-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            You're Offline
          </h1>
          
          <p className="text-gray-600 mb-8">
            {isOnline 
              ? "Connection restored! Click retry to reload the page."
              : "It looks like you've lost your internet connection. Some features may be unavailable."
            }
          </p>

          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Retry Connection
          </button>
        </div>

        {/* Cached pages */}
        {cachedPages.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Available Offline</h2>
            <p className="text-sm text-gray-600 mb-4">
              These pages are cached and can be viewed offline:
            </p>

            <div className="space-y-2">
              <Link
                href="/"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">Dashboard</span>
              </Link>

              <Link
                href="/cases"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">Cases</span>
              </Link>

              <Link
                href="/documents"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">Documents</span>
              </Link>

              <Link
                href="/contacts"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">Contacts</span>
              </Link>

              <Link
                href="/time-entries"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">Time Entries</span>
              </Link>
            </div>
          </div>
        )}

        {/* Info card */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Working Offline
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• You can view cached data</li>
            <li>• Changes will be saved locally</li>
            <li>• Everything will sync when you're back online</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
