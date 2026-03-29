# Sabrina Testing Prep Guide

**Date:** 2026-03-29  
**Tester:** Sabrina (Lawyer)  
**Objective:** Test Lexora CRM core features + provide feedback  
**Estimated time:** 30-45 minutes

---

## STATUS: HARRIS NEEDS TO RUN MIGRATIONS FIRST

**BLOCKING:** 3 database migrations need to be run in Supabase dashboard before Sabrina can test the killer features.

**Instructions for Harris:**

### Step 1: Log into Supabase Dashboard (5 mins)

1. Go to: https://supabase.com/dashboard
2. Select project: `xrzlewoeryvsgbcasmor` (Lexora)
3. Click "SQL Editor" in left sidebar

### Step 2: Run Migration 1 - Client Portal (3 mins)

1. Click "New Query"
2. Open file: `/data/.openclaw/workspace/lexora/database/migrations/016_client_portal_v2.sql`
3. Copy entire contents (9.5KB)
4. Paste into Supabase SQL Editor
5. Click "Run" (bottom right)
6. Wait for "Success" message
7. ✅ Client Portal database ready

### Step 3: Run Migration 2 - Smart Deadlines (3 mins)

1. Click "New Query"
2. Open file: `/data/.openclaw/workspace/lexora/database/migrations/017_smart_deadlines.sql`
3. Copy entire contents (13KB)
4. Paste into Supabase SQL Editor
5. Click "Run"
6. Wait for "Success" message
7. ✅ Smart Deadlines database ready

### Step 4: Run Migration 3 - Trust Reconciliation (3 mins)

1. Click "New Query"
2. Open file: `/data/.openclaw/workspace/lexora/database/migrations/018_trust_auto_reconciliation.sql`
3. Copy entire contents (13.5KB)
4. Paste into Supabase SQL Editor
5. Click "Run"
6. Wait for "Success" message
7. ✅ Trust Reconciliation database ready

**TOTAL TIME:** 15 minutes

---

## After Migrations: Create Demo Data (30 mins)

**Purpose:** Sabrina shouldn't see empty screens

**Demo matters to create:**

### Matter 1: Residential Property Purchase
- Client: John & Sarah Williams
- Matter type: Conveyancing
- Status: Active
- Fee: £1,500
- Timeline: 3 events ("Offer accepted", "Searches ordered", "Exchange scheduled")
- Time entries: 5 entries (total 8.5 hours)
- Documents: 2 PDFs ("Contract", "Search results")
- Deadline: Exchange in 14 days

### Matter 2: Employment Tribunal
- Client: Tech Innovations Ltd
- Matter type: Employment
- Status: Active
- Fee: £8,000
- Timeline: 4 events
- Time entries: 12 entries (total 18 hours)
- Documents: 3 PDFs
- Deadlines: Witness statements due in 7 days, tribunal hearing in 21 days

### Matter 3: Probate Application
- Client: Estate of Margaret Thompson
- Matter type: Probate
- Status: Pending
- Fee: £2,500
- Timeline: 2 events
- Time entries: 3 entries (total 4.5 hours)
- Documents: 1 PDF (Will)

**How to create (manual in UI):**

1. Login to Lexora staging
2. Create 3 clients
3. Create 3 matters (link to clients)
4. Add time entries for each
5. Upload sample PDFs
6. Set deadlines
7. Create sample invoices

**OR use seed script (if we build it)**

---

## What Sabrina Should Test (In Order)

### Phase 1: Core Workflow (20 mins)

**Step 1: Login & Onboarding**
- [ ] Login works
- [ ] Onboarding dashboard loads
- [ ] Progress tracking visible (0/7 steps)
- [ ] "Start here" badge on first step

**Step 2: Create a Matter**
- [ ] Click "Create Your First Matter"
- [ ] Fill out form (client, matter type, fee)
- [ ] Save successfully
- [ ] Matter appears in dashboard
- [ ] Mark onboarding step complete

**Step 3: Add a Client**
- [ ] Navigate to Clients
- [ ] Add new client (name, email, phone)
- [ ] Save successfully
- [ ] Client appears in list

**Step 4: Track Time**
- [ ] Start timer for a task
- [ ] Stop timer (logs time entry)
- [ ] Add manual time entry
- [ ] Bulk add time entries
- [ ] View AI time suggestions (demo mode)

**Step 5: Upload Document**
- [ ] Navigate to Documents
- [ ] Upload a PDF
- [ ] Document appears in vault
- [ ] Download works

**Step 6: Create Invoice**
- [ ] Navigate to Billing
- [ ] Select time entries
- [ ] Generate invoice
- [ ] Preview PDF
- [ ] Download invoice

### Phase 2: Advanced Features (15 mins)

