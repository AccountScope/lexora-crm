// Service Worker registration and management
export interface ServiceWorkerStatus {
  supported: boolean;
  registered: boolean;
  installing: boolean;
  waiting: boolean;
  active: boolean;
  controller: ServiceWorker | null;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private listeners: Set<(status: ServiceWorkerStatus) => void> = new Set();

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[SW] Service workers not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW] Service worker registered:', this.registration.scope);

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        console.log('[SW] Update found');
        this.notifyListeners();
        
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('[SW] State changed:', newWorker.state);
            this.notifyListeners();
          });
        }
      });

      // Listen for controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed');
        this.notifyListeners();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[SW] Message received:', event.data);
        
        if (event.data.type === 'SYNC_STARTED') {
          // Trigger sync queue
          window.dispatchEvent(new CustomEvent('sw-sync-started'));
        }
      });

      this.notifyListeners();
      return this.registration;
    } catch (error) {
      console.error('[SW] Registration failed:', error);
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const success = await this.registration.unregister();
      console.log('[SW] Unregistered:', success);
      this.registration = null;
      this.notifyListeners();
      return success;
    } catch (error) {
      console.error('[SW] Unregister failed:', error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('[SW] Update triggered');
    } catch (error) {
      console.error('[SW] Update failed:', error);
    }
  }

  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) return;

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    console.log('[SW] Skip waiting sent');
  }

  async clearCache(): Promise<void> {
    if (!navigator.serviceWorker.controller) return;

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          console.log('[SW] Cache cleared');
          resolve();
        } else {
          reject(new Error('Failed to clear cache'));
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }

  async getCacheSize(): Promise<number> {
    if (!navigator.serviceWorker.controller) return 0;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.size || 0);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );
    });
  }

  getStatus(): ServiceWorkerStatus {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return {
        supported: false,
        registered: false,
        installing: false,
        waiting: false,
        active: false,
        controller: null,
      };
    }

    return {
      supported: true,
      registered: !!this.registration,
      installing: !!this.registration?.installing,
      waiting: !!this.registration?.waiting,
      active: !!this.registration?.active,
      controller: navigator.serviceWorker.controller,
    };
  }

  subscribe(listener: (status: ServiceWorkerStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }
}

export const serviceWorker = new ServiceWorkerManager();

// React hook
import { useEffect, useState } from 'react';

export function useServiceWorker() {
  const [status, setStatus] = useState<ServiceWorkerStatus>(serviceWorker.getStatus());

  useEffect(() => {
    const unsubscribe = serviceWorker.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return {
    ...status,
    register: serviceWorker.register.bind(serviceWorker),
    unregister: serviceWorker.unregister.bind(serviceWorker),
    update: serviceWorker.update.bind(serviceWorker),
    skipWaiting: serviceWorker.skipWaiting.bind(serviceWorker),
    clearCache: serviceWorker.clearCache.bind(serviceWorker),
    getCacheSize: serviceWorker.getCacheSize.bind(serviceWorker),
  };
}
