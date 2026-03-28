'use client';

/**
 * Pricing Table Component
 * Displays pricing plans with comparison
 */

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { PRICING_PLANS, formatPrice, type PlanId } from '@/lib/stripe/config';

interface PricingTableProps {
  currentPlan?: PlanId;
  onSelectPlan: (planId: PlanId) => Promise<void>;
  loading?: boolean;
  showFreePlan?: boolean;
}

export function PricingTable({
  currentPlan = 'free',
  onSelectPlan,
  loading = false,
  showFreePlan = true,
}: PricingTableProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  const plans = Object.entries(PRICING_PLANS).filter(
    ([key]) => showFreePlan || key !== 'free'
  );

  const handleSelectPlan = async (planId: PlanId) => {
    if (planId === 'free' || planId === currentPlan) return;
    
    setSelectedPlan(planId);
    try {
      await onSelectPlan(planId);
    } finally {
      setSelectedPlan(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map(([key, plan]) => {
        const planId = key as PlanId;
        const isCurrent = planId === currentPlan;
        const isProcessing = selectedPlan === planId;
        const isPremium = planId === 'enterprise';

        return (
          <div
            key={planId}
            className={`relative rounded-lg border-2 p-6 ${
              isPremium
                ? 'border-blue-500 shadow-lg'
                : isCurrent
                ? 'border-green-500'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {isPremium && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            {isCurrent && (
              <div className="absolute -top-4 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Current Plan
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">
                  {formatPrice(plan.price, plan.currency)}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-500 dark:text-gray-400">
                    /{plan.interval}
                  </span>
                )}
              </div>
              {planId !== 'free' && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  14-day free trial
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(planId)}
              disabled={isCurrent || isProcessing || loading || planId === 'free'}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                isPremium
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : isCurrent
                  ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                  : planId === 'free'
                  ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                  : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : isCurrent ? (
                'Current Plan'
              ) : planId === 'free' ? (
                'Free Plan'
              ) : (
                'Get Started'
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
