/**
 * Usage Tracking for Metered Billing
 * Track usage metrics and calculate overages
 */

import { query } from '../api/db';
import { PRICING_PLANS, calculateOverageCharges, type PlanId } from './config';
import { getSubscriptionByUserId } from './subscriptions';

export interface UsageMetrics {
  subscriptionId: string;
  periodStart: Date;
  periodEnd: Date;
  usersCount: number;
  storageGB: number;
  apiCalls: number;
  emailSends: number;
}

/**
 * Get current usage for a user's subscription
 */
export async function getCurrentUsage(userId: string): Promise<UsageMetrics | null> {
  const subscription = await getSubscriptionByUserId(userId);
  
  if (!subscription) {
    return null;
  }

  // Get current billing period
  const periodStart = subscription.currentPeriodStart || new Date();
  const periodEnd = subscription.currentPeriodEnd || new Date();

  // Check if we have a usage record for this period
  const result = await query(
    `SELECT * FROM usage_records 
     WHERE subscription_id = $1 AND period_start = $2 AND period_end = $3`,
    [subscription.id, periodStart, periodEnd]
  );

  if (result.rows.length > 0) {
    const row = result.rows[0];
    return {
      subscriptionId: row.subscription_id,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      usersCount: row.users_count,
      storageGB: parseFloat(row.storage_gb),
      apiCalls: row.api_calls,
      emailSends: row.email_sends,
    };
  }

  // Calculate current usage
  const usage = await calculateCurrentUsage(userId);
  
  // Create usage record
  await query(
    `INSERT INTO usage_records 
     (subscription_id, period_start, period_end, users_count, storage_gb, api_calls, email_sends)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (subscription_id, period_start, period_end) 
     DO UPDATE SET 
       users_count = EXCLUDED.users_count,
       storage_gb = EXCLUDED.storage_gb,
       api_calls = EXCLUDED.api_calls,
       email_sends = EXCLUDED.email_sends,
       updated_at = NOW()`,
    [
      subscription.id,
      periodStart,
      periodEnd,
      usage.usersCount,
      usage.storageGB,
      usage.apiCalls,
      usage.emailSends,
    ]
  );

  return {
    subscriptionId: subscription.id,
    periodStart,
    periodEnd,
    ...usage,
  };
}

/**
 * Calculate current usage from database
 */
async function calculateCurrentUsage(userId: string): Promise<{
  usersCount: number;
  storageGB: number;
  apiCalls: number;
  emailSends: number;
}> {
  // Get organization for this user
  const orgResult = await query(
    `SELECT organization_id FROM organization_members WHERE user_id = $1 LIMIT 1`,
    [userId]
  );

  const organizationId = orgResult.rows[0]?.organization_id;

  if (!organizationId) {
    return {
      usersCount: 1,
      storageGB: 0,
      apiCalls: 0,
      emailSends: 0,
    };
  }

  // Count users in organization
  const usersResult = await query(
    `SELECT COUNT(*) as count FROM organization_members WHERE organization_id = $1`,
    [organizationId]
  );
  const usersCount = parseInt(usersResult.rows[0]?.count || '1');

  // Calculate storage usage (files table)
  const storageResult = await query(
    `SELECT COALESCE(SUM(size), 0) as total_bytes 
     FROM files 
     WHERE uploaded_by IN (
       SELECT user_id FROM organization_members WHERE organization_id = $1
     )`,
    [organizationId]
  );
  const totalBytes = parseInt(storageResult.rows[0]?.total_bytes || '0');
  const storageGB = totalBytes / (1024 * 1024 * 1024);

  // Count API calls (activity_logs with type = 'api_call')
  const subscription = await getSubscriptionByUserId(userId);
  const periodStart = subscription?.currentPeriodStart || new Date();
  
  const apiCallsResult = await query(
    `SELECT COUNT(*) as count FROM activity_logs 
     WHERE user_id IN (
       SELECT user_id FROM organization_members WHERE organization_id = $1
     )
     AND action = 'api_call'
     AND created_at >= $2`,
    [organizationId, periodStart]
  );
  const apiCalls = parseInt(apiCallsResult.rows[0]?.count || '0');

  // Count email sends (check email integration logs if available)
  const emailSendsResult = await query(
    `SELECT COUNT(*) as count FROM activity_logs 
     WHERE user_id IN (
       SELECT user_id FROM organization_members WHERE organization_id = $1
     )
     AND action = 'email_sent'
     AND created_at >= $2`,
    [organizationId, periodStart]
  );
  const emailSends = parseInt(emailSendsResult.rows[0]?.count || '0');

  return {
    usersCount,
    storageGB: Math.round(storageGB * 100) / 100,
    apiCalls,
    emailSends,
  };
}

/**
 * Update usage record
 */
