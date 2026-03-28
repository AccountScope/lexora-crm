/**
 * Stripe Checkout Session Management
 * Create and manage Stripe Checkout sessions for subscriptions
 */

import Stripe from 'stripe';
import { stripe, PRICING_PLANS, TRIAL_PERIOD_DAYS, type PlanId } from './config';

export interface CreateCheckoutSessionParams {
  userId: string;
  userEmail: string;
  planId: PlanId;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  allowPromotionCodes?: boolean;
  metadata?: Record<string, string>;
}

/**
 * Create a Stripe Checkout session for a subscription
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  const {
    userId,
    userEmail,
    planId,
    successUrl,
    cancelUrl,
    trialDays = TRIAL_PERIOD_DAYS,
    allowPromotionCodes = true,
    metadata = {},
  } = params;

  // Validate plan
  const plan = PRICING_PLANS[planId];
  if (!plan || planId === 'free') {
    throw new Error(`Invalid plan: ${planId}`);
  }

  if (!plan.stripePriceId) {
    throw new Error(`No Stripe price ID configured for plan: ${planId}`);
  }

  try {
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: allowPromotionCodes,
      billing_address_collection: 'required',
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          userId,
          planId,
          ...metadata,
        },
      },
      metadata: {
        userId,
        planId,
        ...metadata,
      },
      payment_method_collection: 'if_required', // Only collect if not in trial
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Retrieve a checkout session by ID
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session | null> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });
    return session;
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    return null;
  }
}

/**
 * Create a billing portal session for customer self-service
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session;
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    throw new Error(`Failed to create billing portal session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Preview invoice for plan change (upgrade/downgrade)
 */
export async function previewPlanChange(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Invoice | null> {
  try {
    // Retrieve the subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Preview the invoice for the plan change
    const invoice = await (stripe.invoices as any).retrieveUpcoming({
      customer: subscription.customer as string,
      subscription: subscriptionId,
      subscription_items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      subscription_proration_behavior: 'always_invoice',
    });

    return invoice;
  } catch (error) {
    console.error('Error previewing plan change:', error);
    return null;
  }
}

/**
 * Calculate prorated amount for plan change
 */
export function calculateProration(
  currentPrice: number,
  newPrice: number,
  daysRemaining: number,
  daysInPeriod: number
): number {
  const unusedAmount = (currentPrice / daysInPeriod) * daysRemaining;
  const newAmount = (newPrice / daysInPeriod) * daysRemaining;
  return newAmount - unusedAmount;
}

/**
 * Get checkout session status
 */
export function getSessionStatus(session: Stripe.Checkout.Session): {
  status: 'complete' | 'expired' | 'open';
  message: string;
} {
  if (session.status === 'complete') {
    return {
      status: 'complete',
      message: 'Payment successful! Your subscription is now active.',
    };
  }

  if (session.status === 'expired') {
    return {
      status: 'expired',
      message: 'This checkout session has expired. Please try again.',
    };
  }

  return {
    status: 'open',
    message: 'Waiting for payment...',
  };
}
