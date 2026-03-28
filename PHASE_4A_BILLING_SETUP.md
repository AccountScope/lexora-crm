# Phase 4A: Stripe Billing Integration - Setup Guide

## 🎯 Overview

Complete Stripe billing integration for LEXORA with subscription management, usage tracking, and customer portal.

## ✅ Deliverables Completed

### Database
- ✅ `database/migrations/020_billing.sql` - Complete schema with RLS policies

### Backend (lib/stripe/)
- ✅ `config.ts` - Pricing plans, limits, and configuration
- ✅ `checkout.ts` - Checkout session management
- ✅ `subscriptions.ts` - Subscription CRUD operations
- ✅ `webhooks.ts` - Webhook handlers with idempotency
- ✅ `usage.ts` - Usage tracking and overage calculations

### API Routes
- ✅ `/api/billing/checkout/route.ts` - Create checkout sessions
- ✅ `/api/billing/portal/route.ts` - Customer portal access
- ✅ `/api/billing/subscription/route.ts` - Subscription management
- ✅ `/api/webhooks/stripe/route.ts` - Webhook endpoint

### Frontend Components
- ✅ `components/billing/pricing-table.tsx` - Pricing comparison
- ✅ `components/billing/subscription-card.tsx` - Current plan display
- ✅ `components/billing/usage-display.tsx` - Usage stats with progress bars

### Pages
- ✅ `app/(authenticated)/settings/billing/page.tsx` - Billing settings
- ✅ `app/(authenticated)/settings/billing/invoices/page.tsx` - Invoice list
- ✅ `app/pricing/page.tsx` - Public pricing page

## 🚀 Setup Instructions

### 1. Install Dependencies

Already installed:
```bash
npm install stripe @stripe/stripe-js
```

### 2. Configure Stripe

#### A. Create Stripe Account
1. Go to https://stripe.com and create an account
2. Switch to "Test mode" (toggle in top right)

#### B. Get API Keys
1. Go to Developers → API keys
2. Copy **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy **Secret key** → `STRIPE_SECRET_KEY`

#### C. Create Products & Prices
1. Go to Products → Add product
2. Create three products:

**Essential Plan**
- Name: Essential
- Description: Basic features for solo practitioners
- Price: £99/month
- Copy the price ID → `STRIPE_PRICE_ESSENTIAL`

**Professional Plan**
- Name: Professional
- Description: Full features for growing firms
- Price: £299/month
- Copy the price ID → `STRIPE_PRICE_PROFESSIONAL`

**Enterprise Plan**
- Name: Enterprise
- Description: Unlimited access with premium support
- Price: £999/month
- Copy the price ID → `STRIPE_PRICE_ENTERPRISE`

#### D. Enable Billing Portal
1. Go to Settings → Billing → Customer portal
2. Click "Activate test link"
3. Configure allowed actions:
   - ✅ Update payment method
   - ✅ Update subscription (upgrade/downgrade)
   - ✅ Cancel subscription
   - ✅ View invoice history
4. Save settings

#### E. Configure Webhooks
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`

### 3. Update Environment Variables

Add to `.env.local`:

```env
# Stripe Billing Integration
STRIPE_SECRET_KEY=sk_test_51xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price IDs
STRIPE_PRICE_ESSENTIAL=price_xxxxx
STRIPE_PRICE_PROFESSIONAL=price_xxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxx

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 4. Run Database Migration

```bash
# Connect to Supabase
psql $DATABASE_URL

# Run migration
\i database/migrations/020_billing.sql

# Verify tables were created
\dt subscriptions
\dt payment_methods
\dt usage_records
\dt stripe_webhook_events
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `020_billing.sql`
3. Execute

### 5. Test the Integration

#### Test Checkout Flow
1. Navigate to `/pricing`
2. Click "Start Free Trial" on Professional plan
3. Use Stripe test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. Complete checkout
7. Verify subscription created in `/settings/billing`

#### Test Webhooks (Local Development)

Install Stripe CLI:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Trigger test events:
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_succeeded
```

#### Test Customer Portal
1. Go to `/settings/billing`
2. Click "Manage Billing"
3. Should redirect to Stripe Customer Portal
4. Test: Update payment method, cancel subscription, etc.

