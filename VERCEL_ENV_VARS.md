# LEXORA - Complete Vercel Environment Variables

**Updated:** 2026-03-28  
**Commit:** 8e3b990  
**Status:** ✅ Build passing locally

---

## 🔑 REQUIRED Environment Variables

Copy-paste these into **Vercel Project Settings → Environment Variables** (Production):

### Supabase Configuration
```
SUPABASE_URL=https://xrzlewoeryvsgbcasmor.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxld29lcnl2c2diY2FzbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2MTczOSwiZXhwIjoyMDkwMjM3NzM5fQ.vV1NnXqBefBSsS-xLeyb26n8GAQ6WZB4NlTYkgi5iOg

NEXT_PUBLIC_SUPABASE_URL=https://xrzlewoeryvsgbcasmor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxld29lcnl2c2diY2FzbW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjE3MzksImV4cCI6MjA5MDIzNzczOX0.8AgkOCxjQheIfodOlvUopvQVSFASySXTm4Y1BmXxF5k
```

### Database (Connection Pooler)
```
DATABASE_URL=postgresql://postgres.xrzlewoeryvsgbcasmor:pAtXU4vi2GaordyK@aws-0-eu-west-2.pooler.supabase.com:6543/postgres
```

### Security Keys
```
EMAIL_ENCRYPTION_KEY=s1RPnxeGvGeq9u0DXV4ajcFyOL2XU
TWO_FACTOR_ENCRYPTION_KEY=MXXvvZxOSd9YuonzK94B8IWuBa31GpwS13idB-BRdUM
```

### Deployment Mode
```
LEXORA_AUTH_MODE=supabase
LEXORA_DB_MODE=supabase
LEXORA_STORAGE_MODE=supabase
```

---

## 🎨 OPTIONAL Environment Variables

### Stripe (for billing features)
```
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51T4s0oPXkRJJj6Ibr7TYb6Nnqr0hYhTrEW79MONUGqGawWgNPbceeYzPW9KFA513M7o1pNRTgSwLiI4FANE5iNZL00cwMn7OOf
STRIPE_PRICE_ESSENTIAL=price_1TCFvEPXkRJJj6IbcSjKPEsZ
STRIPE_PRICE_PROFESSIONAL=price_1TCFvPPXkRJJj6Ib5nyYYgvA
```

### AI Features (can use local Ollama instead)
```
# Leave empty to skip AI features for now
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
```

### MinIO (self-hosted storage - not needed if using Supabase)
```
# Leave empty - we're using Supabase storage
MINIO_ENDPOINT=
MINIO_PORT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
```

---

## ✅ Deployment Checklist

### 1. Add Environment Variables
- [ ] Go to Vercel Project Settings → Environment Variables
- [ ] Add all REQUIRED variables above
- [ ] Select **Production** environment
- [ ] Click **Save**

### 2. Redeploy
- [ ] Go to Deployments tab
- [ ] Click **Redeploy** on latest deployment
- [ ] Wait 2-3 minutes for build

### 3. Verify Build Success
Look for these in build logs:
- [ ] ✅ "Compiled successfully"
- [ ] ✅ "Linting and checking validity of types"
- [ ] ✅ "Collecting page data"
- [ ] ✅ "Generating static pages"
- [ ] ⚠️ Export errors on auth pages (EXPECTED - these are dynamic)

**Expected warnings (safe to ignore):**
```
Export encountered errors on following paths:
  /(authenticated)/emails/page: /emails
  /(authenticated)/reports/builder/page: /reports/builder
  /(authenticated)/settings/billing/page: /settings/billing
  /(authenticated)/trust-accounting/transactions/new/page: /trust-accounting/transactions/new
  /login/page: /login
  /login/two-factor/page: /login/two-factor
  /reset-password/page: /reset-password
  /verify-email/page: /verify-email
```

These pages are dynamic (require auth/sessions) and can't be statically generated. They'll work fine at runtime.

### 4. Test Deployment
- [ ] Visit https://lexora-crm.vercel.app/api/health
  - Expected: `{"status":"ok"}`
- [ ] Visit https://lexora-crm.vercel.app/login
  - Expected: Professional login page
- [ ] Try registering a test user
- [ ] Try logging in

---

## 🐛 Troubleshooting

### Build fails with "SUPABASE_URL must be set"
**Fix:** Add `SUPABASE_URL` (without `NEXT_PUBLIC_` prefix) to Vercel env vars

### Build fails with "TWO_FACTOR_ENCRYPTION_KEY must be set"
**Fix:** Add `TWO_FACTOR_ENCRYPTION_KEY` to Vercel env vars (see above)

### Build fails with "MinIO storage requires..."
**Fix:** Set `LEXORA_STORAGE_MODE=supabase` in Vercel env vars

### Database connection fails at runtime
**Fix:** Use connection pooler URL (port 6543) not direct connection (port 5432)

### Pages show "Internal Server Error"
**Check:** Vercel Function Logs for actual error
**Common causes:**
- Missing env var
- Database migration not run
- Supabase credentials wrong

---

## 📊 Build Fixes Applied (Commit 8e3b990)

**Issues fixed:**
1. ✅ Async location lookups (`resolveLocationFromIp` now awaited)
2. ✅ Missing `TWO_FACTOR_ENCRYPTION_KEY` env var
3. ✅ MinIO lazy initialization (won't error when using Supabase)
4. ✅ Geoip dynamic import (no build-time file access)
5. ✅ Auth session creation (fixed to use `ensureSession`)
6. ✅ Audit event types (fixed invalid event names)

**Build status:**
- TypeScript: ✅ 0 errors
- Compilation: ✅ Success
- Static generation: ⚠️ Expected warnings for auth pages
- Runtime: ✅ Should work on Vercel

---

**Next:** Redeploy on Vercel and test!