export async function updateUsageRecord(
  subscriptionId: string,
  periodStart: Date,
  periodEnd: Date,
  updates: {
    usersCount?: number;
    storageGB?: number;
    apiCalls?: number;
    emailSends?: number;
  }
): Promise<void> {
  const setParts: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.usersCount !== undefined) {
    setParts.push(`users_count = $${paramCount++}`);
    values.push(updates.usersCount);
  }
  if (updates.storageGB !== undefined) {
    setParts.push(`storage_gb = $${paramCount++}`);
    values.push(updates.storageGB);
  }
  if (updates.apiCalls !== undefined) {
    setParts.push(`api_calls = $${paramCount++}`);
    values.push(updates.apiCalls);
  }
  if (updates.emailSends !== undefined) {
    setParts.push(`email_sends = $${paramCount++}`);
    values.push(updates.emailSends);
  }

  values.push(subscriptionId, periodStart, periodEnd);

  await query(
    `UPDATE usage_records 
     SET ${setParts.join(', ')}, updated_at = NOW()
     WHERE subscription_id = $${paramCount} 
     AND period_start = $${paramCount + 1} 
     AND period_end = $${paramCount + 2}`,
    values
  );
}

/**
 * Get usage summary with plan limits
 */
export async function getUsageSummary(userId: string): Promise<{
  plan: PlanId;
  limits: typeof PRICING_PLANS[PlanId]['limits'];
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
}> {
  const subscription = await getSubscriptionByUserId(userId);
  const plan: PlanId = subscription?.plan || 'free';
  const limits = PRICING_PLANS[plan].limits;

  const currentUsage = await getCurrentUsage(userId);
  const usage = currentUsage
    ? {
        usersCount: currentUsage.usersCount,
        storageGB: currentUsage.storageGB,
        apiCalls: currentUsage.apiCalls,
        emailSends: currentUsage.emailSends,
      }
    : {
        usersCount: 0,
        storageGB: 0,
        apiCalls: 0,
        emailSends: 0,
      };

  // Calculate percentages
  const percentages = {
    users: limits.users === Infinity ? 0 : (usage.usersCount / limits.users) * 100,
    storage: limits.storageGB === Infinity ? 0 : (usage.storageGB / limits.storageGB) * 100,
    apiCalls: limits.apiCalls === Infinity ? 0 : (usage.apiCalls / limits.apiCalls) * 100,
    emailSends: limits.emailSends === Infinity ? 0 : (usage.emailSends / limits.emailSends) * 100,
  };

  // Calculate overages
  const overages = {
    users: Math.max(0, usage.usersCount - limits.users),
    storage: Math.max(0, usage.storageGB - limits.storageGB),
    apiCalls: Math.max(0, usage.apiCalls - limits.apiCalls),
    emailSends: Math.max(0, usage.emailSends - limits.emailSends),
  };

  // Calculate overage charges
  const overageCharges = calculateOverageCharges(plan, usage);

  return {
    plan,
    limits,
    usage,
    percentages,
    overages,
    overageCharges,
  };
}

/**
 * Check if user is within plan limits
 */
export async function isWithinPlanLimits(userId: string): Promise<boolean> {
  const summary = await getUsageSummary(userId);
  const { limits, usage } = summary;

  return (
    usage.usersCount <= limits.users &&
    usage.storageGB <= limits.storageGB &&
    usage.apiCalls <= limits.apiCalls &&
    usage.emailSends <= limits.emailSends
  );
}

/**
 * Increment API call counter
 */
export async function incrementApiCalls(userId: string, count: number = 1): Promise<void> {
  const subscription = await getSubscriptionByUserId(userId);
  
  if (!subscription) {
    return;
  }

  const periodStart = subscription.currentPeriodStart || new Date();
  const periodEnd = subscription.currentPeriodEnd || new Date();

  await query(
    `INSERT INTO usage_records 
     (subscription_id, period_start, period_end, api_calls)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (subscription_id, period_start, period_end) 
     DO UPDATE SET 
       api_calls = usage_records.api_calls + EXCLUDED.api_calls,
       updated_at = NOW()`,
    [subscription.id, periodStart, periodEnd, count]
  );
}

/**
 * Increment email send counter
 */
export async function incrementEmailSends(userId: string, count: number = 1): Promise<void> {
  const subscription = await getSubscriptionByUserId(userId);
  
  if (!subscription) {
    return;
  }

  const periodStart = subscription.currentPeriodStart || new Date();
  const periodEnd = subscription.currentPeriodEnd || new Date();

  await query(
    `INSERT INTO usage_records 
     (subscription_id, period_start, period_end, email_sends)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (subscription_id, period_start, period_end) 
     DO UPDATE SET 
       email_sends = usage_records.email_sends + EXCLUDED.email_sends,
       updated_at = NOW()`,
    [subscription.id, periodStart, periodEnd, count]
  );
}

/**
 * Get usage history
 */
export async function getUsageHistory(
  userId: string,
  limit: number = 12
): Promise<UsageMetrics[]> {
  const subscription = await getSubscriptionByUserId(userId);
  
  if (!subscription) {
    return [];
  }

  const result = await query(
    `SELECT * FROM usage_records 
     WHERE subscription_id = $1 
     ORDER BY period_start DESC 
     LIMIT $2`,
    [subscription.id, limit]
  );

  return result.rows.map((row) => ({
    subscriptionId: row.subscription_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    usersCount: row.users_count,
    storageGB: parseFloat(row.storage_gb),
    apiCalls: row.api_calls,
    emailSends: row.email_sends,
  }));
}