### 6. Testing Checklist

- [ ] Create subscription (checkout flow)
- [ ] View subscription details
- [ ] Check usage stats
- [ ] Open customer portal
- [ ] Update payment method (in portal)
- [ ] Cancel subscription
- [ ] Resume canceled subscription
- [ ] Change plan (upgrade/downgrade)
- [ ] Webhook processing (check logs)
- [ ] Trial expiration handling
- [ ] Payment failure handling
- [ ] Invoice list (once available)

## 📊 Pricing Plans

| Plan | Price | Users | Storage | API Calls | Features |
|------|-------|-------|---------|-----------|----------|
| **Free** | £0 | 1 | 1GB | 100/mo | View-only, basic reports |
| **Essential** | £99/mo | 1 | 10GB | 1K/mo | Basic features, 14-day trial |
| **Professional** | £299/mo | 5 | 50GB | 10K/mo | All features, priority support |
| **Enterprise** | £999/mo | Unlimited | Unlimited | Unlimited | White-label, dedicated support |

### Overage Charges
- **Extra user:** £10/user
- **Extra 10GB storage:** £5
- **Extra 1K API calls:** £2
- **Extra 1K emails:** £1

*Enterprise plan has no overages*

## 🔐 Security Features

- ✅ Webhook signature verification
- ✅ Idempotency handling (prevents duplicate processing)
- ✅ Row-level security policies
- ✅ Secure API key management
- ✅ HTTPS-only webhooks
- ✅ Test mode separation

## 🎨 UI/UX Features

- ✅ 14-day trial on all paid plans
- ✅ Promo code support
- ✅ Billing address collection
- ✅ Usage progress bars
- ✅ Overage warnings
- ✅ Cancel at period end (no immediate loss)
- ✅ Success/cancel redirect handling
- ✅ Responsive design
- ✅ Dark mode support

## 📧 Email Notifications

Automated emails sent for:
- ✅ Subscription activated (welcome)
- ✅ Payment succeeded (receipt)
- ✅ Payment failed (with action link)
- ✅ Subscription canceled
- 🔜 Trial ending reminder (3 days before)

## 🧪 Test Cards

Use these Stripe test cards:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 9995 | Decline (insufficient funds) |
| 4000 0025 0000 3155 | 3D Secure authentication |
| 4000 0000 0000 0341 | Card declined |

More: https://stripe.com/docs/testing

## 🔄 Subscription Lifecycle

```
FREE
 ↓
CHECKOUT → TRIALING (14 days)
            ↓
            ACTIVE (payment succeeded)
            ↓
            PAST_DUE (payment failed)
            ↓
            CANCELED (after 3 failed retries)
            ↓
            FREE (downgrade)
```

## 📝 Next Steps

### Optional Enhancements
1. **Invoice API endpoint** - Fetch invoices from Stripe
2. **Usage-based billing** - Report metered usage to Stripe
3. **Team invitations** - Multi-user subscriptions
4. **Annual plans** - Discounted yearly subscriptions
5. **Trial extension** - Admin can extend trials
6. **Referral program** - Credit for referrals
7. **White-label branding** - Custom portal for Enterprise

### Production Deployment
1. Switch to **Live mode** in Stripe
2. Create production products & prices
3. Update environment variables with live keys
4. Configure production webhook endpoint
5. Test end-to-end in production
6. Set up monitoring (Stripe Dashboard)

## 🐛 Troubleshooting

### Webhook not receiving events
- Check webhook URL is publicly accessible
- Verify signing secret is correct
- Check webhook logs in Stripe Dashboard
- Test with Stripe CLI locally

### Checkout session expired
- Sessions expire after 24 hours
- User must create a new session

### Payment fails
- Check card details are valid
- Try different test card
- Check Stripe logs for details

### Subscription not showing
- Verify webhook was processed
- Check database for subscription record
- Check webhook event logs table

## 📚 Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Billing Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)

## ✅ Status

**Phase 4A Complete!** 

All billing functionality is implemented and ready for testing. Follow the setup guide above to configure Stripe and start testing.
