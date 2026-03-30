# LEXORA ENTERPRISE SECURITY TEST PROTOCOL - ATTACK SIMULATION

**Classification:** CONFIDENTIAL - SECURITY VALIDATION  
**Tester:** Human Security Auditor Required  
**Duration:** 90 minutes  
**Failure Tolerance:** ZERO for critical tests  
**Standard:** Enterprise Legal SaaS Security

---

## 🎯 OBJECTIVE

Prove LEXORA is secure under **adversarial conditions**, not just happy-path usage.

**Threat Model:**
- Malicious authenticated user attempting cross-tenant access
- Attacker enumerating IDs to discover resources
- User attempting to bypass organization scoping
- Aggressive pagination/query abuse
- File access bypass attempts
- Response-shape analysis for information leakage

**Success Criteria:** 100% of CRITICAL tests pass

---

## 📋 TEST SETUP

### Organization A (Victim)
- Email: `victim-org@example.com`
- Password: `VictimPass123!`
- Organization: `Victim Law Firm`

### Organization B (Attacker)
- Email: `attacker-org@example.com`
- Password: `AttackerPass123!`
- Organization: `Attacker Firm`

---

## PHASE 1: CREATE VICTIM DATA (Org A)

**Login as:** `victim-org@example.com`

### Step 1.1: Create Confidential Client
- Name: `HIGHLY CONFIDENTIAL - VictimCorp`
- Email: `victim-confidential@example.com`
- **Record Client ID:** `___________________________`

### Step 1.2: Create Sensitive Matter
- Title: `SENSITIVE - VictimCorp Trade Secret Litigation`
- Client: (from 1.1)
- Matter Number: `VICTIM-SECRET-001`
- **Record Matter ID:** `___________________________`

### Step 1.3: Upload Confidential Document
- File: Any PDF (rename to `CONFIDENTIAL_TRADE_SECRET.pdf`)
- Link to matter from 1.2
- **Record Document ID:** `___________________________`
- **Record Storage URL (if visible):** `___________________________`

### Step 1.4: Create Billable Time Entry
- Matter: (from 1.2)
- Hours: 10.0
- Rate: £500/hr
- Description: `CONFIDENTIAL: Trade secret analysis`
- **Record Time Entry ID:** `___________________________`

### Step 1.5: Generate Invoice
- Matter: (from 1.2)
- Amount: £5,000
- **Record Invoice ID:** `___________________________`

**Expected:** All created successfully in Org A

---

## PHASE 2: ID ENUMERATION ATTACK (Org B)

**Login as:** `attacker-org@example.com`

### Test 2.1: Direct Matter ID Access
**Action:** Navigate to:
```
/cases/[Victim Matter ID]
```

**Expected Behavior:** ✅ ONE OF:
- 403 Forbidden
- 404 Not Found
- Redirect to dashboard
- Generic error page

**❌ FAIL IF:**
- Shows any Victim matter data
- Shows matter exists but "access denied"
- Different error than fake ID

**Actual Result:** `___________________________`  
**Error Message:** `___________________________`  
**PASS/FAIL:** `___________________________`

### Test 2.2: Compare Real vs Fake ID Response
**Action A:** Navigate to:
```
/cases/[Victim Matter ID]
```

**Action B:** Navigate to:
```
/cases/00000000-0000-0000-0000-000000000000
```

**Expected:** IDENTICAL error response (same status, message, timing)

**Comparison:**
- Status Code A: `_______` vs B: `_______`
- Error Message A: `___________________________`
- Error Message B: `___________________________`
- Response Time A: `_______ms` vs B: `_______ms`

**❌ FAIL IF:** Any difference reveals existence

**PASS/FAIL:** `___________________________`

### Test 2.3: Sequential ID Enumeration
**Action:** Try multiple sequential/similar IDs:
```
/cases/[Victim-ID]
/cases/[Victim-ID with last char changed]
/cases/[Victim-ID with last digit +1]
```

