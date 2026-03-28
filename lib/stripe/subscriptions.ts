/**
 * Stripe Subscription Management
 * CRUD operations for subscriptions with database sync
 */

import Stripe from 'stripe';
import { stripe, type PlanId } from './config';
import { query } from '../api/db';

export interface SubscriptionData {
  id: string;
  userId: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  plan: PlanId;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get subscription by user ID
 */
export async function getSubscriptionByUserId(userId: string): Promise<SubscriptionData | null> {
  const result = await query(
    `SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToSubscription(result.rows[0]);
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string
): Promise<SubscriptionData | null> {
  const result = await query(
    `SELECT * FROM subscriptions WHERE stripe_subscription_id = $1`,
    [stripeSubscriptionId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToSubscription(result.rows[0]);
}

/**
 * Create a new subscription record
 */
export async function createSubscription(data: {
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  plan: PlanId;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
}): Promise<SubscriptionData> {
  const result = await query(
    `INSERT INTO subscriptions (
      user_id, stripe_subscription_id, stripe_customer_id, plan, status,
      current_period_start, current_period_end, trial_start, trial_end
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      data.userId,
      data.stripeSubscriptionId,
      data.stripeCustomerId,
      data.plan,
      data.status,
      data.currentPeriodStart,
      data.currentPeriodEnd,
      data.trialStart || null,
      data.trialEnd || null,
    ]
  );

  // Update user's stripe_customer_id and current_plan
  await query(
    `UPDATE users SET stripe_customer_id = $1, current_plan = $2 WHERE id = $3`,
    [data.stripeCustomerId, data.plan, data.userId]
  );

  return mapRowToSubscription(result.rows[0]);
}

/**
 * Update subscription record
 */
export async function updateSubscription(
  subscriptionId: string,
  data: {
    status?: string;
    plan?: PlanId;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date | null;
    trialEnd?: Date | null;
  }
): Promise<SubscriptionData> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(data.status);
  }
  if (data.plan !== undefined) {
    updates.push(`plan = $${paramCount++}`);
    values.push(data.plan);
  }
  if (data.currentPeriodStart !== undefined) {
    updates.push(`current_period_start = $${paramCount++}`);
    values.push(data.currentPeriodStart);
  }
  if (data.currentPeriodEnd !== undefined) {
    updates.push(`current_period_end = $${paramCount++}`);
    values.push(data.currentPeriodEnd);
  }
  if (data.cancelAtPeriodEnd !== undefined) {
    updates.push(`cancel_at_period_end = $${paramCount++}`);
    values.push(data.cancelAtPeriodEnd);
  }
  if (data.canceledAt !== undefined) {
    updates.push(`canceled_at = $${paramCount++}`);
    values.push(data.canceledAt);
  }
  if (data.trialEnd !== undefined) {
    updates.push(`trial_end = $${paramCount++}`);
    values.push(data.trialEnd);
  }

  values.push(subscriptionId);

  const result = await query(
    `UPDATE subscriptions SET ${updates.join(', ')}, updated_at = NOW() 
     WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return mapRowToSubscription(result.rows[0]);
}

/**
 * Cancel subscription (immediate or at period end)
 */
export async function cancelSubscription(
  userId: string,
  immediate: boolean = false
): Promise<void> {
  const subscription = await getSubscriptionByUserId(userId);
  
  if (!subscription || !subscription.stripeSubscriptionId) {
    throw new Error('No active subscription found');
  }

  // Cancel in Stripe
  if (immediate) {
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
  } else {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  // Update database
  await query(
    `UPDATE subscriptions 
     SET cancel_at_period_end = $1, canceled_at = $2, status = $3, updated_at = NOW()
     WHERE id = $4`,
    [
      !immediate,
      immediate ? new Date() : null,
      immediate ? 'canceled' : subscription.status,
      subscription.id,
    ]
  );

  // If immediate, downgrade to free plan
  if (immediate) {
    await query(`UPDATE users SET current_plan = 'free' WHERE id = $1`, [userId]);
  }
}

/**
 * Resume a canceled subscription (before period end)
 */
export async function resumeSubscription(userId: string): Promise<void> {
  const subscription = await getSubscriptionByUserId(userId);
  
  if (!subscription || !subscription.stripeSubscriptionId) {
    throw new Error('No subscription found');
  }

  if (!subscription.cancelAtPeriodEnd) {
    throw new Error('Subscription is not scheduled for cancellation');
  }

  // Resume in Stripe
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  // Update database
  await query(
    `UPDATE subscriptions 
     SET cancel_at_period_end = false, canceled_at = NULL, updated_at = NOW()
     WHERE id = $1`,
    [subscription.id]
  );
}

/**
 * Change subscription plan (upgrade/downgrade)
 */
export async function changeSubscriptionPlan(
  userId: string,
  newPlan: PlanId,
  newPriceId: string
): Promise<void> {
  const subscription = await getSubscriptionByUserId(userId);
  
  if (!subscription || !subscription.stripeSubscriptionId) {
    throw new Error('No active subscription found');
  }

  // Get current Stripe subscription
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId
  );

  // Update subscription in Stripe
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    items: [
      {
        id: stripeSubscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'always_invoice',
  });

  // Update database
  await query(
    `UPDATE subscriptions SET plan = $1, updated_at = NOW() WHERE id = $2`,
    [newPlan, subscription.id]
  );

  await query(`UPDATE users SET current_plan = $1 WHERE id = $2`, [newPlan, userId]);
}

/**
 * Sync subscription from Stripe to database
 */
export async function syncSubscriptionFromStripe(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  const userId = stripeSubscription.metadata.userId;
  
  if (!userId) {
    console.error('Subscription missing userId in metadata:', stripeSubscription.id);
    return;
  }

  const plan = (stripeSubscription.metadata.planId || 'professional') as PlanId;
  
  const existing = await getSubscriptionByStripeId(stripeSubscription.id);

  const subscriptionData = {
    userId,
    stripeSubscriptionId: stripeSubscription.id,
    stripeCustomerId: stripeSubscription.customer as string,
    plan,
    status: stripeSubscription.status,
    currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
    trialStart: stripeSubscription.trial_start
      ? new Date(stripeSubscription.trial_start * 1000)
      : undefined,
    trialEnd: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000)
      : undefined,
  };

  if (existing) {
    await updateSubscription(existing.id, {
      status: subscriptionData.status,
      plan: subscriptionData.plan,
      currentPeriodStart: subscriptionData.currentPeriodStart,
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      trialEnd: subscriptionData.trialEnd,
    });
  } else {
    await createSubscription(subscriptionData);
  }
}

/**
 * Map database row to SubscriptionData
 */
function mapRowToSubscription(row: any): SubscriptionData {
  return {
    id: row.id,
    userId: row.user_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripeCustomerId: row.stripe_customer_id,
    plan: row.plan,
    status: row.status,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    canceledAt: row.canceled_at,
    trialStart: row.trial_start,
    trialEnd: row.trial_end,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getSubscriptionByUserId(userId);
  return subscription !== null && ['trialing', 'active'].includes(subscription.status);
}

/**
 * Get subscription status for user
 */
export async function getSubscriptionStatus(userId: string): Promise<{
  hasSubscription: boolean;
  plan: PlanId;
  status: string;
  isActive: boolean;
  isTrial: boolean;
  daysUntilRenewal: number | null;
  willCancelAtPeriodEnd: boolean;
}> {
  const subscription = await getSubscriptionByUserId(userId);

  if (!subscription) {
    return {
      hasSubscription: false,
      plan: 'free',
      status: 'none',
      isActive: false,
      isTrial: false,
      daysUntilRenewal: null,
      willCancelAtPeriodEnd: false,
    };
  }

  const isActive = ['trialing', 'active'].includes(subscription.status);
  const isTrial = subscription.status === 'trialing';
  
  let daysUntilRenewal: number | null = null;
  if (subscription.currentPeriodEnd) {
    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    daysUntilRenewal = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    hasSubscription: true,
    plan: subscription.plan,
    status: subscription.status,
    isActive,
    isTrial,
    daysUntilRenewal,
    willCancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  };
}
