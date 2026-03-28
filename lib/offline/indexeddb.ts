// IndexedDB wrapper for offline data storage
const DB_NAME = 'lexora-offline';
const DB_VERSION = 1;

export interface OfflineStore {
  cases: string;
  documents: string;
  contacts: string;
  time_entries: string;
  sync_queue: string;
  metadata: string;
}

const STORES: Record<keyof OfflineStore, { keyPath: string; indexes?: Array<{ name: string; keyPath: string; unique?: boolean }> }> = {
  cases: { 
    keyPath: 'id',
    indexes: [
      { name: 'updated_at', keyPath: 'updated_at' },
      { name: 'status', keyPath: 'status' }
    ]
  },
  documents: { 
    keyPath: 'id',
    indexes: [
      { name: 'case_id', keyPath: 'case_id' },
      { name: 'created_at', keyPath: 'created_at' }
    ]
  },
  contacts: { 
    keyPath: 'id',
    indexes: [
      { name: 'email', keyPath: 'email', unique: true },
      { name: 'type', keyPath: 'type' }
    ]
  },
  time_entries: { 
    keyPath: 'id',
    indexes: [
      { name: 'case_id', keyPath: 'case_id' },
      { name: 'created_at', keyPath: 'created_at' }
    ]
  },
  sync_queue: { 
    keyPath: 'id',
    indexes: [
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'status', keyPath: 'status' }
    ]
  },
  metadata: { 
    keyPath: 'key' 
  }
};

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        Object.entries(STORES).forEach(([name, config]) => {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath: config.keyPath });
            
            // Create indexes
            config.indexes?.forEach((index) => {
              store.createIndex(index.name, index.keyPath, { unique: index.unique });
            });
          }
        });
      };
    });

    return this.initPromise;
  }

  async get<T>(storeName: keyof OfflineStore, key: string): Promise<T | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: keyof OfflineStore): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex<T>(
    storeName: keyof OfflineStore, 
    indexName: string, 
    value: string | number
  ): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: keyof OfflineStore, value: T): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async putMany<T>(storeName: keyof OfflineStore, values: T[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      values.forEach((value) => store.put(value));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async delete(storeName: keyof OfflineStore, key: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: keyof OfflineStore): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.init();
    const storeNames = Object.keys(STORES) as Array<keyof OfflineStore>;
    
    await Promise.all(
      storeNames.map((storeName) => this.clear(storeName))
    );
  }

  async count(storeName: keyof OfflineStore): Promise<number> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }

  async clearOldData(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTimestamp = cutoffDate.getTime();

    const storesToClean: Array<keyof OfflineStore> = ['cases', 'documents', 'time_entries'];

    for (const storeName of storesToClean) {
      const db = await this.init();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const index = store.index('updated_at') || store.index('created_at');

      if (!index) continue;

      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const record = cursor.value;
          const timestamp = new Date(record.updated_at || record.created_at).getTime();
          
          if (timestamp < cutoffTimestamp) {
            cursor.delete();
          }
          
          cursor.continue();
        }
      };
    }
  }
}

export const db = new IndexedDBManager();
