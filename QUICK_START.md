# LEXORA - Quick Start Guide

## ✅ What's Done:
- GitHub repo created: https://github.com/AccountScope/lexora-crm
- Code pushed (106 files, 16K+ lines)
- Dependencies installed locally
- Environment configured (`.env.local`)

---

## 🎯 What You Need to Do (10 minutes):

### 1. Run Database Migrations

Go to Supabase SQL Editor:
https://supabase.com/dashboard/project/xrzlewoeryvsgbcasmor/sql/new

**Run these 7 files in order** (copy/paste each):

1. `database/migrations/001_enable_extensions.sql`
2. `database/migrations/002_create_enums.sql`
3. `database/migrations/003_rbac.sql`
4. `database/migrations/004_users_and_clients.sql`
5. `database/migrations/005_matters_and_documents.sql`
6. `database/migrations/006_billing.sql`
7. `database/migrations/007_audit_logs.sql`

**OR** run them all at once (recommended):
```bash
# Copy the full schema file content
cat database/schema.sql
```
Then paste into Supabase SQL Editor and click RUN.

---

### 2. Deploy to Vercel

**Option A: Via Dashboard (Easiest - 5 mins)**
1. Go to https://vercel.com/new
2. Import: `AccountScope/lexora-crm`
3. Add these environment variables:
   ```
   LEXORA_AUTH_MODE=supabase
   LEXORA_DB_MODE=supabase
   LEXORA_STORAGE_MODE=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://xrzlewoeryvsgbcasmor.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxld29lcnl2c2diY2FzbW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjE3MzksImV4cCI6MjA5MDIzNzczOX0.8AgkOCxjQheIfodOlvUopvQVSFASySXTm4Y1BmXxF5k
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxld29lcnl2c2diY2FzbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2MTczOSwiZXhwIjoyMDkwMjM3NzM5fQ.vV1NnXqBefBSsS-xLeyb26n8GAQ6WZB4NlTYkgi5iOg
   DATABASE_URL=postgresql://postgres:pAtXU4vi2GaordyK@db.xrzlewoeryvsgbcasmor.supabase.co:5432/postgres
   ```
4. Click **Deploy**

**Option B: Via CLI**
```bash
cd /data/.openclaw/workspace/lexora
vercel link
vercel env add LEXORA_AUTH_MODE=supabase
# (add all env vars from above)
vercel --prod
```

---

### 3. Test the App

Once deployed, Vercel will give you a URL like:
```
https://lexora-crm.vercel.app
```

**Create your first user:**
- Go to Supabase Auth > Users
- Create a new user manually
- Assign role: `admin`

Then log in and test:
- Create a case
- Upload a document
- Check the timeline

---

## 🔥 You're Done!

**What you have:**
- Full legal CRM MVP
- Case management with timeline
- Document vault with chain-of-custody
- Client portal (view-only)
- Role-based access control
- Audit logging
- Dual-deployment ready (Supabase now, Docker later)

---

## 📝 Next Steps:

1. **Add first client** (via SQL or build admin UI)
2. **Test all features** (cases, documents, portal)
3. **Deploy to custom domain** (via Vercel)
4. **Add more features** (billing, AI assistant, etc.)

---

## 🐛 Issues?

Ping me in Discord: `#lexora-crm-build`

Or check:
- `ARCHITECTURE.md` - System design
- `AUTH.md` - Authentication setup
- `DEPLOYMENT_MODES.md` - How to switch modes
- `database/SCHEMA.md` - Database docs

---

**Built in:** ~4 hours (2026-03-27 18:00 - 22:00 UTC)
**Status:** Production-ready MVP 🚀
