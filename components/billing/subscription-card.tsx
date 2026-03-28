'use client';

/**
 * Subscription Card Component
 * Displays current subscription details
 */

import { formatDistanceToNow } from 'date-fns';
import { Calendar, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { PRICING_PLANS, formatPrice, type PlanId } from '@/lib/stripe/config';

interface SubscriptionCardProps {
  subscription: {
    plan: PlanId;
    status: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    trialEnd: Date | null;
  } | null;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  if (!subscription) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold">No Active Subscription</h3>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          You're currently on the free plan. Upgrade to unlock premium features.
        </p>
      </div>
    );
  }

  const plan = PRICING_PLANS[subscription.plan];
  const isActive = ['active', 'trialing'].includes(subscription.status);
  const isTrial = subscription.status === 'trialing';
  const isPastDue = subscription.status === 'past_due';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold">{plan.name} Plan</h3>
            <p className="text-2xl font-bold text-blue-500">
              {formatPrice(plan.price, plan.currency)}
              <span className="text-sm font-normal text-gray-500">/{plan.interval}</span>
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isActive && !isTrial && <CheckCircle className="w-5 h-5 text-green-500" />}
          {isTrial && <Clock className="w-5 h-5 text-blue-500" />}
          {isPastDue && <AlertCircle className="w-5 h-5 text-red-500" />}
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isActive && !isTrial
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                : isTrial
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : isPastDue
                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {isTrial ? 'Trial' : subscription.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Trial Notice */}
      {isTrial && subscription.trialEnd && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Trial Period Active
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your trial ends {formatDistanceToNow(new Date(subscription.trialEnd), { addSuffix: true })}.
                No charges until then.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Past Due Warning */}
      {isPastDue && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">
                Payment Failed
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Your payment couldn't be processed. Please update your payment method to avoid
                service interruption.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Notice */}
      {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                Subscription Ending
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Your subscription will end on{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}. You'll be
                downgraded to the free plan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Billing Period */}
      {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Current billing period:</span>
          </div>
          <div className="pl-6 text-sm">
            <p className="text-gray-900 dark:text-gray-100">
              {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{' '}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              {!subscription.cancelAtPeriodEnd && (
                <>
                  Renews{' '}
                  {formatDistanceToNow(new Date(subscription.currentPeriodEnd), {
                    addSuffix: true,
                  })}
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Plan Features */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium mb-3">Plan includes:</h4>
        <ul className="space-y-2">
          {plan.features.slice(0, 5).map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 dark:text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
