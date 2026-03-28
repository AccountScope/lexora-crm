'use client';

import { useState, useEffect } from 'react';
import { Download, Trash2, RefreshCw, HardDrive, Wifi, WifiOff, Check } from 'lucide-react';
import { useServiceWorker } from '@/lib/offline/service-worker';
import { useDataSync } from '@/lib/offline/data-sync';
import { db } from '@/lib/offline/indexeddb';
import { SyncProgress } from '@/components/offline/sync-progress';

export default function OfflineSettingsPage() {
  const { registered, register, unregister, clearCache, getCacheSize } = useServiceWorker();
  const { sync, downloadAllData, getEstimatedSize } = useDataSync();
  
  const [enabled, setEnabled] = useState(registered);
  const [syncFrequency, setSyncFrequency] = useState<'manual' | 'hourly' | 'daily'>('manual');
  const [dataRetention, setDataRetention] = useState<7 | 30 | 90 | 999>(30);
  const [selectedData, setSelectedData] = useState({
    cases: true,
    documents: true,
    contacts: true,
    time_entries: true,
  });
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [estimatedSize, setEstimatedSize] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const settings = localStorage.getItem('offline-settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setSyncFrequency(parsed.syncFrequency || 'manual');
      setDataRetention(parsed.dataRetention || 30);
    }

    // Get current cache size
    updateCacheSize();
  }, []);

  const updateCacheSize = async () => {
    const size = await getCacheSize();
    setCacheSize(size);
  };

  const handleToggleOffline = async () => {
    if (enabled) {
      await unregister();
      setEnabled(false);
    } else {
      await register();
      setEnabled(true);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('offline-settings', JSON.stringify({
      syncFrequency,
      dataRetention,
    }));
    
    // Show success message
    alert('Settings saved successfully');
  };

  const handleDownloadData = async () => {
    setIsDownloading(true);
    
    try {
      const types = Object.entries(selectedData)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);

      await downloadAllData(types);
      await updateCacheSize();
      
      alert('Data downloaded successfully');
    } catch (error) {
      alert('Failed to download data: ' + (error as Error).message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClearOfflineData = async () => {
    if (!confirm('Are you sure? This will delete all offline data.')) {
      return;
    }

    try {
      await clearCache();
      await db.clearAll();
      await updateCacheSize();
      
      alert('Offline data cleared successfully');
    } catch (error) {
      alert('Failed to clear offline data: ' + (error as Error).message);
    }
  };

  const handleEstimateSize = async () => {
    const types = Object.entries(selectedData)
      .filter(([_, enabled]) => enabled)
      .map(([type]) => type);

    const size = await getEstimatedSize(types);
    setEstimatedSize(size);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Offline Settings</h1>

      <div className="space-y-6">
        {/* Enable/Disable Offline Mode */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Offline Mode</h2>
              <p className="text-sm text-gray-600">
                Enable offline access to your data and work without internet
              </p>
            </div>
            <button
              onClick={handleToggleOffline}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {enabled && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800">Offline mode is enabled</span>
            </div>
          )}
        </div>

        {/* Sync Progress */}
        {enabled && <SyncProgress />}

        {/* Sync Settings */}
        {enabled && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Sync Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Frequency
                </label>
                <select
                  value={syncFrequency}
                  onChange={(e) => setSyncFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="manual">Manual only</option>
                  <option value="hourly">Every hour</option>
                  <option value="daily">Once per day</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Retention
                </label>
                <select
                  value={dataRetention}
                  onChange={(e) => setDataRetention(Number(e.target.value) as any)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={999}>Forever</option>
                </select>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Download Data */}
        {enabled && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Download Data for Offline</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select the data you want to download for offline access
            </p>

            <div className="space-y-3 mb-4">
              {Object.entries(selectedData).map(([key, checked]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setSelectedData({ ...selectedData, [key]: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                </label>
              ))}
            </div>

            {estimatedSize > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Estimated size: {formatBytes(estimatedSize)}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleEstimateSize}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Estimate Size
              </button>
              <button
                onClick={handleDownloadData}
                disabled={isDownloading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Download className={`h-4 w-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                {isDownloading ? 'Downloading...' : 'Download Now'}
              </button>
            </div>
          </div>
        )}

        {/* Storage Info */}
        {enabled && (
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Storage</h2>
            
            <div className="flex items-center gap-3 mb-4">
              <HardDrive className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Offline Data Size</p>
                <p className="text-2xl font-bold">{formatBytes(cacheSize)}</p>
              </div>
            </div>

            <button
              onClick={handleClearOfflineData}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Offline Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
