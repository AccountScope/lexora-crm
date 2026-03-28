# Trust Accounting System - Test Plan 🧪

## Test Environment Setup

### Prerequisites:
- ✅ Database migration `019_trust_accounting.sql` executed
- ✅ At least 3 test clients created
- ✅ Test user authenticated
- ✅ Development environment running

---

## Test Cases

### ✅ TC-001: Create Trust Account

**Steps:**
1. Navigate to `/trust-accounting/accounts`
2. Click "Add Trust Account"
3. Fill form:
   - Name: "Test Trust Account"
   - Bank: "Test Bank"
   - Last 4: "1234"
   - Type: Checking
   - Opening Balance: 0
   - Opening Date: Today
4. Submit

**Expected Result:**
- ✅ Account created successfully
- ✅ Redirected to accounts list
- ✅ New account visible
- ✅ Balance shows $0.00

**Actual Result:** _____________

---

### ✅ TC-002: Make Deposit Transaction

**Steps:**
1. Navigate to `/trust-accounting/transactions/new`
2. Select Type: Deposit
3. Select Client: Client A
4. Amount: 10000.00
5. Description: "Initial retainer deposit"
6. Reference: "Check #1001"
7. Date: Today
8. Submit

**Expected Result:**
- ✅ Transaction created
- ✅ Client ledger auto-created (if first transaction)
- ✅ Trust account balance = $10,000.00
- ✅ Client A ledger balance = $10,000.00
- ✅ Transaction appears in list

**Actual Result:** _____________

---

### ✅ TC-003: Attempt Overdraft (Should Block)

**Setup:** Client B has $0 balance

**Steps:**
1. Create withdrawal transaction
2. Select Client B
3. Amount: 500.00
4. Try to submit

**Expected Result:**
- ❌ Transaction BLOCKED
- ❌ Error message: "Insufficient funds" or "Would create negative balance"
- ❌ Database trigger prevents insertion
- ✅ Client B balance remains $0.00

**Actual Result:** _____________

---

### ✅ TC-004: Valid Withdrawal

**Setup:** Client A has $10,000 balance

**Steps:**
1. Create withdrawal transaction
2. Select Client A
3. Amount: 2500.00
4. Description: "Legal fees per invoice #123"
5. Submit

**Expected Result:**
- ✅ Transaction created
- ✅ Trust account balance = $7,500.00
- ✅ Client A balance = $7,500.00
- ✅ Transaction recorded in ledger

**Actual Result:** _____________

---

### ✅ TC-005: Transfer Between Clients

**Setup:** 
- Client A balance: $7,500
- Client C balance: $0

**Steps:**
1. Create transfer transaction
2. Source: Client A
3. Destination: Client C
4. Amount: 1000.00
5. Description: "Transfer for joint representation"
6. Submit

**Expected Result:**
- ✅ Transaction created
- ✅ Client A balance = $6,500.00 (decreased)
- ✅ Client C balance = $1,000.00 (increased)
- ✅ Trust account balance unchanged ($7,500)

**Actual Result:** _____________

---

### ✅ TC-006: Three-Way Reconciliation (Balanced)

**Setup:** 
- Trust account: $7,500
- Client A: $6,500
- Client C: $1,000
- Sum: $7,500

**Steps:**
1. Navigate to `/trust-accounting/reconciliation`
2. Select trust account
3. Review three-way report

**Expected Result:**
- ✅ Status: BALANCED (green)
- ✅ Trust balance = $7,500
- ✅ Ledger total = $7,500
- ✅ Difference = $0.00
- ✅ Client breakdown correct

**Actual Result:** _____________

---

### ✅ TC-007: Bank Reconciliation (Match)

**Steps:**
1. In reconciliation page
2. Enter bank balance: 7500.00
3. Enter date: End of month
4. Submit

**Expected Result:**
- ✅ Reconciliation created
- ✅ Status: Reconciled
- ✅ No discrepancy
- ✅ Trust account `last_reconciled_at` updated

**Actual Result:** _____________

---

### ✅ TC-008: Bank Reconciliation (Discrepancy)

**Steps:**
1. In reconciliation page
2. Enter bank balance: 7450.00 (intentionally wrong)
3. Submit

**Expected Result:**
- ⚠️ Warning about $50 discrepancy
- ✅ Reconciliation created with status: Discrepancy
- ✅ Compliance alert generated
- ✅ Difference recorded: -$50.00

**Actual Result:** _____________

---

### ✅ TC-009: Large Transaction Alert

**Steps:**
1. Create deposit
2. Amount: 15000.00 (> $10,000)
3. Submit

**Expected Result:**
- ✅ Transaction created
- ✅ Compliance alert generated
- ✅ Alert type: large_transaction
- ✅ Severity: medium

**Actual Result:** _____________

---

### ✅ TC-010: Low Balance Warning

**Steps:**
1. Create withdrawal leaving balance < $500
2. Submit

**Expected Result:**
- ✅ Transaction created
- ✅ Compliance alert generated
- ✅ Alert type: low_balance
- ✅ Severity: low

**Actual Result:** _____________

---

### ✅ TC-011: View Client Ledger Detail

**Steps:**
1. Navigate to `/trust-accounting/ledgers`
2. Click on Client A
3. Review transaction history

**Expected Result:**
- ✅ Current balance displayed correctly
- ✅ All transactions listed
- ✅ Running balance calculated correctly
- ✅ Deposit shown as green (+)
- ✅ Withdrawal shown as red (-)

**Actual Result:** _____________

---

### ✅ TC-012: Export Reports (CSV)

**Steps:**
1. From ledgers page, click Export
2. Open CSV file

**Expected Result:**
- ✅ CSV file downloads
- ✅ Contains all ledger data
- ✅ Proper formatting
- ✅ All columns present

