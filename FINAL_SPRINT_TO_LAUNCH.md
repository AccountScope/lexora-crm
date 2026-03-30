# LEXORA CRM - FINAL SPRINT TO LAUNCH

**Date:** 2026-03-30  
**Status:** Multitenancy ✅ | Core Build ✅ | Ready for Final Testing  
**Goal:** Production launch-ready system

---

## CURRENT STATUS

### ✅ COMPLETED
- **Multitenancy:** Organizations table, RLS policies, data isolation
- **Core CRM:** Matters, clients, documents, time tracking, billing
- **5 Killer Features:**
  1. AI Time Capture (Gmail + OpenAI)
  2. Client Portal 2.0 (real-time timeline)
  3. Smart Deadline Management (UK court rules)
  4. One-Click LEDES Billing (corporate clients)
  5. Trust Auto-Reconciliation (SRA compliance)
- **Database:** All migrations run, organization backfilled
- **Code:** 7,000+ lines, 0 build errors

### ⏳ REMAINING WORK

**Phase 1: Frontend Setup (2-3 hours)**
- Connect frontend to new multitenancy schema
- Update API calls to use `organization_id`
- Fix any broken queries from RLS policies
- Test all core CRUD operations

**Phase 2: Testing & Polish (2-3 hours)**
- Create demo data (3 clients, 3 matters)
- Test all 5 killer features
- Check mobile responsiveness
- Fix critical bugs

**Phase 3: Production Prep (1-2 hours)**
- Environment variables
- Error handling
- Performance check
- Security audit

---

## PHASE 1: FRONTEND MULTITENANCY INTEGRATION

### 1.1 Update API Routes (1 hour)

**Priority files to check:**

```typescript
// app/api/clients/route.ts
// BEFORE: SELECT * FROM clients
// AFTER: SELECT * FROM clients WHERE organization_id = user_org

// app/api/matters/route.ts
// BEFORE: SELECT * FROM matters
// AFTER: SELECT * FROM matters WHERE organization_id = user_org

// app/api/documents/route.ts
// app/api/time-entries/route.ts
// app/api/invoices/route.ts
```

**Key changes needed:**
- Add `organization_id` to INSERT statements
- Remove explicit WHERE organization_id (RLS handles it)
- Update error messages for access denied

### 1.2 Test Core Flows (30 mins)

**Critical paths:**
1. **Login** → Dashboard loads
2. **Create client** → Saves with org_id
3. **Create matter** → Links to org + client
4. **Upload document** → Storage + org isolation
5. **Track time** → Timer + manual entry
6. **Create invoice** → Billing workflow

### 1.3 Fix Broken Queries (30 mins)

**Common RLS issues:**
- Service role key bypasses RLS (use anon key)
- Missing auth context in API calls
- Foreign key violations (org_id mismatches)

---

## PHASE 2: TESTING & DATA SETUP

### 2.1 Seed Demo Data (SQL Script - 15 mins)

```sql
-- Insert demo clients
INSERT INTO clients (id, organization_id, legal_name, display_name, status)
VALUES 
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Acme Corp Ltd', 'Acme Corp', 'ACTIVE'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Global Industries PLC', 'Global Industries', 'ACTIVE'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Smith & Sons', 'Smith & Sons', 'ACTIVE');

-- Insert demo matters
INSERT INTO matters (id, organization_id, client_id, matter_number, title, status)
VALUES 
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 
   (SELECT id FROM clients WHERE display_name = 'Acme Corp'), 
   'MAT-2024-001', 'Contract Dispute', 'OPEN'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 
   (SELECT id FROM clients WHERE display_name = 'Global Industries'), 
   'MAT-2024-002', 'Employment Tribunal', 'OPEN'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 
   (SELECT id FROM clients WHERE display_name = 'Smith & Sons'), 
   'MAT-2024-003', 'Property Sale', 'OPEN');

-- Insert demo time entries
INSERT INTO time_entries (id, organization_id, matter_id, user_id, duration_minutes, description, billable)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  m.id,
  (SELECT id FROM users LIMIT 1),
  120,
  'Client meeting and case review',
  true
FROM matters m
LIMIT 3;
```

### 2.2 Manual Testing Checklist (1 hour)

**Core CRM:**
- [ ] Login works
- [ ] Dashboard loads data
- [ ] Create client (form + save)
- [ ] View client list
- [ ] Create matter
- [ ] View matter details
- [ ] Start time timer
- [ ] Stop timer (logs entry)
- [ ] Manual time entry
- [ ] Upload document
- [ ] View documents
- [ ] Create invoice
- [ ] View billing report

