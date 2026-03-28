'use client';

import { useNetwork } from '@/lib/offline/network';
import { useSyncQueue } from '@/lib/offline/sync-queue';
import { WifiOff, Wifi, AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineStatusBanner() {
  const { isOnline, isOffline, checkNow } = useNetwork();
  const { progress } = useSyncQueue();
  const [show, setShow] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setShow(true);
      setWasOffline(true);
    } else if (isOnline && wasOffline) {
      // Show "back online" message briefly
      setTimeout(() => {
        if (progress.pending === 0) {
          setShow(false);
        }
      }, 3000);
    }
  }, [isOnline, isOffline, wasOffline, progress.pending]);

  if (!show) return null;

  const isSyncing = progress.pending > 0 && isOnline;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${
        isOffline ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
      } border-b`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOffline ? (
              <WifiOff className="h-5 w-5 text-yellow-600" />
            ) : (
              <Wifi className="h-5 w-5 text-green-600" />
            )}
            
            <div>
              {isOffline && (
                <>
                  <p className="text-sm font-medium text-yellow-900">
                    You're offline
                  </p>
                  <p className="text-xs text-yellow-700">
                    Changes will sync when you're back online
                    {progress.pending > 0 && ` • ${progress.pending} changes pending`}
                  </p>
                </>
              )}

              {isOnline && isSyncing && (
                <>
                  <p className="text-sm font-medium text-green-900">
                    Back online - Syncing changes
                  </p>
                  <p className="text-xs text-green-700">
                    Syncing {progress.pending} of {progress.total} changes...
                  </p>
                </>
              )}

              {isOnline && !isSyncing && (
                <>
                  <p className="text-sm font-medium text-green-900">
                    You're back online
                  </p>
                  <p className="text-xs text-green-700">
                    All changes synced successfully
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {progress.failed > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {progress.failed} failed
                </span>
              </div>
            )}

            {isOffline && (
              <button
                onClick={checkNow}
                className="text-xs text-yellow-700 hover:text-yellow-900 underline"
              >
                Check connection
              </button>
            )}

            {isSyncing && (
              <RefreshCw className="h-4 w-4 text-green-600 animate-spin" />
            )}

            <button
              onClick={() => setShow(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
