/**
 * Stripe Webhook Handlers
 * Process Stripe webhook events with idempotency and error handling
 */

import Stripe from 'stripe';
import { stripe, STRIPE_WEBHOOK_SECRET } from './config';
import { syncSubscriptionFromStripe } from './subscriptions';
import { query } from '../api/db';
import { sendEmail } from '../email/send';

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

/**
 * Check if webhook event has already been processed (idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const result = await query(
    `SELECT processed FROM stripe_webhook_events WHERE stripe_event_id = $1`,
    [eventId]
  );
  return result.rows.length > 0 && result.rows[0].processed;
}

/**
 * Log webhook event
 */
async function logWebhookEvent(
  eventId: string,
  eventType: string,
  payload: any,
  processed: boolean = false,
  error: string | null = null
): Promise<void> {
  await query(
    `INSERT INTO stripe_webhook_events (stripe_event_id, event_type, payload, processed, error, processed_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (stripe_event_id) DO UPDATE SET
       processed = EXCLUDED.processed,
       error = EXCLUDED.error,
       processed_at = EXCLUDED.processed_at`,
    [eventId, eventType, payload, processed, error, processed ? new Date() : null]
  );
}

/**
 * Handle checkout.session.completed
 * Create subscription when checkout is completed
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  
  console.log('Checkout session completed:', session.id);

  // Only process subscription checkouts
  if (session.mode !== 'subscription') {
    return;
  }

  const userId = session.client_reference_id || session.metadata?.userId;
  
  if (!userId) {
    throw new Error('Missing userId in checkout session');
  }

  // Get the subscription
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Sync subscription to database
  await syncSubscriptionFromStripe(subscription);

  // Send welcome email
  try {
    const result = await query(`SELECT email, name FROM users WHERE id = $1`, [userId]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      await sendEmail({
        to: user.email,
        subject: 'Welcome to LEXORA!',
        text: `Hi ${user.name},\n\nThank you for subscribing to LEXORA! Your subscription is now active.\n\nYou can manage your subscription at any time from your billing settings.\n\nBest regards,\nThe LEXORA Team`,
        html: `<p>Hi ${user.name},</p><p>Thank you for subscribing to LEXORA! Your subscription is now active.</p><p>You can manage your subscription at any time from your billing settings.</p><p>Best regards,<br>The LEXORA Team</p>`,
      });
    }
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

/**
 * Handle customer.subscription.updated
 * Update subscription when it changes (plan change, renewal, etc.)
 */
async function handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  
  console.log('Subscription updated:', subscription.id);

  await syncSubscriptionFromStripe(subscription);
}

/**
 * Handle customer.subscription.deleted
 * Cancel subscription in database
 */
async function handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  
  console.log('Subscription deleted:', subscription.id);

  // Update subscription status
  await query(
    `UPDATE subscriptions 
     SET status = 'canceled', canceled_at = NOW(), updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscription.id]
  );

  // Downgrade user to free plan
  const userId = subscription.metadata?.userId;
  if (userId) {
    await query(`UPDATE users SET current_plan = 'free' WHERE id = $1`, [userId]);

    // Send cancellation email
    try {
      const result = await query(`SELECT email, name FROM users WHERE id = $1`, [userId]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        await sendEmail({
          to: user.email,
          subject: 'Your LEXORA subscription has been cancelled',
          text: `Hi ${user.name},\n\nYour LEXORA subscription has been cancelled. You've been downgraded to the free plan.\n\nYou can reactivate your subscription at any time from your billing settings.\n\nBest regards,\nThe LEXORA Team`,
          html: `<p>Hi ${user.name},</p><p>Your LEXORA subscription has been cancelled. You've been downgraded to the free plan.</p><p>You can reactivate your subscription at any time from your billing settings.</p><p>Best regards,<br>The LEXORA Team</p>`,
        });
      }
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
    }
  }
}

/**
 * Handle invoice.payment_succeeded
 * Mark invoice as paid
 */
