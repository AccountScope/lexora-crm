# SECURITY INCIDENT REPORT TEMPLATE

**Use this template for ANY failed security test**

---

## INCIDENT #[NUMBER]

**Date:** [YYYY-MM-DD HH:MM UTC]  
**Severity:** 🔴 CRITICAL / 🟠 HIGH / 🟡 MEDIUM / 🟢 LOW  
**Test ID:** [e.g., API-3.1]  
**Status:** 🚨 ACTIVE / ✅ FIXED / ⏳ IN PROGRESS

---

## VULNERABILITY SUMMARY

**Title:** [Brief description, e.g., "Cross-Tenant Matter Access via API"]

**Category:**
- [ ] Cross-Tenant Data Leakage
- [ ] ID Enumeration
- [ ] File Access Bypass
- [ ] Query Manipulation
- [ ] Response Leakage
- [ ] Cache/Session Issue
- [ ] Other: _____________

**Affected Endpoints:**
- [e.g., `/api/cases/[matterId]`]
- [...]

---

## ATTACK DESCRIPTION

**Attack Method:**
```
[Exact attack payload/method used]
```

**Reproduction Steps:**
1. [Step 1]
2. [Step 2]
3. [...]

**User Context:**
- Attacker Org: [Org ID/Name]
- Victim Org: [Org ID/Name]
- Attacker User: [User ID/Email]
- Victim Data Targeted: [Resource ID]

---

## EXPECTED BEHAVIOR

**What SHOULD happen:**
[Describe safe, expected behavior]

**Example:**
- Status: 403 Forbidden
- Response: `{ "error": "Matter not found" }`
- Data Visible: None

---

## ACTUAL BEHAVIOR

**What ACTUALLY happened:**
[Describe what occurred]

**Example:**
- Status: 200 OK
- Response: `{ "id": "victim-matter-id", "title": "CONFIDENTIAL Matter" }`
- Data Visible: Full matter details from Victim org

---

## EVIDENCE

**Screenshots:**
[Attach or reference screenshot files]

**Console Logs:**
```
[Paste relevant console output]
```

**Network Response:**
```json
[Paste response body]
```

**Timing Data:**
[If applicable]

---

## RISK ASSESSMENT

**What an attacker can do:**
[Explain real-world impact]

**Example:**
- Enumerate all matter IDs in system
- Access confidential legal data from competitor firms
- Download sensitive documents without authorization

**Data Exposure:**
- [ ] Client Names
- [ ] Matter Titles
- [ ] Financial Data
- [ ] Documents
- [ ] Other: _____________

**Exploitation Difficulty:**
- [ ] Trivial (no skill required)
- [ ] Easy (basic HTTP knowledge)
- [ ] Moderate (requires some skill)
- [ ] Difficult (requires advanced techniques)

---

## RECOMMENDED FIX

**Immediate Actions:**
[What must be done NOW]

**Code Changes Required:**
[Specific code fixes needed]

**Example:**
```typescript
// BEFORE (VULNERABLE)
export async function GET(request, { params }) {
  const data = await getCaseById(params.matterId);
  return success({ data });
}

// AFTER (SECURE)
export async function GET(request, { params }) {
  const user = await requireUser(request);
  const context = await getOrganizationContext(user.id);
  const data = await getCaseById(context.organizationId, params.matterId);
  return success({ data });
}
```

**Testing Required:**
[How to verify fix]

---

## TIMELINE

| Time | Event |
|------|-------|
| [HH:MM] | Vulnerability discovered |
| [HH:MM] | Incident reported |
| [HH:MM] | Fix applied |
| [HH:MM] | Re-tested |
| [HH:MM] | Verified fixed |

---

## RE-TEST RESULTS

**After Fix Applied:**
- Test ID: [e.g., API-3.1-RETEST]
- Status: ✅ PASSED / ❌ FAILED
- Evidence: [Screenshot/log]

---

## LAUNCH IMPACT

**Is this a launch blocker?**
- [ ] YES - CRITICAL, must fix before launch
- [ ] NO - Can launch with mitigation

**If launch blocker:**
- Production launch: BLOCKED
- Fix required before: [Date/Time]
- Re-test required before: [Date/Time]

---

## SIGN-OFF

**Reported By:** [Name]  
**Date:** [YYYY-MM-DD]

**Fixed By:** [Name]  
**Date:** [YYYY-MM-DD]

**Verified By:** [Name]  
**Date:** [YYYY-MM-DD]

---

**INCIDENT STATUS: [ACTIVE/FIXED/VERIFIED]**