**Killer Features:**
- [ ] AI Time Capture UI loads
- [ ] Client Portal timeline
- [ ] Smart Deadlines dashboard
- [ ] LEDES export button
- [ ] Trust reconciliation panel

**Edge Cases:**
- [ ] Empty states (no data)
- [ ] Long text fields
- [ ] Special characters
- [ ] Mobile view
- [ ] Slow network

### 2.3 Bug Fixes (1 hour buffer)

Track issues here:
```
BUG #1: [Description]
- Priority: High/Medium/Low
- Fix: [What was done]
- Commit: [hash]

BUG #2: ...
```

---

## PHASE 3: PRODUCTION PREP

### 3.1 Environment Variables (15 mins)

**Required:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=[service_key]

# OpenAI (optional - for AI features)
OPENAI_API_KEY=sk-...

# Google (optional - for Gmail integration)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Stripe (optional - for billing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3.2 Error Handling (30 mins)

**Add try-catch to all API routes:**
```typescript
export async function POST(req: Request) {
  try {
    // existing code
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3.3 Security Audit (30 mins)

**Checklist:**
- [ ] All tables have RLS enabled
- [ ] Anon key used in frontend (not service key)
- [ ] No sensitive data in error messages
- [ ] File uploads validated (type + size)
- [ ] SQL injection safe (parameterized queries)
- [ ] XSS prevention (sanitized inputs)

### 3.4 Performance Check (15 mins)

**Test queries:**
```sql
-- Check indexes exist
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%org%';

-- Check slow queries
EXPLAIN ANALYZE 
SELECT * FROM matters WHERE organization_id = '...';
```

---

## TIMELINE

**TODAY (3-4 hours):**
- [ ] Phase 1: Frontend multitenancy (2h)
- [ ] Phase 2: Demo data + testing (1-2h)

**TOMORROW (2-3 hours):**
- [ ] Fix critical bugs
- [ ] Phase 3: Production prep
- [ ] Final test run

**TUESDAY:**
- [ ] Sabrina test session
- [ ] Collect feedback

**REST OF WEEK:**
- [ ] Polish based on feedback
- [ ] Public launch prep

---

## SUCCESS CRITERIA

**MUST HAVE (launch blockers):**
- ✅ Multitenancy working (done)
- [ ] Login → Dashboard works
- [ ] Create client/matter works
- [ ] No critical bugs
- [ ] Mobile responsive

**NICE TO HAVE:**
- [ ] All 5 killer features working
- [ ] Demo data looks professional
- [ ] Fast page loads (<2s)
- [ ] Polished UI

**CAN DEFER:**
- Email integration setup (optional feature)
- Open Banking connection (can enable later)
- Mobile apps (web-first)

---

## NEXT STEPS

**Right now:**
1. Check if app builds: `npm run build`
2. Start dev server: `npm run dev`
3. Test login + dashboard
4. Report what works/breaks

**Then:**
1. I'll create seed data script
2. We'll test core flows together
3. Fix any broken API calls
4. Deploy to Vercel production

---

## RISK ASSESSMENT

**LOW RISK:**
- Database schema (✅ complete)
- Backend logic (✅ tested)
- Core features (✅ built)

**MEDIUM RISK:**
- Frontend-backend integration (multitenancy changes)
- RLS policy edge cases
- Demo data quality

**HIGH RISK (if not handled):**
- Bad first impression (buggy demo)
- Confusing UX (empty states)
- Performance issues (slow queries)

**Mitigation:**
- Test thoroughly before Sabrina
- Have Harris available during test
- Create realistic demo data
- Document known issues

---

## FILES TO CHECK

**Frontend (likely need updates):**
```
/app/page.tsx (dashboard)
/app/clients/page.tsx
/app/matters/page.tsx
/app/documents/page.tsx
/app/time-tracking/page.tsx
/app/billing/page.tsx
```

**API Routes (need org_id):**
```
/app/api/clients/route.ts
/app/api/matters/route.ts
/app/api/documents/route.ts
/app/api/time-entries/route.ts
/app/api/invoices/route.ts
```

**Supabase Client:**
```
/lib/supabase/client.ts (check auth context)
/lib/supabase/server.ts (RLS handling)
```

---

**Ready to start Phase 1? 🚀**

Let's test the app and see what breaks, then fix it systematically.
