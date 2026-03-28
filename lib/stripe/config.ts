/**
 * Stripe Configuration
 * Centralized Stripe settings and pricing configuration
 */

import Stripe from 'stripe';

// Initialize Stripe with API key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});

// Pricing Plans Configuration
export const PRICING_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'GBP',
    interval: 'month',
    stripePriceId: null, // No Stripe price for free plan
    features: [
      'View-only access',
      'Basic reports',
      '1 user',
      '1GB storage',
      '100 API calls/month',
      'Email support',
    ],
    limits: {
      users: 1,
      storageGB: 1,
      apiCalls: 100,
      emailSends: 50,
    },
  },
  essential: {
    id: 'essential',
    name: 'Essential',
    price: 99,
    currency: 'GBP',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_ESSENTIAL!,
    features: [
      'Everything in Free',
      '1 user',
      'Basic features',
      '10GB storage',
      '1,000 API calls/month',
      'Email support',
      '14-day trial',
    ],
    limits: {
      users: 1,
      storageGB: 10,
      apiCalls: 1000,
      emailSends: 500,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 299,
    currency: 'GBP',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL!,
    features: [
      'Everything in Essential',
      'Up to 5 users',
      'All features',
      'Advanced analytics',
      'Trust accounting',
      '50GB storage',
      '10,000 API calls/month',
      'Priority email support',
      '14-day trial',
    ],
    limits: {
      users: 5,
      storageGB: 50,
      apiCalls: 10000,
      emailSends: 5000,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    currency: 'GBP',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE!,
    features: [
      'Everything in Professional',
      'Unlimited users',
      'White-label options',
      'Custom integrations',
      'Unlimited storage',
      'Unlimited API calls',
      'Unlimited email sends',
      'Dedicated account manager',
      'Priority phone support',
      '14-day trial',
    ],
    limits: {
      users: Infinity,
      storageGB: Infinity,
      apiCalls: Infinity,
      emailSends: Infinity,
    },
  },
} as const;

export type PlanId = keyof typeof PRICING_PLANS;

// Overage pricing (per unit beyond plan limits)
export const OVERAGE_PRICING = {
  perUser: 10, // £10/extra user
  perGB: 5, // £5/extra 10GB (charged per GB)
  per1000ApiCalls: 2, // £2/extra 1000 API calls
  per1000Emails: 1, // £1/extra 1000 emails
};

// Trial period (in days)
export const TRIAL_PERIOD_DAYS = 14;

// Webhook endpoint secret
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function to get plan by ID
export function getPlan(planId: PlanId) {
  return PRICING_PLANS[planId];
}

// Helper function to check if a feature is available in a plan
export function hasFeature(planId: PlanId, feature: string): boolean {
  return PRICING_PLANS[planId].features.some(f => 
    f.toLowerCase().includes(feature.toLowerCase())
  );
}

// Helper function to check if usage is within limits
export function isWithinLimits(
  planId: PlanId,
  usage: {
    users?: number;
    storageGB?: number;
    apiCalls?: number;
    emailSends?: number;
  }
): boolean {
  const limits = PRICING_PLANS[planId].limits;
  
  if (usage.users !== undefined && usage.users > limits.users) return false;
  if (usage.storageGB !== undefined && usage.storageGB > limits.storageGB) return false;
  if (usage.apiCalls !== undefined && usage.apiCalls > limits.apiCalls) return false;
  if (usage.emailSends !== undefined && usage.emailSends > limits.emailSends) return false;
  
  return true;
}

// Calculate overage charges
export function calculateOverageCharges(
  planId: PlanId,
  usage: {
    users: number;
    storageGB: number;
    apiCalls: number;
    emailSends: number;
  }
): number {
  // Enterprise has no overages
  if (planId === 'enterprise') return 0;
  
  const limits = PRICING_PLANS[planId].limits;
  let overageTotal = 0;
  
  // User overage
  if (usage.users > limits.users) {
    overageTotal += (usage.users - limits.users) * OVERAGE_PRICING.perUser;
  }
  
  // Storage overage
  if (usage.storageGB > limits.storageGB) {
    overageTotal += (usage.storageGB - limits.storageGB) * OVERAGE_PRICING.perGB;
  }
  
  // API calls overage
  if (usage.apiCalls > limits.apiCalls) {
    const extraCalls = usage.apiCalls - limits.apiCalls;
    overageTotal += Math.ceil(extraCalls / 1000) * OVERAGE_PRICING.per1000ApiCalls;
  }
  
  // Email sends overage
  if (usage.emailSends > limits.emailSends) {
    const extraEmails = usage.emailSends - limits.emailSends;
    overageTotal += Math.ceil(extraEmails / 1000) * OVERAGE_PRICING.per1000Emails;
  }
  
  return overageTotal;
}

// Format price for display
export function formatPrice(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Validate Stripe keys are configured
export function validateStripeConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!process.env.STRIPE_SECRET_KEY) {
    errors.push('STRIPE_SECRET_KEY is not configured');
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    errors.push('STRIPE_WEBHOOK_SECRET is not configured');
  }
  
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured');
  }
  
  // Check price IDs for paid plans
  if (!process.env.STRIPE_PRICE_ESSENTIAL) {
    errors.push('STRIPE_PRICE_ESSENTIAL is not configured');
  }
  
  if (!process.env.STRIPE_PRICE_PROFESSIONAL) {
    errors.push('STRIPE_PRICE_PROFESSIONAL is not configured');
  }
  
  if (!process.env.STRIPE_PRICE_ENTERPRISE) {
    errors.push('STRIPE_PRICE_ENTERPRISE is not configured');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