async function handleInvoicePaymentSucceeded(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  
  console.log('Invoice payment succeeded:', invoice.id);

  // If this is a subscription invoice, ensure subscription is active
  if ((invoice as any).subscription) {
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
    await syncSubscriptionFromStripe(subscription);
  }

  // Send payment receipt email
  const userId = invoice.metadata?.userId;
  if (userId) {
    try {
      const result = await query(`SELECT email, name FROM users WHERE id = $1`, [userId]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const amount = (invoice.amount_paid / 100).toFixed(2);
        await sendEmail({
          to: user.email,
          subject: 'Payment receipt for LEXORA subscription',
          text: `Hi ${user.name},\n\nYour payment of £${amount} has been processed successfully.\n\nInvoice: ${invoice.number}\nAmount: £${amount}\nDate: ${new Date(invoice.created * 1000).toLocaleDateString()}\n\nYou can view your invoice at: ${invoice.hosted_invoice_url}\n\nBest regards,\nThe LEXORA Team`,
          html: `<p>Hi ${user.name},</p><p>Your payment of £${amount} has been processed successfully.</p><ul><li><strong>Invoice:</strong> ${invoice.number}</li><li><strong>Amount:</strong> £${amount}</li><li><strong>Date:</strong> ${new Date(invoice.created * 1000).toLocaleDateString()}</li></ul><p><a href="${invoice.hosted_invoice_url}">View Invoice</a></p><p>Best regards,<br>The LEXORA Team</p>`,
        });
      }
    } catch (error) {
      console.error('Failed to send payment receipt:', error);
    }
  }
}

/**
 * Handle invoice.payment_failed
 * Notify user and mark subscription as past_due
 */
async function handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  
  console.log('Invoice payment failed:', invoice.id);

  // Update subscription status
  if ((invoice as any).subscription) {
    await query(
      `UPDATE subscriptions 
       SET status = 'past_due', updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [(invoice as any).subscription]
    );

    // Send payment failure email
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
    const userId = subscription.metadata?.userId;
    
    if (userId) {
      try {
        const result = await query(`SELECT email, name FROM users WHERE id = $1`, [userId]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const amount = (invoice.amount_due / 100).toFixed(2);
          await sendEmail({
            to: user.email,
            subject: '⚠️ Payment failed for your LEXORA subscription',
            text: `Hi ${user.name},\n\nWe were unable to process your payment of £${amount} for your LEXORA subscription.\n\nPlease update your payment method to avoid service interruption.\n\nUpdate payment method: ${process.env.NEXT_PUBLIC_APP_URL}/settings/billing\n\nWe'll retry the payment automatically. If payment continues to fail, your subscription may be cancelled.\n\nBest regards,\nThe LEXORA Team`,
            html: `<p>Hi ${user.name},</p><p>We were unable to process your payment of £${amount} for your LEXORA subscription.</p><p><strong>Please update your payment method to avoid service interruption.</strong></p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/billing">Update payment method</a></p><p>We'll retry the payment automatically. If payment continues to fail, your subscription may be cancelled.</p><p>Best regards,<br>The LEXORA Team</p>`,
          });
        }
      } catch (error) {
        console.error('Failed to send payment failure email:', error);
      }
    }
  }
}

/**
 * Main webhook handler
 */
export async function handleWebhook(event: Stripe.Event): Promise<void> {
  // Check if event was already processed (idempotency)
  if (await isEventProcessed(event.id)) {
    console.log('Event already processed:', event.id);
    return;
  }

  try {
    // Route to appropriate handler
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;

      case 'customer.subscription.trial_will_end':
        // TODO: Send trial ending reminder (3 days before)
        console.log('Trial will end soon:', event.data.object);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    // Mark event as processed
    await logWebhookEvent(event.id, event.type, event.data.object, true, null);
  } catch (error) {
    console.error('Error handling webhook:', error);
    
    // Log error
    await logWebhookEvent(
      event.id,
      event.type,
      event.data.object,
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );

    throw error;
  }
}

/**
 * Get webhook processing stats
 */
export async function getWebhookStats(): Promise<{
  total: number;
  processed: number;
  failed: number;
  recentEvents: any[];
}> {
  const statsResult = await query(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN processed THEN 1 ELSE 0 END) as processed,
       SUM(CASE WHEN NOT processed THEN 1 ELSE 0 END) as failed
     FROM stripe_webhook_events`
  );

  const recentResult = await query(
    `SELECT stripe_event_id, event_type, processed, error, created_at
     FROM stripe_webhook_events
     ORDER BY created_at DESC
     LIMIT 10`
  );

  return {
    total: parseInt(statsResult.rows[0].total),
    processed: parseInt(statsResult.rows[0].processed),
    failed: parseInt(statsResult.rows[0].failed),
    recentEvents: recentResult.rows,
  };
}
