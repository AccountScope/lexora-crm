# LEXORA MANUAL SECURITY TEST PROTOCOL

**Critical:** Execute ALL tests before production launch  
**Tester:** Human with access to running application  
**Duration:** 60 minutes  
**Failure Tolerance:** ZERO

---

## TEST SETUP

### Create Two Organizations

**Organization A:**
- Email: `tester-a@example.com`
- Password: `SecurePass123!`
- Organization: `Law Firm Alpha`

**Organization B:**
- Email: `tester-b@example.com`
- Password: `SecurePass123!`
- Organization: `Law Firm Beta`

---

## PHASE 1: CREATE TEST DATA (User A)

**Login as:** `tester-a@example.com`

### Step 1.1: Create Client
- Name: `CONFIDENTIAL Client Alpha`
- Email: `alpha-client@example.com`
- **Record ID:** _____________________

### Step 1.2: Create Matter
- Title: `SENSITIVE Alpha Legal Matter`
- Client: (select client from 1.1)
- Matter Number: `ALPHA-001`
- **Record ID:** _____________________

### Step 1.3: Upload Document
- File: Any PDF
- Name: `CONFIDENTIAL_ALPHA_DOC.pdf`
- Link to matter from 1.2
- **Record ID:** _____________________

### Step 1.4: Create Time Entry
- Matter: (from 1.2)
- Hours: 5.0
- Description: `CONFIDENTIAL Alpha billable work`
- **Record ID:** _____________________

### Step 1.5: Generate Invoice
- Matter: (from 1.2)
- Amount: £1000
- **Record ID:** _____________________

**Expected:** All created successfully, visible in Org A

---

## PHASE 2: CROSS-TENANT SEARCH TEST (User B)

**Login as:** `tester-b@example.com`

### Test 2.1: Global Search for Org A Data
**Action:** Press CMD+K (or CTRL+K)

**Search Terms:**
1. "CONFIDENTIAL"
2. "Alpha"
3. "ALPHA-001"
4. "alpha-client@example.com"

**Expected Result:** ✅ ZERO results from Org A  
**Actual Result:** _____________________  
**PASS/FAIL:** _____________________

### Test 2.2: API Search Endpoint
**Action:** Open browser DevTools → Network tab

**Execute Search:** Type "CONFIDENTIAL" in search

**Inspect API Response:**
```
GET /api/search?term=CONFIDENTIAL
```

**Expected:** Empty results OR only Org B data  
**Actual:** _____________________  
**PASS/FAIL:** _____________________

---

## PHASE 3: DIRECT URL ACCESS TEST (User B)

**Still logged in as:** `tester-b@example.com`

### Test 3.1: Access Org A Matter via URL
**Action:** Navigate to:
```
/cases/[Matter ID from 1.2]
```

**Expected Result:** 
- ✅ 403 Forbidden OR
- ✅ 404 Not Found OR
- ✅ Redirect to dashboard
- ❌ NEVER: Shows Org A matter data

**Actual Result:** _____________________  
**PASS/FAIL:** _____________________

### Test 3.2: Access Org A Client via URL
**Action:** Navigate to:
```
/clients/[Client ID from 1.1]
```

**Expected:** 403/404/Redirect, NO data  
**Actual:** _____________________  
**PASS/FAIL:** _____________________

### Test 3.3: Access Org A Document via URL
**Action:** Navigate to:
```
/documents/[Document ID from 1.3]
```

**Expected:** 403/404/Redirect, NO download  
**Actual:** _____________________  
**PASS/FAIL:** _____________________

### Test 3.4: Access Org A Invoice via URL
**Action:** Navigate to:
```
/invoices/[Invoice ID from 1.5]
```

**Expected:** 403/404/Redirect, NO data  
**Actual:** _____________________  
**PASS/FAIL:** _____________________

---

## PHASE 4: API DIRECT ACCESS TEST (User B)

**Still logged in as:** `tester-b@example.com`

### Test 4.1: API - Get Org A Matter
**Action:** Open DevTools → Console → Execute:
```javascript
fetch('/api/cases/[Matter ID from 1.2]', {
  headers: {
    'Authorization': 'Bearer ' + document.cookie
  }
}).then(r => r.json()).then(console.log)
```

**Expected:** 403 OR empty/error  
**Actual:** _____________________  
**PASS/FAIL:** _____________________

### Test 4.2: API - List All Matters
**Action:** DevTools Console:
```javascript
fetch('/api/cases?pageSize=100', {
  headers: {
    'Authorization': 'Bearer ' + document.cookie
  }
}).then(r => r.json()).then(console.log)
```

**Expected:** Only Org B matters (or empty)  
**Actual Count:** _____________________  
**Contains Org A Data:** YES / NO  
**PASS/FAIL:** _____________________

### Test 4.3: API - Search All Documents
**Action:** DevTools Console:
```javascript
fetch('/api/documents?search=CONFIDENTIAL', {
  headers: {
    'Authorization': 'Bearer ' + document.cookie
  }
}).then(r => r.json()).then(console.log)
```