**Expected:** All return identical safe error

**Results:**
- ID 1: `___________________________`
- ID 2: `___________________________`
- ID 3: `___________________________`

**❌ FAIL IF:** Different responses reveal valid ID pattern

**PASS/FAIL:** `___________________________`

---

## PHASE 3: API ENUMERATION ATTACK (Org B)

**Still logged in as:** `attacker-org@example.com`

### Test 3.1: API - Direct Matter Fetch
**Action:** DevTools Console:
```javascript
fetch('/api/cases/' + '[Victim Matter ID]')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** 403 OR 404, no data

**Actual Status:** `_______`  
**Response Body:** `___________________________`  
**Contains Victim Data:** YES / NO  
**PASS/FAIL:** `___________________________`

### Test 3.2: API - Compare Real vs Fake
**Action:** DevTools Console:
```javascript
// Real ID from Victim org
fetch('/api/cases/' + '[Victim Matter ID]')
  .then(r => ({ status: r.status, data: r.json() }))
  .then(console.log)

// Fake ID
fetch('/api/cases/00000000-0000-0000-0000-000000000000')
  .then(r => ({ status: r.status, data: r.json() }))
  .then(console.log)
```

**Expected:** Identical responses

**Real ID Response:** `___________________________`  
**Fake ID Response:** `___________________________`  
**Difference Found:** YES / NO  
**PASS/FAIL:** `___________________________`

### Test 3.3: API - Client Enumeration
**Action:** DevTools Console:
```javascript
fetch('/api/clients/' + '[Victim Client ID]')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** 403/404, no data

**Actual:** `___________________________`  
**PASS/FAIL:** `___________________________`

### Test 3.4: API - Document Enumeration
**Action:** DevTools Console:
```javascript
fetch('/api/documents/' + '[Victim Document ID]')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** 403/404, no data, no download

**Actual:** `___________________________`  
**PASS/FAIL:** `___________________________`

### Test 3.5: API - Invoice Enumeration
**Action:** DevTools Console:
```javascript
fetch('/api/invoices/' + '[Victim Invoice ID]')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** 403/404, no data

**Actual:** `___________________________`  
**PASS/FAIL:** `___________________________`

---

## PHASE 4: RESPONSE-SHAPE LEAKAGE (Org B)

### Test 4.1: Error Message Consistency
**Action:** Compare error messages for:
1. Valid Victim ID
2. Fake UUID
3. Malformed ID ("not-a-uuid")
4. Empty string

**Expected:** All return safe, generic errors (no stack traces, no database errors, no internal paths)

**Results:**
- Victim ID: `___________________________`
- Fake UUID: `___________________________`
- Malformed: `___________________________`
- Empty: `___________________________`

**❌ FAIL IF:**
- Stack trace visible
- Database error visible
- Different message structure reveals existence

**PASS/FAIL:** `___________________________`

### Test 4.2: Response Timing Analysis
**Action:** Measure response time for:
1. Valid own-org matter
2. Valid victim-org matter (unauthorized)
3. Fake UUID

**Method:** DevTools Network tab, check timing

**Results:**
- Own matter: `_______ms`
- Victim matter: `_______ms`
- Fake ID: `_______ms`

**❌ FAIL IF:** Timing difference >100ms reveals existence

**PASS/FAIL:** `___________________________`

---

## PHASE 5: FILE ACCESS BYPASS ATTACK (Org B)

### Test 5.1: Direct Document URL Access
**Action:** If storage URL was visible in Org A (check 1.3), try accessing it from Org B browser

**Expected:** 
- 403 Forbidden OR
- Signed URL expired/invalid OR
- Document not accessible

**❌ FAIL IF:** Document downloads successfully

**Actual:** `___________________________`  
**PASS/FAIL:** `___________________________`