**Step 7: Client Portal**
- [ ] Navigate to matter
- [ ] View timeline (events appear)
- [ ] Check milestones (progress %)
- [ ] Test messaging (if enabled)

**Step 8: Smart Deadlines**
- [ ] Set a deadline for a matter
- [ ] System suggests dependent deadlines
- [ ] View deadline dashboard
- [ ] Check risk detection

**Step 9: LEDES Export**
- [ ] Navigate to invoice
- [ ] Click "Export LEDES"
- [ ] Select format (1998B or 2000)
- [ ] Download file
- [ ] Verify format in text editor

**Step 10: Trust Reconciliation**
- [ ] Navigate to Trust Accounting
- [ ] View reconciliation dashboard
- [ ] Check balance calculation
- [ ] See discrepancy detection (if any)

### Phase 3: Feedback (10 mins)

**Questions to ask Sabrina:**

1. **First Impressions**
   - Does it look professional?
   - Is navigation intuitive?
   - Any confusing terminology?

2. **Core Workflow**
   - Which features felt natural?
   - What was frustrating?
   - What's missing?

3. **Time Savings**
   - Which feature saves the most time?
   - Would you use AI time capture?
   - How much time could this save you weekly?

4. **Pricing**
   - Would you pay £120/user/month?
   - What about £60/month for early adopters?
   - Is the ROI clear?

5. **What Next?**
   - What needs polish before launch?
   - What features are missing?
   - Would you recommend to colleagues?

---

## Success Criteria

**MUST HAVE (non-negotiable):**
- ✅ Login works
- ✅ Can create matter
- ✅ Can track time
- ✅ Can create invoice
- ✅ No critical bugs
- ✅ UI looks professional

**NICE TO HAVE:**
- ✅ Onboarding is clear
- ✅ AI features work (demo mode OK)
- ✅ Advanced features accessible
- ✅ Fast performance (<2s page loads)

**RED FLAGS (must fix before launch):**
- ❌ Confusing navigation
- ❌ Critical bugs (crashes, data loss)
- ❌ Ugly UI
- ❌ Slow performance (>5s loads)
- ❌ Missing core features
- ❌ Data security concerns

---

## Post-Testing Actions

**If feedback is positive:**
1. Fix any bugs she found (1-2 hours)
2. Polish based on suggestions (2-4 hours)
3. Deploy to production (1 hour)
4. Invite 5 more testers
5. Launch publicly next week

**If feedback is mixed:**
1. Prioritize critical fixes (1 day)
2. Re-test with Sabrina (30 mins)
3. Iterate based on second feedback
4. Launch in 2 weeks

**If feedback is negative:**
1. Deep dive on what's wrong (2 hours)
2. Fix critical issues (1-3 days)
3. Re-test with fresh eyes
4. Delay launch until confident

---

## Current Status Checklist

**Before Sabrina tests:**
- [ ] Harris runs 3 database migrations (15 mins)
- [ ] Harris creates 3 demo matters (30 mins)
- [ ] Harris tests login flow (5 mins)
- [ ] Harris tests core workflow (20 mins)
- [ ] Deploy to staging (if not already)
- [ ] Send Sabrina login link + this guide

**Estimated prep time:** 1.5 hours

---

## Testing URLs

- **Staging:** TBD (Harris to provide)
- **Supabase Dashboard:** https://supabase.com/dashboard/project/xrzlewoeryvsgbcasmor
- **SQL Editor:** https://supabase.com/dashboard/project/xrzlewoeryvsgbcasmor/sql

---

## Support During Test

**If Sabrina gets stuck:**
1. Check she has login credentials
2. Verify migrations ran successfully
3. Check browser console for errors (F12)
4. Remote debug via Zoom/screen share

**Harris availability:** Recommend being available during her 30-45 min test session

---

## Files Sabrina Needs

1. Login credentials (email + password)
2. This guide (SABRINA_PREP_GUIDE.md)
3. Optional: Demo video (if we make one)

---

## Timeline

**Today (Sunday):**
- Harris runs migrations (15 mins)
- Harris creates demo data (30 mins)
- Harris tests personally (30 mins)
- READY FOR SABRINA

**Monday morning:**
- Send Sabrina access
- Schedule 30-min test session
- Be available for questions

**Monday afternoon:**
- Collect feedback
- Prioritize fixes
- Start polishing

**Tuesday:**
- Deploy fixes
- Re-test if needed
- Expand testing to more lawyers

**Next week:**
- Public launch (if feedback good)
- First customer acquisition

---

**Status:** Harris needs to run migrations before Sabrina can test  
**Time required:** 15 mins migrations + 30 mins demo data = 45 mins prep  
**Recommendation:** Do prep today (Sunday evening), test Monday morning
