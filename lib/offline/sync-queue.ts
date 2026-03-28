// API call queue for offline requests
import { db } from './indexeddb';
import { networkMonitor } from './network';

export interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
  priority?: number;
}

export interface SyncProgress {
  total: number;
  synced: number;
  failed: number;
  pending: number;
}

class SyncQueueManager {
  private isSyncing = false;
  private listeners: Set<(progress: SyncProgress) => void> = new Set();
  private maxRetries = 3;

  constructor() {
    // Listen to network changes
    if (typeof window !== 'undefined') {
      networkMonitor.subscribe((state) => {
        if (state.online && !this.isSyncing) {
          this.syncAll();
        }
      });
    }
  }

  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries' | 'status'>): Promise<string> {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: this.generateId(),
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
      priority: request.priority || 0,
    };

    await db.put('sync_queue', queuedRequest);
    console.log('[SyncQueue] Request queued:', queuedRequest.id);

    // Try to sync immediately if online
    if (networkMonitor.getState().online) {
      this.syncAll();
    }

    return queuedRequest.id;
  }

  async dequeue(id: string): Promise<void> {
    await db.delete('sync_queue', id);
    this.notifyListeners();
  }

  async getAll(): Promise<QueuedRequest[]> {
    return await db.getAll<QueuedRequest>('sync_queue');
  }

  async getPending(): Promise<QueuedRequest[]> {
    const all = await this.getAll();
    return all.filter((req) => req.status === 'pending' || req.status === 'failed')
      .sort((a, b) => {
        // Sort by priority (higher first), then by timestamp (older first)
        if (a.priority !== b.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return a.timestamp - b.timestamp;
      });
  }

  async getProgress(): Promise<SyncProgress> {
    const all = await this.getAll();
    
    return {
      total: all.length,
      synced: all.filter((r) => r.status === 'synced').length,
      failed: all.filter((r) => r.status === 'failed').length,
      pending: all.filter((r) => r.status === 'pending').length,
    };
  }

  async syncAll(): Promise<void> {
    if (this.isSyncing) {
      console.log('[SyncQueue] Already syncing, skipping...');
      return;
    }

    if (!networkMonitor.getState().online) {
      console.log('[SyncQueue] Offline, cannot sync');
      return;
    }

    this.isSyncing = true;
    console.log('[SyncQueue] Starting sync...');

    try {
      const pending = await this.getPending();
      
      if (pending.length === 0) {
        console.log('[SyncQueue] No pending requests');
        return;
      }

      console.log(`[SyncQueue] Syncing ${pending.length} requests`);

      for (const request of pending) {
        await this.syncRequest(request);
        this.notifyListeners();
      }

      console.log('[SyncQueue] Sync complete');
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  private async syncRequest(request: QueuedRequest): Promise<void> {
    try {
      // Update status to syncing
      request.status = 'syncing';
      await db.put('sync_queue', request);

      // Make the request
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers,
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Success - mark as synced
      request.status = 'synced';
      await db.put('sync_queue', request);

      // Remove after a delay (keep for audit trail)
      setTimeout(() => {
        this.dequeue(request.id);
      }, 60000); // Remove after 1 minute

      console.log('[SyncQueue] Request synced:', request.id);
    } catch (error) {
      console.error('[SyncQueue] Sync failed:', request.id, error);

      request.retries += 1;
      request.error = error instanceof Error ? error.message : 'Unknown error';

      if (request.retries >= this.maxRetries) {
        request.status = 'failed';
        console.error('[SyncQueue] Request failed permanently:', request.id);
      } else {
        request.status = 'pending';
        console.log('[SyncQueue] Request will be retried:', request.id, `(${request.retries}/${this.maxRetries})`);
      }

      await db.put('sync_queue', request);
    }
  }

  async retry(id: string): Promise<void> {
    const request = await db.get<QueuedRequest>('sync_queue', id);
    
    if (request) {
      request.status = 'pending';
      request.retries = 0;
      request.error = undefined;
      await db.put('sync_queue', request);
      
      if (networkMonitor.getState().online) {
        this.syncAll();
      }
    }
  }

  async retryAll(): Promise<void> {
    const failed = (await this.getAll()).filter((r) => r.status === 'failed');
    
    for (const request of failed) {
      await this.retry(request.id);
    }
  }

  async clearSynced(): Promise<void> {
    const all = await this.getAll();
    const synced = all.filter((r) => r.status === 'synced');
    
    for (const request of synced) {
      await this.dequeue(request.id);
    }
  }

  async clearAll(): Promise<void> {
    await db.clear('sync_queue');
    this.notifyListeners();
  }

  subscribe(listener: (progress: SyncProgress) => void): () => void {
    this.listeners.add(listener);

    // Immediately notify with current progress
    this.getProgress().then(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.getProgress().then((progress) => {
      this.listeners.forEach((listener) => listener(progress));
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const syncQueue = new SyncQueueManager();

// React hook for sync queue
import { useEffect, useState } from 'react';

export function useSyncQueue() {
  const [progress, setProgress] = useState<SyncProgress>({
    total: 0,
    synced: 0,
    failed: 0,
    pending: 0,
  });

  useEffect(() => {
    const unsubscribe = syncQueue.subscribe(setProgress);
    return unsubscribe;
  }, []);

  return {
    progress,
    enqueue: syncQueue.enqueue.bind(syncQueue),
    syncAll: syncQueue.syncAll.bind(syncQueue),
    retry: syncQueue.retry.bind(syncQueue),
    retryAll: syncQueue.retryAll.bind(syncQueue),
    clearSynced: syncQueue.clearSynced.bind(syncQueue),
    clearAll: syncQueue.clearAll.bind(syncQueue),
  };
}