### Test 5.2: Document Download Endpoint
**Action:** Try downloading via API:
```javascript
fetch('/api/documents/' + '[Victim Doc ID]' + '/download')
  .then(r => r.blob())
  .then(blob => console.log(blob.size))
```

**Expected:** 403/404, no file

**Actual:** `___________________________`  
**File Downloaded:** YES / NO  
**PASS/FAIL:** `___________________________`

### Test 5.3: Storage Path Guessing
**Action:** If storage uses predictable paths, try accessing:
```
/storage/documents/[victim-doc-id].pdf
/uploads/[victim-doc-id]
```

**Expected:** All fail (403 or not found)

**Actual:** `___________________________`  
**PASS/FAIL:** `___________________________`

---

## PHASE 6: QUERY MANIPULATION ATTACK (Org B)

### Test 6.1: Organization ID Override Attempt
**Action:** DevTools Console:
```javascript
fetch('/api/cases?organizationId=[Victim Org ID]')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** Ignores parameter, returns only Attacker org matters

**Actual Count:** `_______`  
**Contains Victim Data:** YES / NO  
**PASS/FAIL:** `___________________________`

### Test 6.2: Foreign Client ID Filter
**Action:** DevTools Console:
```javascript
fetch('/api/cases?clientId=[Victim Client ID]')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** Empty results (foreign client filtered out)

**Actual:** `___________________________`  
**Shows Victim Matter:** YES / NO  
**PASS/FAIL:** `___________________________`

### Test 6.3: Foreign Matter ID in Time Entries
**Action:** DevTools Console:
```javascript
fetch('/api/time-entries?matterId=[Victim Matter ID]')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** Empty results

**Actual:** `___________________________`  
**Shows Victim Time Entries:** YES / NO  
**PASS/FAIL:** `___________________________`

---

## PHASE 7: PAGINATION ABUSE (Org B)

### Test 7.1: Oversized Limit Attempt
**Action:** DevTools Console:
```javascript
fetch('/api/cases?limit=999999')
  .then(r => r.json())
  .then(data => console.log('Count:', data.length || data.data?.length))
```

**Expected:** Capped to reasonable limit (≤200)

**Actual Count:** `_______`  
**Cap Applied:** YES / NO  
**PASS/FAIL:** `___________________________`

### Test 7.2: Negative Offset Attempt
**Action:** DevTools Console:
```javascript
fetch('/api/cases?offset=-100&limit=50')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** Safe error OR treats as 0

**Actual:** `___________________________`  
**Crash/Error:** YES / NO  
**PASS/FAIL:** `___________________________`

