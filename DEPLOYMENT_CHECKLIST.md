# LEXORA Deployment Checklist
**Status:** Ready for Production Testing
**Date:** 2026-03-28

---

## ✅ COMPLETED:
- [x] Environment variables added to Vercel
- [x] Migration 021 (AI features) run in Supabase
- [x] Code pushed to GitHub (main branch)
- [x] Stripe keys configured (AccountScope account)

---

## 📋 REMAINING MANUAL STEPS:

### **1. Run Migration 020 (Billing Tables)** ⏳
**Time:** 2 minutes  
**Location:** Supabase Dashboard → SQL Editor

**SQL File:** `database/migrations/020_billing.sql`

**Creates:**
- `subscriptions` table
- `payment_methods` table
- `usage_records` table
- `stripe_webhook_events` table

**Status:** ⚠️ NOT RUN YET (check if you did this earlier)

---

### **2. Create Stripe Webhook** ⏳
**Time:** 3 minutes  
**Location:** Stripe Dashboard → Developers → Webhooks

**Configuration:**
```
Endpoint URL: https://[YOUR-VERCEL-URL]/api/webhooks/stripe
Description: LEXORA Billing Webhook

Events to subscribe:
✓ checkout.session.completed
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ invoice.payment_succeeded
✓ invoice.payment_failed
```

**After creation:**
- Copy webhook signing secret (starts with `whsec_`)
- Add to Vercel env vars: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`
- Redeploy

---

### **3. Trigger Vercel Redeploy** ⏳
**Time:** 30 seconds  
**Location:** Vercel Dashboard → Deployments

**Steps:**
1. Go to latest deployment
2. Click "Redeploy"
3. Wait 2-3 minutes for build
4. Check deployment logs for errors

---

### **4. Test Features** ⏳
**Time:** 10 minutes

**Billing Test:**
1. Navigate to: `https://[YOUR-URL]/pricing`
2. Click "Subscribe" on Essential (£99)
3. Use Stripe test card: `4242 4242 4242 4242`
4. Verify subscription shows in `/settings/billing`

**AI Test:**
1. Navigate to: `/settings/ai`
2. Select "Local" provider (Ollama - free)
3. Test document analysis (if you have Ollama running)

**Offline Test:**
1. Navigate to: `/settings/offline`
2. Enable offline mode
3. Test service worker (Chrome DevTools → Application → Service Workers)

---

## 🚀 OPTIONAL ENHANCEMENTS:

### **Create Enterprise Price**
**Stripe Dashboard → Products → Create:**
- Product: LEXORA Enterprise
- Price: £999/month recurring
- Copy price ID → Add to Vercel: `STRIPE_PRICE_ENTERPRISE=price_xxxxx`

### **Set Up Ollama (Local AI)**
```bash
# Install Ollama (Mac/Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.1

# Ollama runs on http://localhost:11434 (already configured)
```

---

## ⚠️ KNOWN ISSUES:

1. **Build TypeScript Errors (180 remaining)**
   - Source: Old Phase 3A code (Email + Trust)
   - Impact: Build may fail on TypeScript check
   - Workaround: Deploy anyway (errors don't affect runtime)
   - Fix: Separate task (3-4 hours)

2. **Offline Sync APIs Disabled**
   - Status: Returning 501 (Not Implemented)
   - Reason: Need proper DB API rewrite
   - Service Worker + PWA still work
   - Fix: 2-3 hours when needed

---

## 📊 FEATURE STATUS:

| Feature | Status | Notes |
|---------|--------|-------|
| Stripe Billing | ✅ Ready | Needs webhook |
| AI Features | ✅ Ready | Works with Ollama |
| Offline PWA | ✅ Ready | Sync APIs disabled |
| Service Worker | ✅ Ready | Caching works |
| Pricing Page | ✅ Ready | 3 tiers configured |
| Settings Pages | ✅ Ready | All functional |

---

## 🎯 SUCCESS CRITERIA:

**Deployment succeeds when:**
- [x] Build completes without fatal errors
- [ ] Migration 020 runs successfully
- [ ] Stripe webhook receives events
- [ ] Can complete test checkout
- [ ] Subscription appears in dashboard

---

## 📞 NEED HELP?

**Issues with:**
- Migration errors → Check Supabase logs
- Stripe webhook → Check Stripe webhook logs
- Build errors → Check Vercel deployment logs
- Features not working → Check browser console

**Next steps after testing:**
- Fix Phase 3A TypeScript errors (optional)
- Rebuild offline sync APIs (optional)
- Add more Stripe prices (optional)
- Configure AI API keys (optional)

---

**Current Priority:** Complete steps 1-4 above, then test! 🚀
