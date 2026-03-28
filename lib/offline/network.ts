// Network detection and monitoring
import { useEffect, useState, useCallback } from 'react';

export type ConnectionStatus = 'online' | 'offline' | 'checking';

export interface NetworkState {
  online: boolean;
  status: ConnectionStatus;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

class NetworkMonitor {
  private listeners: Set<(state: NetworkState) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;
  private currentState: NetworkState = {
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    status: typeof navigator !== 'undefined' ? (navigator.onLine ? 'online' : 'offline') : 'online',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Listen to browser online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Get network information if available
    this.updateNetworkInfo();

    // Start periodic connectivity checks
    this.startPeriodicCheck();
  }

  private handleOnline = () => {
    console.log('[Network] Connection restored');
    this.updateState({
      online: true,
      status: 'online',
    });
    this.verifyConnectivity();
  };

  private handleOffline = () => {
    console.log('[Network] Connection lost');
    this.updateState({
      online: false,
      status: 'offline',
    });
  };

  private updateNetworkInfo() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (connection) {
        this.currentState.effectiveType = connection.effectiveType;
        this.currentState.downlink = connection.downlink;
        this.currentState.rtt = connection.rtt;
        this.currentState.saveData = connection.saveData;
      }
    }
  }

  private async verifyConnectivity(): Promise<boolean> {
    try {
      // Ping the API to verify actual connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isOnline = response.ok;
      
      this.updateState({
        online: isOnline,
        status: isOnline ? 'online' : 'offline',
      });

      return isOnline;
    } catch (error) {
      console.log('[Network] Connectivity check failed:', error);
      this.updateState({
        online: false,
        status: 'offline',
      });
      return false;
    }
  }

  private startPeriodicCheck() {
    // Check connectivity every 30 seconds when online
    // Check every 10 seconds when offline (to detect reconnection faster)
    const checkInterval = () => {
      const interval = this.currentState.online ? 30000 : 10000;
      
      if (this.checkInterval) {
        clearTimeout(this.checkInterval);
      }
      
      this.checkInterval = setTimeout(async () => {
        await this.verifyConnectivity();
        checkInterval();
      }, interval);
    };

    checkInterval();
  }

  private updateState(update: Partial<NetworkState>) {
    this.currentState = {
      ...this.currentState,
      ...update,
    };

    this.updateNetworkInfo();

    // Notify all listeners
    this.listeners.forEach((listener) => {
      listener(this.currentState);
    });
  }

  public subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.add(listener);

    // Immediately notify with current state
    listener(this.currentState);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): NetworkState {
    return { ...this.currentState };
  }

  public async checkNow(): Promise<boolean> {
    this.updateState({ status: 'checking' });
    return await this.verifyConnectivity();
  }

  public destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }

    if (this.checkInterval) {
      clearTimeout(this.checkInterval);
    }

    this.listeners.clear();
  }
}

// Singleton instance
export const networkMonitor = new NetworkMonitor();

// React hook for network status
export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>(networkMonitor.getState());

  useEffect(() => {
    const unsubscribe = networkMonitor.subscribe(setState);
    return unsubscribe;
  }, []);

  return state;
}

// React hook with actions
export function useNetwork() {
  const state = useNetworkStatus();

  const checkNow = useCallback(async () => {
    return await networkMonitor.checkNow();
  }, []);

  return {
    ...state,
    checkNow,
    isOnline: state.online,
    isOffline: !state.online,
    isChecking: state.status === 'checking',
  };
}