### Test 7.3: Extreme Page Number
**Action:** DevTools Console:
```javascript
fetch('/api/cases?page=999999&pageSize=100')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** Empty results, no error

**Actual:** `___________________________`  
**Safe Behavior:** YES / NO  
**PASS/FAIL:** `___________________________`

---

## PHASE 8: SEARCH ABUSE (Org B)

### Test 8.1: Cross-Tenant Search for Victim Data
**Action:** Press CMD+K, search for:
- "HIGHLY CONFIDENTIAL"
- "VictimCorp"
- "VICTIM-SECRET-001"
- "Trade Secret"

**Expected:** ZERO results from Victim org

**Results:** `___________________________`  
**Victim Data Visible:** YES / NO  
**PASS/FAIL:** `___________________________`

### Test 8.2: Search Result Limit Validation
**Action:** Search for common term (e.g., "test")

**Check:** Result count per entity type

**Results:**
- Matters: `_______` (max should be ≤20)
- Clients: `_______` (max should be ≤20)
- Documents: `_______` (max should be ≤20)

**❌ FAIL IF:** Any type shows >50 results

**PASS/FAIL:** `___________________________`

### Test 8.3: Search Spam/Abuse
**Action:** DevTools Console:
```javascript
for(let i=0; i<50; i++) {
  fetch('/api/search?term=attack' + i);
}
```

**Expected:**
- No crash
- Rate limiting (optional)
- No cross-tenant leakage

**Actual:** `___________________________`  
**System Crashed:** YES / NO  
**PASS/FAIL:** `___________________________`

### Test 8.4: Metadata Count Leakage
**Action:** Search for "test", inspect response

**Check:** Does response include total counts across all orgs?

**Response Structure:** `___________________________`  
**Total Counts Visible:** YES / NO  
**❌ FAIL IF:** Totals include other orgs

**PASS/FAIL:** `___________________________`

---

## PHASE 9: CACHE/SESSION LEAKAGE (Auth Transitions)

### Test 9.1: Logout → Login Stale Data
**Action:**
1. Login as Victim org
2. View matters list (note count)
3. Logout
4. Login as Attacker org IMMEDIATELY
5. View matters list

**Expected:** Attacker org data ONLY, no stale Victim data

**Victim Matter Count:** `_______`  
**Attacker Matter Count:** `_______`  
**Stale Data Visible:** YES / NO  
**PASS/FAIL:** `___________________________`

### Test 9.2: Search Modal Stale Results
**Action:**
1. Login as Victim org
2. Search for "confidential" (should show results)
3. Logout
4. Login as Attacker org
5. Open search modal (CMD+K)

**Expected:** Empty state or Attacker org results only

**Stale Victim Results Visible:** YES / NO  
**PASS/FAIL:** `___________________________`

### Test 9.3: Dashboard Stale Metrics
**Action:**
1. Login as Victim org (note revenue metric)
2. Logout
3. Login as Attacker org
4. Check dashboard metrics

**Expected:** Attacker org metrics only

**Victim Revenue Visible:** YES / NO  
**Stale Metrics:** YES / NO  
**PASS/FAIL:** `___________________________`

---

## PHASE 10: OPTIMISTIC UI ABUSE

### Test 10.1: Double Submit Spam
**Action:**
1. Start creating a matter
2. Fill form
3. Click "Create" button 10 times rapidly

**Expected:** Only 1 matter created

**Matters Created:** `_______`  
**PASS/FAIL:** `___________________________`

### Test 10.2: Network Failure Mid-Optimistic
**Action:**
1. DevTools → Network → Throttle to "Offline"
2. Try creating a matter (will appear optimistically)
3. Re-enable network
4. Refresh page

**Expected:**
- Optimistic item disappears
- Error message shown
- No duplicate after refresh

**Actual:** `___________________________`  
**Duplicate Created:** YES / NO  
**PASS/FAIL:** `___________________________`

---

## PHASE 11: EDGE-CASE ATTACKS

### Test 11.1: Malformed UUID Attack
**Action:** Navigate to:
```
/cases/not-a-uuid-at-all
/cases/<script>alert('xss')</script>
/cases/../../../etc/passwd
```

**Expected:** Safe error, no crash, no XSS, no path traversal

**Results:** `___________________________`  
**Safe Handling:** YES / NO  
**PASS/FAIL:** `___________________________`

### Test 11.2: SQL Injection Attempt (Conceptual)
**Action:** DevTools Console:
```javascript
fetch("/api/search?term=' OR '1'='1")
  .then(r => r.json())
  .then(console.log)
