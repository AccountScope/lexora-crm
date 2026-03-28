'use client';

/**
 * Usage Display Component
 * Shows current usage stats with progress bars
 */

import { Users, HardDrive, Activity, Mail } from 'lucide-react';
import { formatPrice } from '@/lib/stripe/config';

interface UsageDisplayProps {
  usage: {
    plan: string;
    limits: {
      users: number;
      storageGB: number;
      apiCalls: number;
      emailSends: number;
    };
    usage: {
      usersCount: number;
      storageGB: number;
      apiCalls: number;
      emailSends: number;
    };
    percentages: {
      users: number;
      storage: number;
      apiCalls: number;
      emailSends: number;
    };
    overages: {
      users: number;
      storage: number;
      apiCalls: number;
      emailSends: number;
    };
    overageCharges: number;
  };
}

export function UsageDisplay({ usage }: UsageDisplayProps) {
  const metrics = [
    {
      icon: Users,
      label: 'Users',
      current: usage.usage.usersCount,
      limit: usage.limits.users,
      percentage: usage.percentages.users,
      overage: usage.overages.users,
      unit: '',
    },
    {
      icon: HardDrive,
      label: 'Storage',
      current: usage.usage.storageGB,
      limit: usage.limits.storageGB,
      percentage: usage.percentages.storage,
      overage: usage.overages.storage,
      unit: 'GB',
    },
    {
      icon: Activity,
      label: 'API Calls',
      current: usage.usage.apiCalls,
      limit: usage.limits.apiCalls,
      percentage: usage.percentages.apiCalls,
      overage: usage.overages.apiCalls,
      unit: '',
      format: (n: number) => n.toLocaleString(),
    },
    {
      icon: Mail,
      label: 'Email Sends',
      current: usage.usage.emailSends,
      limit: usage.limits.emailSends,
      percentage: usage.percentages.emailSends,
      overage: usage.overages.emailSends,
      unit: '',
      format: (n: number) => n.toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Usage This Period</h3>
        {usage.overageCharges > 0 && (
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Estimated overage</p>
            <p className="text-xl font-bold text-red-500">
              +{formatPrice(usage.overageCharges, 'GBP')}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isUnlimited = metric.limit === Infinity;
          const isOverLimit = metric.overage > 0;
          const percentage = Math.min(metric.percentage, 100);

          return (
            <div
              key={metric.label}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">{metric.label}</p>
                    <p className="text-2xl font-bold">
                      {metric.format ? metric.format(metric.current) : metric.current}
                      {metric.unit && ` ${metric.unit}`}
                    </p>
                  </div>
                </div>
                {isOverLimit && (
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium rounded">
                    Over Limit
                  </span>
                )}
              </div>

              {!isUnlimited && (
                <>
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isOverLimit
                            ? 'bg-red-500'
                            : percentage > 80
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Usage Text */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {metric.format ? metric.format(metric.limit) : metric.limit}
                      {metric.unit && ` ${metric.unit}`} limit
                    </span>
                    <span
                      className={`font-medium ${
                        isOverLimit
                          ? 'text-red-600 dark:text-red-400'
                          : percentage > 80
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {percentage.toFixed(0)}%
                    </span>
                  </div>

                  {/* Overage Notice */}
                  {isOverLimit && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                      +{metric.format ? metric.format(metric.overage) : metric.overage}
                      {metric.unit && ` ${metric.unit}`} over limit
                    </p>
                  )}
                </>
              )}

              {isUnlimited && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Unlimited</p>
              )}
            </div>
          );
        })}
      </div>

      {usage.overageCharges > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Overage charges:</strong> You're currently over your plan limits. Overage
            charges of {formatPrice(usage.overageCharges, 'GBP')} will be added to your next
            invoice. Consider upgrading to avoid additional fees.
          </p>
        </div>
      )}
    </div>
  );
}
