# LEXORA PHASE 2 — QUICK WINS CHECKLIST

**These can be completed in 30-60 minutes total**

---

## 🎯 PRIORITY 1: Get System Demo-Ready (30 mins)

### Task 1: Load Demo Data (5 mins) ✅ SQL READY
**File:** `database/DEMO_DATA_SEED.sql`

**What it does:**
- Creates 3 professional clients (UK law firms)
- Creates 3 realistic matters
- Adds 8 billable time entries (£3,500 unbilled)
- Creates 1 invoice (£1,600)
- Populates activity feed

**How:**
1. Open Supabase dashboard
2. Go to SQL Editor
3. Copy/paste contents of DEMO_DATA_SEED.sql
4. Click "Run"
5. Verify: `SELECT COUNT(*) FROM clients WHERE organization_id = '00000000-0000-0000-0000-000000000001'`

### Task 2: Test Login → Dashboard (5 mins)
1. Open http://localhost:3000
2. Login with your test account
3. Check dashboard shows:
   - 3 active cases
   - £3,500 unbilled
   - Activity feed populated
4. Report any console errors

### Task 3: Test Create Matter Flow (10 mins)
1. Click "New Matter"
2. Fill form (select one of 3 clients)
3. Submit
4. Verify appears in dashboard
5. Check database: `SELECT * FROM matters WHERE organization_id = '...' ORDER BY created_at DESC LIMIT 1`

### Task 4: Test Time Entry (5 mins)
1. Open a matter
2. Add time entry
3. Verify saves
4. Check unbilled total increments

### Task 5: Screenshot for Validation (5 mins)
Take screenshots of:
- Dashboard with data
- Matter list
- Matter detail view
- Time entry form

---

## 🔒 PRIORITY 2: Security Lockdown (10 mins)

### Task 6: Block Debug Routes in Production
**Status:** 1/9 routes protected

**Quick Fix:**
```bash
cd /data/.openclaw/workspace/lexora

# Manual approach - edit each file and add at top of GET/POST functions:
# const guard = debugGuard(); if (guard) return guard;

# Files to update:
app/api/debug/minimal-login/route.ts
app/api/debug/full-diagnostic/route.ts
app/api/debug/test-import/route.ts
app/api/debug/login-test/route.ts
app/api/debug/test-bcrypt/route.ts
app/api/debug/test-session-insert/route.ts
app/api/debug/traced-login/route.ts
app/api/debug/simulate-login/route.ts
```

**Pattern to add:**
```typescript
import { debugGuard } from "../middleware";

export async function GET() {
  const guard = debugGuard();
  if (guard) return guard;
  
  // existing code...
}
```

---

## ✨ PRIORITY 3: UX Polish (20 mins)

### Task 7: Check Empty States (5 mins)
**IF demo data not loaded:**
- Does dashboard show helpful empty state?
- Does it have clear CTA ("Create Your First Matter")?
- Or does it show broken/ugly layout?

### Task 8: Mobile Check (5 mins)
1. Open dev tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone 13 (390px width)
4. Navigate: Dashboard → Matters → Matter Detail
5. Note any layout breaks

### Task 9: Console Error Check (5 mins)
1. Open console (F12)
2. Navigate through app
3. Document any errors/warnings
4. Prioritize fixing red errors only

### Task 10: Loading State Check (5 mins)
1. Throttle network to "Slow 3G" in dev tools
2. Navigate between pages
3. Check for:
   - Skeleton loaders (good)
   - Blank screens (bad)
   - Spinners (acceptable)
   - No feedback (bad)

---

## 📊 EXPECTED OUTCOMES

After completing these tasks, you should have:

✅ **System State:**
- Dashboard populated with demo data
- All core flows tested and working
- Debug routes secured

✅ **Documentation:**
- Screenshots of working app
- List of any bugs/issues found
- Console errors documented

✅ **Confidence:**
- Ready to show to Sabrina or first tester
- Know what works vs what doesn't
- Clear priority bug list

---

## 🚨 IF SOMETHING BREAKS

**Don't panic. Document it.**

For each issue:
1. What you did
2. What you expected
3. What actually happened
4. Console error (if any)
5. Screenshot (if visual)

Send to me and I'll fix it.

---

## 📈 SUCCESS METRICS

After these quick wins:
- **Demo Readiness:** 4/10 → 8/10
- **Confidence Level:** 60% → 85%
- **Time to Demo:** From "not ready" to "15 mins away"

Total time investment: **30-60 minutes**  
Return: **Production-ready demo system**

---

**Next Phase:** After these are done, we tackle:
- Killer features validation
- Full UX polish pass
- Performance optimization
- First user testing

But FIRST: Get the core system provably working.