```

**Expected:** Treated as literal search term, no SQL execution

**Actual:** `___________________________`  
**Database Error Visible:** YES / NO  
**PASS/FAIL:** `___________________________`

### Test 11.3: Large Payload Attack
**Action:** Try creating matter with extremely long fields:
- Title: 10,000 characters
- Description: 50,000 characters

**Expected:** Validation error OR truncation, no crash

**Actual:** `___________________________`  
**Server Crashed:** YES / NO  
**PASS/FAIL:** `___________________________`

---

## FINAL RESULTS MATRIX

### CRITICAL TESTS (Must Pass 100%)

| Test | Category | Pass/Fail | Severity |
|------|----------|-----------|----------|
| 2.1 | ID Enum | | CRITICAL |
| 2.2 | ID Enum | | CRITICAL |
| 3.1 | API Enum | | CRITICAL |
| 3.2 | API Enum | | CRITICAL |
| 3.3 | API Enum | | CRITICAL |
| 3.4 | API Enum | | CRITICAL |
| 3.5 | API Enum | | CRITICAL |
| 5.1 | File Access | | CRITICAL |
| 5.2 | File Access | | CRITICAL |
| 6.1 | Query Manip | | CRITICAL |
| 6.2 | Query Manip | | CRITICAL |
| 6.3 | Query Manip | | CRITICAL |
| 8.1 | Search | | CRITICAL |
| 9.1 | Cache Leak | | CRITICAL |

**Critical Pass Rate:** `_____` / 14 = `_____%`

### HIGH PRIORITY TESTS

| Test | Category | Pass/Fail | Severity |
|------|----------|-----------|----------|
| 2.3 | ID Enum | | HIGH |
| 4.1 | Response Leak | | HIGH |
| 4.2 | Timing Leak | | HIGH |
| 5.3 | File Access | | HIGH |
| 7.1 | Pagination | | HIGH |
| 7.2 | Pagination | | HIGH |
| 8.2 | Search | | HIGH |
| 8.3 | Search | | HIGH |
| 8.4 | Search | | HIGH |
| 9.2 | Cache Leak | | HIGH |
| 10.1 | Optimistic UI | | HIGH |

**High Priority Pass Rate:** `_____` / 11 = `_____%`

### MEDIUM PRIORITY TESTS

| Test | Category | Pass/Fail | Severity |
|------|----------|-----------|----------|
| 7.3 | Pagination | | MEDIUM |
| 9.3 | Cache Leak | | MEDIUM |
| 10.2 | Optimistic UI | | MEDIUM |
| 11.1 | Edge Case | | MEDIUM |
| 11.2 | Edge Case | | MEDIUM |
| 11.3 | Edge Case | | MEDIUM |

**Medium Priority Pass Rate:** `_____` / 6 = `_____%`

---

## OVERALL ASSESSMENT

**Total Tests:** 31  
**Critical Pass Rate:** `_____%` (must be 100%)  
**Overall Pass Rate:** `_____%`

**FINAL VERDICT:**
- [ ] ✅ PRODUCTION READY (100% critical, 95%+ overall)
- [ ] ⚠️ READY WITH FIXES (90-99% critical)
- [ ] ❌ NOT READY (<90% critical)

**Notes:**
`___________________________________________________________________________`
`___________________________________________________________________________`
`___________________________________________________________________________`

**Tester:** `_______________________`  
**Date:** `_______________________`  
**Signature:** `_______________________`

---

## FAILURE PROTOCOL

**If ANY critical test fails:**

1. **STOP IMMEDIATELY**
2. Document exact failure with screenshots
3. DO NOT PROCEED TO PRODUCTION
4. Report to security team
5. Fix vulnerability
6. RE-RUN FULL PROTOCOL from start

**Zero tolerance for:**
- Cross-tenant data leakage
- ID enumeration success
- File access bypass
- Query manipulation success
- Cache/session leakage

---

## APPENDIX: ATTACK SCENARIOS COVERED

This protocol validates resistance to:

✅ Horizontal privilege escalation (cross-tenant)  
✅ ID enumeration attacks  
✅ Response-shape information leakage  
✅ Direct object reference attacks  
✅ File access bypass  
✅ Query parameter manipulation  
✅ Pagination abuse  
✅ Search data mining  
✅ Cache poisoning  
✅ Session leakage  
✅ Timing attacks  
✅ Double-submit race conditions  
✅ Optimistic UI exploitation  
✅ SQL injection (conceptual)  
✅ XSS via IDs (conceptual)  
✅ Path traversal (conceptual)  
✅ DoS via large payloads  

**This is enterprise-grade security validation.**

---

**LEXORA must pass this protocol before handling real legal data.**
