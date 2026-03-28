'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export interface DataConflict {
  id: string;
  type: string;
  field: string;
  localValue: any;
  serverValue: any;
  localTimestamp: number;
  serverTimestamp: number;
}

interface ConflictResolverProps {
  conflicts: DataConflict[];
  onResolve: (conflictId: string, resolution: 'local' | 'server' | 'merge') => void;
  onResolveAll: (resolution: 'local' | 'server') => void;
}

export function ConflictResolver({ conflicts, onResolve, onResolveAll }: ConflictResolverProps) {
  const [selectedResolution, setSelectedResolution] = useState<Record<string, 'local' | 'server' | 'merge'>>({});

  if (conflicts.length === 0) {
    return null;
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <div>
              <h2 className="text-lg font-semibold text-yellow-900">
                Sync Conflicts Detected
              </h2>
              <p className="text-sm text-yellow-700">
                {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} found. 
                Your offline changes conflict with server data.
              </p>
            </div>
          </div>
        </div>

        {/* Bulk actions */}
        <div className="border-b bg-gray-50 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">Resolve all conflicts:</span>
          <div className="flex gap-2">
            <button
              onClick={() => onResolveAll('local')}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Keep My Changes
            </button>
            <button
              onClick={() => onResolveAll('server')}
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Use Server Version
            </button>
          </div>
        </div>

        {/* Conflicts list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {conflicts.map((conflict: any) => (
            <div key={conflict.id} className="border rounded-lg overflow-hidden">
              {/* Conflict header */}
              <div className="bg-gray-50 px-4 py-2 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{conflict.type}</span>
                    <span className="text-gray-400 mx-2">•</span>
                    <span className="text-sm text-gray-600">{conflict.field}</span>
                  </div>
                </div>
              </div>

              {/* Comparison */}
              <div className="grid grid-cols-2 divide-x">
                {/* Local version */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-blue-900">Your Version</h4>
                    <span className="text-xs text-gray-500">
                      {formatDate(conflict.localTimestamp)}
                    </span>
                  </div>
                  <pre className="text-sm bg-blue-50 p-3 rounded overflow-x-auto">
                    {formatValue(conflict.localValue)}
                  </pre>
                </div>

                {/* Server version */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Server Version</h4>
                    <span className="text-xs text-gray-500">
                      {formatDate(conflict.serverTimestamp)}
                    </span>
                  </div>
                  <pre className="text-sm bg-gray-50 p-3 rounded overflow-x-auto">
                    {formatValue(conflict.serverValue)}
                  </pre>
                </div>
              </div>

              {/* Resolution options */}
              <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
                <span className="text-sm text-gray-600">Choose which version to keep:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onResolve(conflict.id, 'local')}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Keep Mine
                  </button>
                  <button
                    onClick={() => onResolve(conflict.id, 'server')}
                    className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Use Server
                  </button>
                  <button
                    onClick={() => onResolve(conflict.id, 'merge')}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Merge (Manual)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
