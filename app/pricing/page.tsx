'use client';

/**
 * Public Pricing Page
 * Display pricing plans for unauthenticated users
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { PRICING_PLANS, formatPrice, type PlanId } from '@/lib/stripe/config';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSelectPlan(planId: PlanId) {
    if (planId === 'free') {
      router.push('/login?plan=free');
      return;
    }

    setLoading(true);
    // Redirect to signup with selected plan
    router.push(`/login?plan=${planId}`);
  }

  const plans = Object.entries(PRICING_PLANS);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
          Choose the plan that's right for your firm
        </p>
        <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
          🎉 All paid plans include a 14-day free trial
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map(([key, plan]) => {
            const planId = key as PlanId;
            const isPremium = planId === 'enterprise';
            const isFree = planId === 'free';

            return (
              <div
                key={planId}
                className={`relative bg-white dark:bg-gray-800 rounded-lg border-2 p-8 ${
                  isPremium
                    ? 'border-blue-500 shadow-xl scale-105'
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

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-5xl font-bold">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-500 dark:text-gray-400 text-lg">
                        /{plan.interval}
                      </span>
                    )}
                  </div>
                  {!isFree && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      14-day free trial, cancel anytime
                    </p>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(planId)}
                  disabled={loading}
                  className={`w-full py-4 rounded-lg font-medium text-lg transition-colors ${
                    isPremium
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : isFree
                      ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                      : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </span>
                  ) : isFree ? (
                    'Get Started Free'
                  ) : (
                    'Start Free Trial'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-2">What's included in the free trial?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              All paid plans include a 14-day free trial with full access to all features. No
              credit card required to start your trial.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Can I change plans later?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes! You can upgrade or downgrade your plan at any time. Changes are prorated, so
              you only pay for what you use.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">What happens if I exceed my plan limits?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              We'll notify you when you're approaching your limits. Overage charges apply for
              additional users (£10/user) and storage (£5/10GB). Enterprise plans have no limits.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">How do I cancel my subscription?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              You can cancel anytime from your billing settings. Your access continues until the
              end of your billing period, then you're automatically downgraded to the free plan.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Do you offer refunds?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              We offer a 30-day money-back guarantee. If you're not satisfied, contact us within
              30 days of your first payment for a full refund.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-500 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8">
            Join hundreds of legal professionals using LEXORA to manage their practice
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-white text-blue-500 px-8 py-4 rounded-lg font-medium text-lg hover:bg-gray-100 transition-colors"
          >
            Start Your Free Trial
          </button>
        </div>
      </div>
    </div>
  );
}
