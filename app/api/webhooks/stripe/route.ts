/**
 * API Route: Stripe Webhook Handler
 * POST /api/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, handleWebhook } from '@/lib/stripe/webhooks';

// Force Node.js runtime (webhooks need crypto, pg, etc.)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get raw body as text
    const body = await request.text();
    
    // Get Stripe signature from headers
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Received webhook event:', event.type, event.id);

    // Handle webhook event
    await handleWebhook(event);

    // Return success response
    return NextResponse.json({ received: true, eventId: event.id });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Return 500 to trigger Stripe retry
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
