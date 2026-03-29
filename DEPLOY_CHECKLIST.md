# 🚀 LEXORA CRM - DEPLOYMENT & TEST CHECKLIST

**Date:** 2026-03-29  
**Version:** Enterprise v1.0  
**Tester:** Harris's Lawyer  
**Objective:** Complete end-to-end test of enterprise legal CRM

---

## PRE-DEPLOYMENT (Run These First)

### 1. Database Migrations
```bash
# Connect to Supabase
cd /data/.openclaw/workspace/lexora

# Run migrations
supabase db push

# Or manually run:
# - supabase/migrations/20260329_organizations_multitenancy.sql
```

**What this creates:**
- `organizations` table
- `roles` table (5 default roles per org)
- `user_roles` table
- `audit_logs` table
- Adds `organization_id` to all tables
- Row Level Security policies

### 2. Environment Variables (Vercel)
Ensure these are set in Vercel dashboard:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `DATABASE_URL`
- ✅ `STRIPE_SECRET_KEY` (if using billing)
- ✅ `TWO_FACTOR_ENCRYPTION_KEY`
- ✅ `EMAIL_ENCRYPTION_KEY`

### 3. Deploy to Vercel
```bash
# Option A: Auto-deploy (main branch)
git push origin main
# Vercel will auto-deploy

# Option B: Manual deploy
vercel --prod
```

---

## TESTING WORKFLOW (For Lawyer)

### PHASE 1: ACCOUNT SETUP (5 min)

**1. Create Account**
- [ ] Visit: `https://lexora-crm.vercel.app`
- [ ] Click "Sign Up"
- [ ] Enter email, password, full name
- [ ] Verify email (check inbox)
- [ ] Login successfully

**2. Create Organization**
- [ ] After first login, create organization
- [ ] Enter: Organization name, slug
- [ ] Add: Email, phone, address
- [ ] Submit

**Expected:** Redirected to dashboard

---

### PHASE 2: ORGANIZATION SETTINGS (10 min)

**Navigate to:** `/settings/organization`

**Test:**
- [ ] View organization details
- [ ] Update organization name
- [ ] Update contact info (email, phone)
- [ ] Update address (street, city, postcode)
- [ ] Change regional settings (timezone, currency)
- [ ] Click "Save Changes"
- [ ] See success toast notification
- [ ] Refresh page - changes persist

**Check:**
- ✅ Form loads without errors
- ✅ All fields editable
- ✅ Save button works
- ✅ Toast appears
- ✅ Data saved correctly

---

### PHASE 3: TEAM MANAGEMENT (10 min)

**Navigate to:** `/settings/team`

**Test:**
- [ ] View team members list
- [ ] See your account (Owner role)
- [ ] Click "Invite Member"
- [ ] Enter: Name, Email, Select role (e.g., "Lawyer")
- [ ] Click "Send Invitation"
- [ ] See success toast
- [ ] Member appears in pending/sent list

**Check:**
- ✅ Role badges display correctly (color-coded)
- ✅ Permissions reference shows for each role
- ✅ Invite form validates email
- ✅ Can't submit without required fields

---

### PHASE 4: EXECUTIVE DASHBOARD (15 min)

**Navigate to:** `/dashboard`

**Test:**
- [ ] View 4 KPI cards (Revenue, Matters, Utilization, Outstanding)
- [ ] See revenue trend chart
- [ ] See matters by status pie chart
- [ ] See matters by practice area bar chart
- [ ] View top billers list
- [ ] View top clients list
- [ ] View trust account summary
- [ ] Toggle time range (Month/Quarter/Year)
- [ ] Charts update when toggling

**Check:**
- ✅ All metrics display (even if 0 or mock data)
- ✅ Charts render without errors
- ✅ Responsive on mobile/tablet/desktop
- ✅ No console errors
- ✅ Tooltips work on charts

---

### PHASE 5: CASES/MATTERS MANAGEMENT (20 min)