**Actual Result:** _____________

---

### ✅ TC-013: Audit Log Verification

**Steps:**
1. Query `trust_audit_log` table
2. Check recent entries

**Expected Result:**
- ✅ All actions logged
- ✅ User ID captured
- ✅ Timestamp accurate
- ✅ Action type correct
- ✅ New/old values stored

**Actual Result:** _____________

---

### ✅ TC-014: Decimal Precision Test

**Steps:**
1. Create transaction with amount: 123.456
2. Check stored value

**Expected Result:**
- ✅ Stored as: 123.46 (rounded to 2 decimals)
- ✅ No floating-point errors
- ✅ Calculations remain accurate

**Actual Result:** _____________

---

### ✅ TC-015: Transfer to Same Ledger (Should Block)

**Steps:**
1. Create transfer
2. Source: Client A
3. Destination: Client A (same)
4. Try to submit

**Expected Result:**
- ❌ Validation error: "Cannot transfer to same ledger"
- ❌ Transaction not created

**Actual Result:** _____________

---

### ✅ TC-016: Missing Description (Should Block)

**Steps:**
1. Create transaction
2. Leave description empty
3. Try to submit

**Expected Result:**
- ❌ Validation error: "Description required"
- ❌ Transaction not created
- ✅ Compliance enforced

**Actual Result:** _____________

---

### ✅ TC-017: Ledger List Filters

**Steps:**
1. Navigate to `/trust-accounting/ledgers`
2. Search for client name
3. Filter by status (active/closed)

**Expected Result:**
- ✅ Search filters results correctly
- ✅ Status filter works
- ✅ Counts update
- ✅ Results accurate

**Actual Result:** _____________

---

### ✅ TC-018: Transaction List Filters

**Steps:**
1. Navigate to `/trust-accounting/transactions`
2. Filter by type (deposit/withdrawal)
3. Filter by date range

**Expected Result:**
- ✅ Type filter works
- ✅ Date filter works
- ✅ Counts update
- ✅ Export reflects filters

**Actual Result:** _____________

---

### ✅ TC-019: Print Ledger

**Steps:**
1. Open client ledger detail
2. Click Print button
3. Review print preview

**Expected Result:**
- ✅ Print dialog opens
- ✅ Layout print-friendly
- ✅ All data visible
- ✅ Branding/headers present

**Actual Result:** _____________

---

### ✅ TC-020: Database Triggers

**Steps:**
1. Manually insert transaction via SQL
2. Check balances update

**Expected Result:**
- ✅ Trust account balance auto-updated
- ✅ Client ledger balance auto-updated
- ✅ Triggers fire correctly

**SQL Test:**
```sql
-- Check trigger functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%trust%';

-- Expected:
-- update_trust_account_balance
-- update_client_ledger_balance
-- check_negative_balance
```

**Actual Result:** _____________

---

## Integration Tests

### ✅ IT-001: End-to-End Workflow

**Scenario:** Complete trust accounting lifecycle

**Steps:**
1. Create trust account
2. Deposit $50,000 for Client A
3. Deposit $25,000 for Client B
4. Withdraw $10,000 from Client A
5. Transfer $5,000 from Client A to Client B
6. Withdraw $2,000 from Client B
7. Run three-way reconciliation
8. Complete bank reconciliation

**Expected Final State:**
- Trust account: $58,000
- Client A: $35,000
- Client B: $23,000
- Three-way: BALANCED
- Bank recon: MATCHED

**Actual Result:** _____________

---

## Performance Tests

### ✅ PT-001: Large Transaction Volume

**Steps:**
1. Create 1,000 transactions
2. Measure page load time
3. Check query performance

**Expected:**
- ✅ Transaction list loads < 2 seconds
- ✅ Ledger detail loads < 1 second
- ✅ Three-way report generates < 3 seconds

**Actual Result:** _____________

---

## Security Tests

### ✅ ST-001: Unauthorized Access

**Steps:**
1. Log out
2. Try to access `/trust-accounting/accounts`

**Expected:**
- ❌ Redirected to login
- ❌ No data exposed
- ✅ 401 Unauthorized

**Actual Result:** _____________

---

### ✅ ST-002: SQL Injection Test

**Steps:**
1. Enter `'; DROP TABLE trust_accounts; --` in search
2. Submit

**Expected:**
- ✅ Input sanitized
- ✅ No SQL executed
- ✅ Tables intact

**Actual Result:** _____________

---

## Regression Tests

After any code changes, re-run:
- ✅ TC-002 (Deposit)
- ✅ TC-003 (Overdraft block)
- ✅ TC-004 (Withdrawal)
- ✅ TC-006 (Three-way)
- ✅ TC-007 (Bank recon)

---

## Test Summary

| Category | Tests | Passed | Failed | Blocked |
|----------|-------|--------|--------|---------|
| Unit     | 16    | ___    | ___    | ___     |
| Integration | 1  | ___    | ___    | ___     |
| Performance | 1  | ___    | ___    | ___     |
| Security | 2     | ___    | ___    | ___     |
| **Total** | **20** | ___    | ___    | ___     |

---

## Bug Report Template

**Bug ID:** _____________
**Test Case:** _____________
**Severity:** Critical / High / Medium / Low
**Description:** _____________
**Steps to Reproduce:**
1. _____________
2. _____________
3. _____________

**Expected:** _____________
**Actual:** _____________
**Screenshots:** _____________

---

## Sign-Off

**Tester:** _____________
**Date:** _____________
**Environment:** _____________
**Build Version:** _____________

**Status:** ☐ Passed  ☐ Failed  ☐ Blocked

**Notes:** _____________

---

**Remember: IOLTA compliance is non-negotiable. Test thoroughly. ⚖️**
