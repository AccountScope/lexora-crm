/**
 * API Route: Subscription Management
 * GET /api/billing/subscription - Get current subscription
 * PUT /api/billing/subscription - Update subscription (change plan)
 * DELETE /api/billing/subscription - Cancel subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import {
  getSubscriptionByUserId,
  cancelSubscription,
  resumeSubscription,
  changeSubscriptionPlan,
} from '@/lib/stripe/subscriptions';
import { getUsageSummary } from '@/lib/stripe/usage';
import { PRICING_PLANS, type PlanId } from '@/lib/stripe/config';

/**
 * GET: Get current subscription and usage
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireUser(request);
    if (!user || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription
    const subscription = await getSubscriptionByUserId(user.id);
    
    // Get usage summary
    const usage = await getUsageSummary(user.id);

    return NextResponse.json({
      subscription: subscription
        ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            trialEnd: subscription.trialEnd,
          }
        : null,
      usage,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update subscription (change plan)
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireUser(request);
    if (!user || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { action, planId } = body;

    if (action === 'resume') {
      // Resume canceled subscription
      await resumeSubscription(user.id);
      return NextResponse.json({ success: true, message: 'Subscription resumed' });
    }

    if (action === 'change_plan') {
      // Validate plan
      if (!planId || !['essential', 'professional', 'enterprise'].includes(planId)) {
        return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
      }

      const newPlan = PRICING_PLANS[planId as PlanId];
      if (!newPlan.stripePriceId) {
        return NextResponse.json({ error: 'Invalid plan configuration' }, { status: 400 });
      }

      // Change plan
      await changeSubscriptionPlan(user.id, planId as PlanId, newPlan.stripePriceId);
      return NextResponse.json({ success: true, message: 'Plan updated successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Cancel subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireUser(request);
    if (!user || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const immediate = searchParams.get('immediate') === 'true';

    // Cancel subscription
    await cancelSubscription(user.id, immediate);

    return NextResponse.json({
      success: true,
      message: immediate
        ? 'Subscription canceled immediately'
        : 'Subscription will cancel at the end of the billing period',
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
