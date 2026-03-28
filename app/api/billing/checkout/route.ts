/**
 * API Route: Create Stripe Checkout Session
 * POST /api/billing/checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { requireUser } from '@/lib/auth';
import { type PlanId } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { planId } = body;

    // Validate plan
    if (!planId || !['essential', 'professional', 'enterprise'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`;

    // Create checkout session
    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email || '',
      planId: planId as PlanId,
      successUrl: `${baseUrl}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/settings/billing?canceled=true`,
      allowPromotionCodes: true,
    });

    // Return checkout URL
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
