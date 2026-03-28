// Data synchronization between offline storage and server
import { db } from './indexeddb';
import { networkMonitor } from './network';

export interface SyncStatus {
  lastSync: number | null;
  isSyncing: boolean;
  error: string | null;
}

export interface SyncOptions {
  force?: boolean;
  dataTypes?: Array<'cases' | 'documents' | 'contacts' | 'time_entries'>;
}

class DataSyncManager {
  private isSyncing = false;
  private lastSync: number | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    this.loadLastSync();
  }

  private async loadLastSync() {
    const metadata = await db.get<{ key: string; value: number }>('metadata', 'last_sync');
    if (metadata) {
      this.lastSync = metadata.value;
    }
  }

  private async saveLastSync() {
    this.lastSync = Date.now();
    await db.put('metadata', { key: 'last_sync', value: this.lastSync });
  }

  async sync(options: SyncOptions = {}): Promise<void> {
    if (this.isSyncing && !options.force) {
      console.log('[DataSync] Already syncing, skipping...');
      return;
    }

    if (!networkMonitor.getState().online) {
      throw new Error('Cannot sync while offline');
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const dataTypes = options.dataTypes || ['cases', 'documents', 'contacts', 'time_entries'];

      console.log('[DataSync] Starting sync for:', dataTypes);

      for (const dataType of dataTypes) {
        await this.syncDataType(dataType);
      }

      await this.saveLastSync();
      console.log('[DataSync] Sync complete');
    } catch (error) {
      console.error('[DataSync] Sync failed:', error);
      this.notifyListeners(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  private async syncDataType(dataType: string): Promise<void> {
    console.log(`[DataSync] Syncing ${dataType}...`);

    try {
      // Get last sync timestamp
      const lastSyncTimestamp = this.lastSync ? new Date(this.lastSync).toISOString() : null;

      // Fetch updated data from server (incremental sync)
      const url = lastSyncTimestamp
        ? `/api/sync/${dataType}?since=${lastSyncTimestamp}`
        : `/api/sync/${dataType}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Store in IndexedDB
      if (data.items && Array.isArray(data.items)) {
        await db.putMany(dataType as any, data.items);
        console.log(`[DataSync] Synced ${data.items.length} ${dataType}`);
      }
    } catch (error) {
      console.error(`[DataSync] Failed to sync ${dataType}:`, error);
      throw error;
    }
  }

  async downloadAllData(dataTypes?: string[]): Promise<void> {
    const types = dataTypes || ['cases', 'documents', 'contacts', 'time_entries'];

    console.log('[DataSync] Downloading all data for:', types);

    this.isSyncing = true;
    this.notifyListeners();

    try {
      for (const dataType of types) {
        const response = await fetch(`/api/sync/${dataType}/all`);
        
        if (!response.ok) {
          throw new Error(`Failed to download ${dataType}`);
        }

        const data = await response.json();

        if (data.items) {
          await db.putMany(dataType as any, data.items);
          console.log(`[DataSync] Downloaded ${data.items.length} ${dataType}`);
        }
      }

      await this.saveLastSync();
      console.log('[DataSync] Download complete');
    } catch (error) {
      console.error('[DataSync] Download failed:', error);
      this.notifyListeners(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  async getEstimatedSize(dataTypes?: string[]): Promise<number> {
    const types = dataTypes || ['cases', 'documents', 'contacts', 'time_entries'];

    try {
      const response = await fetch('/api/sync/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataTypes: types }),
      });

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      return data.estimatedBytes || 0;
    } catch (error) {
      console.error('[DataSync] Failed to estimate size:', error);
      return 0;
    }
  }

  getStatus(): SyncStatus {
    return {
      lastSync: this.lastSync,
      isSyncing: this.isSyncing,
      error: null,
    };
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(error: string | null = null): void {
    const status: SyncStatus = {
      lastSync: this.lastSync,
      isSyncing: this.isSyncing,
      error,
    };

    this.listeners.forEach((listener) => listener(status));
  }
}

export const dataSync = new DataSyncManager();

// React hook
import { useEffect, useState } from 'react';

export function useDataSync() {
  const [status, setStatus] = useState<SyncStatus>(dataSync.getStatus());

  useEffect(() => {
    const unsubscribe = dataSync.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return {
    ...status,
    sync: dataSync.sync.bind(dataSync),
    downloadAllData: dataSync.downloadAllData.bind(dataSync),
    getEstimatedSize: dataSync.getEstimatedSize.bind(dataSync),
  };
}