**Navigate to:** `/cases`

**Test:**
- [ ] Click "New Case" or "Create Matter"
- [ ] Fill in case details:
  - Client name
  - Matter type
  - Practice area
  - Responsible lawyer
  - Description
  - Billing rate
- [ ] Submit form
- [ ] Case appears in list
- [ ] Click on case to view details
- [ ] Update case status (Active → Pending)
- [ ] Add notes/timeline entries
- [ ] See audit trail of changes

**Check:**
- ✅ Form validation works
- ✅ Required fields enforced
- ✅ Date pickers work
- ✅ Case number auto-generated
- ✅ Can edit after creation
- ✅ Changes logged in audit

---

### PHASE 6: TIME TRACKING (15 min)

**Navigate to:** `/time` (or wherever time entries are)

**Test:**
- [ ] Click "Log Time"
- [ ] Select case/matter
- [ ] Enter: Date, Hours, Description
- [ ] Mark as Billable/Non-billable
- [ ] Select billing rate
- [ ] Submit
- [ ] Time entry appears in list
- [ ] Edit time entry
- [ ] Delete time entry
- [ ] Filter by date range
- [ ] Filter by billable/non-billable

**Check:**
- ✅ Hours calculated correctly
- ✅ Billable amount auto-calculated
- ✅ Can log multiple entries per day
- ✅ Timer feature works (if implemented)
- ✅ Export to CSV/Excel (if implemented)

---

### PHASE 7: INVOICING (20 min)

**Navigate to:** `/invoices` (or billing)

**Test:**
- [ ] Click "Create Invoice"
- [ ] Select client/matter
- [ ] Add time entries to invoice
- [ ] Add line items manually
- [ ] Calculate totals (subtotal + VAT)
- [ ] Preview invoice
- [ ] Generate PDF
- [ ] Download PDF
- [ ] Mark as Sent
- [ ] Mark as Paid
- [ ] View invoice history

**Check:**
- ✅ Math correct (subtotals, VAT, total)
- ✅ PDF generates without errors
- ✅ PDF looks professional
- ✅ Can email invoice (if implemented)
- ✅ Payment tracking works
- ✅ Outstanding balance correct

---

### PHASE 8: TRUST ACCOUNTING (15 min)

**Navigate to:** `/trust-accounting`

**Test:**
- [ ] View trust account balance
- [ ] Add deposit
- [ ] Add withdrawal
- [ ] Transfer between accounts
- [ ] Run 3-way reconciliation
- [ ] View transaction ledger
- [ ] Filter by date/client/type
- [ ] Export transactions

**Check:**
- ✅ Balance calculations accurate
- ✅ Reconciliation math correct
- ✅ Audit trail complete
- ✅ Can't overdraw account
- ✅ Compliance features work

---

### PHASE 9: DOCUMENTS (10 min)

**Navigate to:** `/documents`

**Test:**
- [ ] Upload document (PDF, Word, etc.)
- [ ] Attach to case/matter
- [ ] Add tags/categories
- [ ] Download document
- [ ] View chain-of-custody log
- [ ] Share document (if implemented)
- [ ] Delete document

**Check:**
- ✅ Upload works (drag-drop or browse)
- ✅ File preview works
- ✅ Download preserves original
- ✅ Storage quota tracked
- ✅ Chain-of-custody logged

---

### PHASE 10: AUDIT LOGS (10 min)

**Navigate to:** `/settings/audit-logs`

**Test (Admin/Owner only):**
- [ ] View all organization activity
- [ ] See logged actions (create, update, delete)
- [ ] Filter by action type
- [ ] Filter by entity type
- [ ] Search by keyword
- [ ] Export to CSV
- [ ] Download export
- [ ] Open CSV in Excel

**Check:**
- ✅ All actions logged correctly
- ✅ Timestamps accurate
- ✅ IP addresses captured
- ✅ User IDs correct
- ✅ Before/after changes shown
- ✅ CSV export complete

---