**Expected:** Zero Org A documents  
**Actual:** _____________________  
**PASS/FAIL:** _____________________

### Test 4.4: API - List All Invoices
**Action:** DevTools Console:
```javascript
fetch('/api/invoices?limit=100', {
  headers: {
    'Authorization': 'Bearer ' + document.cookie
  }
}).then(r => r.json()).then(console.log)
```

**Expected:** Zero Org A invoices  
**Actual:** _____________________  
**PASS/FAIL:** _____________________

### Test 4.5: API - List All Time Entries
**Action:** DevTools Console:
```javascript
fetch('/api/time-entries?limit=100', {
  headers: {
    'Authorization': 'Bearer ' + document.cookie
  }
}).then(r => r.json()).then(console.log)
```

**Expected:** Zero Org A time entries  
**Actual:** _____________________  
**PASS/FAIL:** _____________________

---

## PHASE 5: METADATA LEAKAGE TEST (User B)

**Still logged in as:** `tester-b@example.com`

### Test 5.1: Dashboard Metrics
**Action:** View Dashboard

**Check Metrics:**
- Active matters count
- Total clients count
- Total revenue
- Unbilled amount

**Expected:** Should reflect ONLY Org B data  
**Actual:** _____________________  
**Suspicious Numbers:** YES / NO  
**PASS/FAIL:** _____________________

### Test 5.2: Search Results Count
**Action:** Search for "test"

**Check:** Do result counts include Org A data?

**Expected:** Count matches visible results  
**Actual:** _____________________  
**PASS/FAIL:** _____________________

---

## PHASE 6: RAPID REQUEST ABUSE TEST

### Test 6.1: Search Spam
**Action:** Execute rapid searches (10+ per second)

**Method:** DevTools Console:
```javascript
for(let i=0; i<100; i++) {
  fetch('/api/search?term=test' + i);
}
```

**Expected:** 
- No crash
- No timeout errors
- No cross-tenant data leakage
- Rate limiting active (optional)

**Actual:** _____________________  
**PASS/FAIL:** _____________________

### Test 6.2: Double Submit Test
**Action:** 
1. Start creating a matter
2. Click "Create Matter" button rapidly (5+ times)

**Expected:** Only 1 matter created  
**Actual Matters Created:** _____________________  
**PASS/FAIL:** _____________________

---

## PHASE 7: OPTIMISTIC UI ROLLBACK TEST

### Test 7.1: Network Failure Simulation
**Action:**
1. Open DevTools → Network → Enable "Offline"
2. Try to create a matter
3. Re-enable network

**Expected:** 
- Optimistic insert shows temporarily
- Rolls back when network fails
- Error message displayed
- No duplicate after reconnect

**Actual:** _____________________  
**PASS/FAIL:** _____________________

---

## PHASE 8: CACHE STALENESS TEST

### Test 8.1: Stale Data After Logout
**Action:**
1. Login as User A
2. View matters list
3. Logout
4. Login as User B immediately

**Expected:** User B sees ONLY Org B data  
**Actual:** _____________________  
**Org A Data Visible:** YES / NO  
**PASS/FAIL:** _____________________

---

## FINAL RESULTS SUMMARY

### Critical Tests (Must Pass 100%)

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| Global Search (2.1) | | |
| API Search (2.2) | | |
| URL Matter Access (3.1) | | |
| URL Client Access (3.2) | | |
| URL Document Access (3.3) | | |
| URL Invoice Access (3.4) | | |
| API Matter Access (4.1) | | |
| API Matters List (4.2) | | |
| API Documents List (4.3) | | |
| API Invoices List (4.4) | | |
| API Time Entries List (4.5) | | |

**Total Critical Passed:** ____ / 11  
**Pass Rate:** _____%

### Important Tests (Should Pass)

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| Dashboard Metrics (5.1) | | |
| Search Count (5.2) | | |
| Search Spam (6.1) | | |
| Double Submit (6.2) | | |
| Network Failure (7.1) | | |
| Cache Staleness (8.1) | | |

**Total Important Passed:** ____ / 6

---

## FINAL VERDICT

**Critical Pass Rate:** _____%  
**Overall Pass Rate:** _____%

**Decision:**
- [ ] ✅ PRODUCTION READY (100% critical passed)
- [ ] ⚠️ READY WITH FIXES (90-99% passed)
- [ ] ❌ NOT READY (<90% passed)

**Notes:**
_______________________________________
_______________________________________
_______________________________________

**Tester Signature:** _________________  
**Date:** _________________

---

## FAILURE PROTOCOL

**If ANY critical test fails:**

1. **STOP** - Do not proceed to production
2. **Document** exact failure (screenshot + logs)
3. **Report** to development team immediately
4. **Re-test** after fix applied
5. **Re-run** full protocol from start

**Zero tolerance for cross-tenant leakage.**
