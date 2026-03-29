/**
 * Stripe Configuration
 * Pricing plans and product IDs
 */

import Stripe from 'stripe';

// Stripe client (stub - requires STRIPE_SECRET_KEY env var)
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' })
  : null;

/**
 * Get Stripe client or throw error if not configured
 * Use this helper to avoid null checks everywhere
 */
export function getStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.');
  }
  return stripe;
}

// Stripe webhook secret
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Trial period in days
export const TRIAL_PERIOD_DAYS = 14;

// Overage calculation stub
export function calculateOverageCharges(usage: any, limits: any): number {
  return 0; // TODO: Implement overage logic
}

export type PlanId = "free" | "starter" | "professional" | "enterprise";

export interface PricingPlan {
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  stripeProductId?: string;
  stripePriceId?: string;
  features: string[];
  limits: {
    users: number;
    matters: number;
    storage: number; // GB
    trustAccounts: number;
  };
}

export const PRICING_PLANS: Record<PlanId, PricingPlan> = {
  free: {
    name: "Free",
    description: "For individual solicitors testing Lexora",
    price: 0,
    currency: "GBP",
    interval: "month",
    features: [
      "1 user",
      "5 active matters",
      "1 trust account",
      "1GB document storage",
      "Basic reports",
      "Email support",
    ],
    limits: {
      users: 1,
      matters: 5,
      storage: 1,
      trustAccounts: 1,
    },
  },
  starter: {
    name: "Starter",
    description: "For small firms getting started",
    price: 49,
    currency: "GBP",
    interval: "month",
    stripeProductId: process.env.STRIPE_STARTER_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    features: [
      "Up to 3 users",
      "25 active matters",
      "3 trust accounts",
      "10GB document storage",
      "Standard reports",
      "Email & chat support",
      "Email integration",
      "Client portal",
    ],
    limits: {
      users: 3,
      matters: 25,
      storage: 10,
      trustAccounts: 3,
    },
  },
  professional: {
    name: "Professional",
    description: "For growing firms",
    price: 99,
    currency: "GBP",
    interval: "month",
    stripeProductId: process.env.STRIPE_PROFESSIONAL_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    features: [
      "Up to 10 users",
      "Unlimited matters",
      "10 trust accounts",
      "100GB document storage",
      "Advanced reports",
      "Priority support",
      "Email integration",
      "Client portal",
      "Time tracking & billing",
      "Conflict checking",
      "Interactive tours",
      "Video tutorials",
    ],
    limits: {
      users: 10,
      matters: 999999,
      storage: 100,
      trustAccounts: 10,
    },
  },
  enterprise: {
    name: "Enterprise",
    description: "For established firms",
    price: 299,
    currency: "GBP",
    interval: "month",
    stripeProductId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      "Unlimited users",
      "Unlimited matters",
      "Unlimited trust accounts",
      "500GB document storage",
      "Custom reports",
      "Dedicated account manager",
      "Phone & priority support",
      "All Professional features",
      "API access",
      "Custom integrations",
      "White-label option",
      "Onboarding assistance",
    ],
    limits: {
      users: 999999,
      matters: 999999,
      storage: 500,
      trustAccounts: 999999,
    },
  },
};

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: string = "GBP"): string {
  if (price === 0) return "Free";

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Get plan by ID
 */
export function getPlan(planId: PlanId): PricingPlan {
  return PRICING_PLANS[planId];
}

/**
 * Check if user is within plan limits
 */
export function isWithinLimits(
  planId: PlanId,
  usage: {
    users?: number;
    matters?: number;
    storage?: number;
    trustAccounts?: number;
  }
): { withinLimits: boolean; exceeded: string[] } {
  const plan = getPlan(planId);
  const exceeded: string[] = [];

  if (usage.users && usage.users > plan.limits.users) {
    exceeded.push("users");
  }
  if (usage.matters && usage.matters > plan.limits.matters) {
    exceeded.push("matters");
  }
  if (usage.storage && usage.storage > plan.limits.storage) {
    exceeded.push("storage");
  }
  if (usage.trustAccounts && usage.trustAccounts > plan.limits.trustAccounts) {
    exceeded.push("trust accounts");
  }

  return {
    withinLimits: exceeded.length === 0,
    exceeded,
  };
}
