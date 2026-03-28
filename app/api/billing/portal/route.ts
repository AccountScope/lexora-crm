/**
 * API Route: Create Stripe Customer Portal Session
 * POST /api/billing/portal
 */

import { NextRequest, NextResponse } from 'next/server';
import { createBillingPortalSession } from '@/lib/stripe/checkout';
import { requireUser } from '@/lib/auth';
import { getSubscriptionByUserId } from '@/lib/stripe/subscriptions';
import { db } from '@/lib/api/db';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Stripe customer ID
    const result = await db.query(
      `SELECT stripe_customer_id FROM users WHERE id = $1`,
      [user.id]
    );

    let customerId = result.rows[0]?.stripe_customer_id;

    // If no customer ID, try to get from subscription
    if (!customerId) {
      const subscription = await getSubscriptionByUserId(user.id);
      customerId = subscription?.stripeCustomerId;
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No billing information found. Please subscribe first.' },
        { status: 400 }
      );
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`;

    // Create portal session
    const session = await createBillingPortalSession(
      customerId,
      `${baseUrl}/settings/billing`
    );

    // Return portal URL
    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
