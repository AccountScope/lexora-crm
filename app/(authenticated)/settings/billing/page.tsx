'use client';

/**
 * Billing Settings Page
 * Manage subscription, view usage, and access billing portal
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CreditCard, Receipt, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SubscriptionCard } from '@/components/billing/subscription-card';
import { UsageDisplay } from '@/components/billing/usage-display';
import { PricingTable } from '@/components/billing/pricing-table';
import { type PlanId } from '@/lib/stripe/config';

export default function BillingSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check for checkout success/cancel
  useEffect(() => {
    const success = searchParams?.get('success');
    const canceled = searchParams?.get('canceled');

    if (success === 'true') {
      setAlert({
        type: 'success',
        message: 'Subscription activated successfully! Welcome to LEXORA.',
      });
      // Clean URL
      router.replace('/settings/billing');
    } else if (canceled === 'true') {
      setAlert({
        type: 'error',
        message: 'Checkout was canceled. You can try again anytime.',
      });
      // Clean URL
      router.replace('/settings/billing');
    }
  }, [searchParams, router]);

  // Load subscription and usage data
  useEffect(() => {
    loadBillingData();
  }, []);

  async function loadBillingData() {
    try {
      const response = await fetch('/api/billing/subscription');
      if (!response.ok) throw new Error('Failed to load billing data');
      
      const data = await response.json();
      setSubscription(data.subscription);
      setUsage(data.usage);
    } catch (error) {
      console.error('Error loading billing data:', error);
      setAlert({
        type: 'error',
        message: 'Failed to load billing information. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  // Handle plan selection (create checkout session)
  async function handleSelectPlan(planId: PlanId) {
    setProcessing(true);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to start checkout',
      });
      setProcessing(false);
    }
  }

  // Open Stripe billing portal
  async function openBillingPortal() {
    setProcessing(true);
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to open billing portal');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe portal
      window.location.href = url;
    } catch (error) {
      console.error('Error opening portal:', error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to open billing portal',
      });
      setProcessing(false);
    }
  }

  // Cancel subscription
  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will be downgraded to the free plan at the end of your billing period.')) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }

      setAlert({
        type: 'success',
        message: 'Subscription canceled. You will retain access until the end of your billing period.',
      });

      await loadBillingData();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to cancel subscription',
      });
    } finally {
      setProcessing(false);
    }
  }

  // Resume subscription
  async function handleResumeSubscription() {
    setProcessing(true);
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resume subscription');
      }

      setAlert({
        type: 'success',
        message: 'Subscription resumed successfully!',
      });

      await loadBillingData();
    } catch (error) {
      console.error('Error resuming subscription:', error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to resume subscription',
      });
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your subscription, view usage, and update payment methods"
      />

      {/* Alert */}
      {alert && (
        <div
          className={`p-4 rounded-lg border flex items-start gap-3 ${
            alert.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={`font-medium ${
                alert.type === 'success'
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-red-900 dark:text-red-100'
              }`}
            >
              {alert.message}
            </p>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Current Subscription */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
        <SubscriptionCard subscription={subscription} />
      </section>

      {/* Action Buttons */}
      <section className="flex flex-wrap gap-4">
        {subscription && subscription.plan !== 'free' && (
          <button
            onClick={openBillingPortal}
            disabled={processing}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <CreditCard className="w-5 h-5" />
            {processing ? 'Opening...' : 'Manage Billing'}
            <ExternalLink className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => router.push('/settings/billing/invoices')}
          className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
        >
          <Receipt className="w-5 h-5" />
          View Invoices
        </button>

        {subscription && !subscription.cancelAtPeriodEnd && subscription.plan !== 'free' && (
          <button
            onClick={handleCancelSubscription}
            disabled={processing}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Cancel Subscription'}
          </button>
        )}

        {subscription && subscription.cancelAtPeriodEnd && (
          <button
            onClick={handleResumeSubscription}
            disabled={processing}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Resume Subscription'}
          </button>
        )}

        {(!subscription || subscription.plan === 'free') && (
          <button
            onClick={() => setShowPricing(!showPricing)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            {showPricing ? 'Hide Plans' : 'View Plans'}
          </button>
        )}
      </section>

      {/* Usage Stats */}
      {usage && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
          <UsageDisplay usage={usage} />
        </section>
      )}

      {/* Pricing Plans */}
      {showPricing && (
        <section>
          <h2 className="text-xl font-semibold mb-6">Choose a Plan</h2>
          <PricingTable
            currentPlan={subscription?.plan || 'free'}
            onSelectPlan={handleSelectPlan}
            loading={processing}
            showFreePlan={false}
          />
        </section>
      )}
    </div>
  );
}
