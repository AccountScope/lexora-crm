'use client';

/**
 * Payment Method Form Component
 * Add or update payment methods using Stripe Elements
 * Note: This is typically handled via Stripe Customer Portal
 * This component is for reference if direct payment method management is needed
 */

import { useState } from 'react';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';

interface PaymentMethodFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentMethodForm({ onSuccess, onCancel }: PaymentMethodFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Note: In production, you would integrate Stripe Elements here
  // For now, we redirect to Stripe Customer Portal for payment method management

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Redirect to billing portal for payment method management
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to open billing portal');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to manage payment method');
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-6 h-6 text-blue-500" />
        <h3 className="text-lg font-semibold">Payment Method</h3>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-900 dark:text-red-100">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Payment methods are managed through Stripe's secure billing portal.
        </p>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            What you can do:
          </h4>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>• Add new payment methods</li>
            <li>• Update existing cards</li>
            <li>• Set default payment method</li>
            <li>• Remove old payment methods</li>
            <li>• View billing history</li>
            <li>• Download invoices</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Opening portal...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Manage Payment Methods
              </>
            )}
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Alternative: Direct Stripe Elements Integration
 * 
 * For direct card input without redirecting to portal:
 * 
 * 1. Install @stripe/react-stripe-js:
 *    npm install @stripe/react-stripe-js
 * 
 * 2. Wrap your app with Stripe Elements provider:
 *    <Elements stripe={stripePromise}>
 *      <PaymentMethodForm />
 *    </Elements>
 * 
 * 3. Use CardElement for card input:
 *    import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
 * 
 * 4. Create Setup Intent and attach payment method:
 *    const stripe = useStripe();
 *    const elements = useElements();
 *    
 *    const { error, setupIntent } = await stripe.confirmCardSetup(
 *      clientSecret,
 *      { payment_method: { card: elements.getElement(CardElement) } }
 *    );
 * 
 * 5. Save payment method to your database
 * 
 * However, using Stripe Customer Portal is recommended for:
 * - Faster implementation
 * - Stripe-hosted (PCI compliant)
 * - Handles all edge cases
 * - Consistent UX
 * - No additional code to maintain
 */
