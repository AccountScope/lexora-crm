import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * Stripe Webhook Handler
 * Handles subscription events from Stripe
 * 
 * Set up in Stripe Dashboard:
 * 1. Go to Developers → Webhooks
 * 2. Add endpoint: https://your-domain.com/api/stripe/webhook
 * 3. Select events:
 *    - customer.subscription.created
 *    - customer.subscription.updated
 *    - customer.subscription.deleted
 *    - invoice.payment_succeeded
 *    - invoice.payment_failed
 * 4. Copy webhook signing secret to STRIPE_WEBHOOK_SECRET env var
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    // Verify webhook signature with Stripe
    // In production, use stripe.webhooks.constructEvent()
    // For now, just log the event
    const event = JSON.parse(body);

    console.log("Stripe webhook event:", event.type);

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle new subscription creation
 */
async function handleSubscriptionCreated(subscription: any) {
  console.log("Subscription created:", subscription.id);

  // TODO: Update user record in database
  // - Set subscription_id
  // - Set plan_id based on subscription.items
  // - Set subscription_status to "active"
  // - Set current_period_end

  // Example:
  // await supabase
  //   .from('users')
  //   .update({
  //     subscription_id: subscription.id,
  //     plan_id: getPlanFromSubscription(subscription),
  //     subscription_status: subscription.status,
  //     current_period_end: new Date(subscription.current_period_end * 1000)
  //   })
  //   .eq('stripe_customer_id', subscription.customer)
}

/**
 * Handle subscription updates (plan changes, etc.)
 */
async function handleSubscriptionUpdated(subscription: any) {
  console.log("Subscription updated:", subscription.id);

  // TODO: Update user subscription in database
  // - Update plan_id if changed
  // - Update subscription_status
  // - Update current_period_end

  // Handle plan upgrades/downgrades
  if (subscription.status === "active") {
    // Plan is active
  } else if (subscription.status === "canceled") {
    // Subscription canceled but still active until period end
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: any) {
  console.log("Subscription deleted:", subscription.id);

  // TODO: Update user to free plan
  // await supabase
  //   .from('users')
  //   .update({
  //     plan_id: 'free',
  //     subscription_status: 'canceled',
  //     subscription_id: null
  //   })
  //   .eq('stripe_customer_id', subscription.customer)

  // TODO: Send cancellation email
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: any) {
  console.log("Payment succeeded:", invoice.id);

  // TODO: Record payment in database
  // - Create invoice record
  // - Update subscription status if needed
  // - Send payment confirmation email
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: any) {
  console.log("Payment failed:", invoice.id);

  // TODO: Handle failed payment
  // - Send payment failure email
  // - Update subscription status to "past_due"
  // - Implement retry logic or grace period
}

/**
 * Extract plan ID from Stripe subscription
 */
function getPlanFromSubscription(subscription: any): string {
  // Map Stripe price ID to our plan IDs
  const priceId = subscription.items?.data[0]?.price?.id;

  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return "starter";
  if (priceId === process.env.STRIPE_PROFESSIONAL_PRICE_ID) return "professional";
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return "enterprise";

  return "free";
}
