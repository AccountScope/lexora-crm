# LEXORA CRM - Vercel Deployment Guide

**Date:** 2026-03-28  
**Status:** Ready to deploy

---

## ✅ Pre-Deployment Checklist

- [x] All code pushed to GitHub (commit: 550e33c)
- [x] TypeScript: 0 errors
- [x] Build: passing locally
- [x] Database migrations: 010-021 applied
- [x] Environment variables: documented
- [x] Login page: created
- [x] Auth endpoints: created

---

## 🚀 Deployment Steps

### 1. Connect GitHub Repository

1. Go to https://vercel.com/new
2. Import `AccountScope/lexora-crm` repository
3. Framework: **Next.js**
4. Root directory: **/** (default)
5. Click **Deploy** (it will fail first without env vars - that's OK)

### 2. Configure Environment Variables

Go to **Project Settings > Environment Variables** and add:

#### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://xrzlewoeryvsgbcasmor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxld29lcnl2c2diY2FzbW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjE3MzksImV4cCI6MjA5MDIzNzczOX0.8AgkOCxjQheIfodOlvUopvQVSFASySXTm4Y1BmXxF5k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxld29lcnl2c2diY2FzbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2MTczOSwiZXhwIjoyMDkwMjM3NzM5fQ.vV1NnXqBefBSsS-xLeyb26n8GAQ6WZB4NlTYkgi5iOg
```

#### Database (Connection Pooler - use this for Vercel)
```
DATABASE_URL=postgresql://postgres.xrzlewoeryvsgbcasmor:pAtXU4vi2GaordyK@aws-0-eu-west-2.pooler.supabase.com:6543/postgres
```

#### Email Integration
```
EMAIL_ENCRYPTION_KEY=s1RPnxeGvGeq9u0DXV4ajcFyOL2XU
```

#### Stripe (Optional - can add later)
```
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51T4s0oPXkRJJj6Ibr7TYb6Nnqr0hYhTrEW79MONUGqGawWgNPbceeYzPW9KFA513M7o1pNRTgSwLiI4FANE5iNZL00cwMn7OOf
STRIPE_PRICE_ESSENTIAL=price_1TCFvEPXkRJJj6IbcSjKPEsZ
STRIPE_PRICE_PROFESSIONAL=price_1TCFvPPXkRJJj6Ib5nyYYgvA
```

#### AI Features (Optional - can use local Ollama instead)
```
# Leave these empty for now - we'll test with Ollama locally
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
```

### 3. Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **Redeploy**
4. Wait for build to complete (~2-3 minutes)

---

## 🧪 Post-Deployment Testing

### Test URLs
- **Production:** https://lexora-crm.vercel.app
- **Login:** https://lexora-crm.vercel.app/login
- **API Health:** https://lexora-crm.vercel.app/api/health

### Test Sequence

1. **Health Check**
   ```bash
   curl https://lexora-crm.vercel.app/api/health
   # Expected: {"status":"ok"}
   ```

2. **Login Page**
   - Visit https://lexora-crm.vercel.app/login
   - Should see professional LEXORA login page
   - No errors in console

3. **Register Test User** (via curl or create manually in Supabase)
   ```bash
   curl -X POST https://lexora-crm.vercel.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@lexora.com","password":"AdminPass123!","firstName":"Admin","lastName":"User"}'
   ```

4. **Login**
   - Use login page with test credentials
   - Should redirect to /dashboard
   - Session cookie should be set

5. **Test Core Features**
   - Cases management
   - Clients
   - Documents
   - Time tracking
   - Trust accounting
   - Admin features

---

## 📋 Known Issues to Fix

### Critical (Must fix before launch)
- [ ] Test login flow end-to-end
- [ ] Verify database connectivity from Vercel
- [ ] Test all API endpoints
- [ ] Verify file uploads work
- [ ] Test email integration (OAuth setup needed)

### High Priority
- [ ] UI polish on all pages
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Form validation

### Medium Priority
- [ ] Dashboard analytics
- [ ] Advanced search
- [ ] Reporting features
- [ ] AI features UI

### Low Priority (Optional)
- [ ] Stripe billing integration
- [ ] Offline mode
- [ ] PWA features

---

## 🔐 Security Checklist

- [x] All routes protected by middleware or `requireUser()`
- [x] Passwords hashed with bcrypt
- [x] Session tokens secure (httpOnly, secure, sameSite)
- [x] 2FA support implemented
- [x] Email verification implemented
- [x] GDPR tools available
- [x] Audit logging active
- [ ] Rate limiting (TODO)
- [ ] CSRF protection (TODO)
- [ ] Input sanitization review (TODO)

---

## 📊 Performance Targets

- [ ] First Contentful Paint: < 1.5s
- [ ] Time to Interactive: < 3s
- [ ] Lighthouse Score: > 90
- [ ] Core Web Vitals: All green

---

## 🎯 Next Steps After Deployment

1. **Test Login Flow** - Create user, log in, verify session
2. **Test Core Features** - Cases, clients, documents, time tracking
3. **Fix Any Bugs** - Document and resolve issues
4. **UI Polish** - Make it look professional
5. **Performance Optimization** - Fast page loads
6. **Security Audit** - Review all endpoints
7. **Documentation** - User guides, API docs

---

**Deployed by:** OpenClaw Agent  
**Deployment Date:** 2026-03-28  
**GitHub Commit:** 550e33c