### PHASE 11: CONFLICTS CHECKING (10 min)

**Navigate to:** `/conflicts`

**Test:**
- [ ] Run conflict check for new client
- [ ] Enter: Client name, opposing party
- [ ] See results (conflicts found/none)
- [ ] Add to watch list
- [ ] View conflict reports
- [ ] Mark conflict as cleared

**Check:**
- ✅ Search works across cases
- ✅ Matches found correctly
- ✅ False positives minimal
- ✅ Can override with reason
- ✅ Audit logged

---

### PHASE 12: DEADLINES (10 min)

**Navigate to:** `/deadlines`

**Test:**
- [ ] Add new deadline
- [ ] Link to case/matter
- [ ] Set date + time
- [ ] Set reminder (1 day before)
- [ ] View calendar view
- [ ] View list view
- [ ] Filter by upcoming/overdue
- [ ] Mark as complete

**Check:**
- ✅ Calendar displays correctly
- ✅ Reminders sent (email/notification)
- ✅ Overdue highlighted
- ✅ Completed deadlines hidden/archived
- ✅ Can export to Google Calendar/Outlook

---

### PHASE 13: REPORTS (10 min)

**Navigate to:** `/reports`

**Test:**
- [ ] Generate matter profitability report
- [ ] Generate time & billing report
- [ ] Generate client revenue report
- [ ] Select date range
- [ ] Export to PDF
- [ ] Export to Excel
- [ ] Print report

**Check:**
- ✅ Data accurate
- ✅ Charts render in export
- ✅ PDF professional quality
- ✅ Excel formulas work
- ✅ Can schedule recurring reports

---

## CRITICAL CHECKS

### Performance
- [ ] All pages load in <2 seconds
- [ ] No 500 errors in console
- [ ] No database timeout errors
- [ ] Charts render smoothly
- [ ] Forms submit quickly

### Mobile Responsiveness
- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] All features accessible
- [ ] Forms usable
- [ ] No horizontal scroll

### Browser Compatibility
- [ ] Chrome (desktop)
- [ ] Safari (desktop/mobile)
- [ ] Firefox (desktop)
- [ ] Edge (desktop)

### Security
- [ ] Can't access other org's data
- [ ] Logout works
- [ ] Session timeout after 30 min (if implemented)
- [ ] Password requirements enforced
- [ ] Audit logs can't be deleted

---

## BUGS TO LOG

**Format:**
```
Page: [page name]
Action: [what you did]
Expected: [what should happen]
Actual: [what happened]
Browser: [Chrome/Safari/etc]
Screenshot: [if applicable]
```

**Example:**
```
Page: /invoices
Action: Clicked "Generate PDF"
Expected: PDF downloads
Actual: 500 error in console
Browser: Chrome 120
```

---

## SUCCESS CRITERIA

**To consider deployment successful:**
- [ ] All 13 phases completed without critical errors
- [ ] No data loss or corruption
- [ ] Multi-tenancy working (can't see other orgs)
- [ ] Audit logging captures all actions
- [ ] Dashboard displays real data (not just mock)
- [ ] Can complete full workflow: Create case → Log time → Generate invoice → Mark paid
- [ ] Mobile experience acceptable
- [ ] Performance acceptable (<2s page loads)

---

## POST-TEST ACTIONS

**If successful:**
1. Confirm with Harris: "Ready for lawyer demo ✅"
2. Provide login credentials to lawyer
3. Monitor for first 24 hours
4. Collect feedback

**If issues found:**
1. Log all bugs in checklist format above
2. Prioritize: Critical (blocks workflow) vs Minor (polish)
3. Fix critical bugs first
4. Re-deploy
5. Re-test affected areas

---

## SUPPORT CONTACT

**If you encounter issues:**
- Discord: #lexora-crm-build
- Or message Harris directly

**Have:**
- Screenshot of error
- Page URL
- What you were doing
- Browser + device

---

**Good luck with testing! 🚀**
