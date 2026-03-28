'use client';

import { useSyncQueue } from '@/lib/offline/sync-queue';
import { useDataSync } from '@/lib/offline/data-sync';
import { RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function SyncProgress() {
  const { progress, syncAll, retryAll } = useSyncQueue();
  const { lastSync, isSyncing, sync } = useDataSync();

  const totalProgress = progress.total > 0 
    ? Math.round((progress.synced / progress.total) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Sync Status</h3>

      {/* Last sync time */}
      {lastSync && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Clock className="h-4 w-4" />
          <span>
            Last synced {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}
          </span>
        </div>
      )}

      {/* Progress bar */}
      {progress.total > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Sync progress</span>
            <span className="font-medium">{totalProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{progress.pending}</div>
          <div className="text-xs text-gray-600">Pending</div>
        </div>

        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-900">{progress.synced}</div>
          <div className="text-xs text-green-700">Synced</div>
        </div>

        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <XCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-900">{progress.failed}</div>
          <div className="text-xs text-red-700">Failed</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => sync()}
          disabled={isSyncing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>

        {progress.failed > 0 && (
          <button
            onClick={retryAll}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Retry Failed
          </button>
        )}
      </div>
    </div>
  );
}
