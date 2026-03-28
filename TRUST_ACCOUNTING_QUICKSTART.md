# Trust Accounting - Quick Start Guide 🚀

## Prerequisites

1. ✅ Database migration `019_trust_accounting.sql` must be run
2. ✅ `decimal.js` package installed (`npm install decimal.js`)
3. ✅ User authentication working
4. ✅ At least one client exists in the system

---

## 1️⃣ First-Time Setup

### Step 1: Create Your First Trust Account

1. Navigate to `/trust-accounting/accounts`
2. Click **"Add Trust Account"**
3. Fill in the form:
   - **Account Name:** "Client Trust Account - Main Bank"
   - **Bank Name:** "Your Bank Name"
   - **Account Number (Last 4):** "1234"
   - **Routing Number:** (optional) "123456789"
   - **Account Type:** Checking
   - **Opening Balance:** 0.00
   - **Opening Date:** Today's date
4. Click **"Create Trust Account"**

✅ **Result:** Trust account created and ready for use

---

### Step 2: Add a Client Ledger (Automatic)

Client ledgers are created automatically when you create the first transaction for a client.

---

### Step 3: Make Your First Deposit

1. Navigate to `/trust-accounting/transactions/new`
2. Select **Transaction Type:** Deposit
3. Select **Client:** Choose a client
4. Enter **Amount:** 5000.00
5. Enter **Date:** Today
6. Enter **Description:** "Initial retainer deposit"
7. (Optional) **Reference Number:** "Check #1001"
8. Click **"Create Transaction"**

✅ **Result:** 
- Transaction created
- Client ledger created (if first transaction)
- Trust account balance updated to $5,000.00
- Client ledger balance updated to $5,000.00

---

## 2️⃣ Common Operations

### Make a Withdrawal

1. Go to `/trust-accounting/transactions/new`
2. Transaction Type: **Withdrawal**
3. Select client
4. Enter amount (must be ≤ client balance)
5. Description: "Payment of legal fees per invoice #123"
6. Submit

⚠️ **System blocks if insufficient funds**

---

### Transfer Between Clients

1. Transaction Type: **Transfer**
2. Source Client: Client A
3. Destination Client: Client B
4. Amount: 1000.00
5. Description: "Transfer for joint representation"
6. Submit

✅ **Result:** $1,000 moved from Client A to Client B

---

### Transfer Earned Fees

1. Transaction Type: **Fee**
2. Select client
3. Amount: Amount earned
4. Description: "Legal fees earned per invoice #456"
5. (Optional) Link to invoice
6. Submit

✅ **Result:** Funds moved from trust to operating account (in future version)

---

## 3️⃣ Monthly Reconciliation Workflow

### Step 1: Run Three-Way Reconciliation

1. Navigate to `/trust-accounting/reconciliation`
2. Select trust account
3. Review **Three-Way Reconciliation Report**

**Check:**
- Trust Account Balance
- Sum of Client Ledgers
- Difference (should be $0.00)

✅ **If balanced:** Green checkmark, proceed
❌ **If not balanced:** RED alert, investigate immediately

---

### Step 2: Bank Reconciliation

1. Get your bank statement
2. Enter **Bank Statement Balance** in the form
3. Enter **Reconciliation Date** (end of month)
4. (Optional) Add notes about outstanding checks/deposits
5. Click **"Complete Reconciliation"**

**System compares:**
- Bank balance (from statement)
- Book balance (from system)

✅ **If matched:** Reconciliation complete
⚠️ **If discrepancy:** System flags for review

---

## 4️⃣ View Reports

### Client Ledger Report
- Go to `/trust-accounting/ledgers`
- View all client balances
- Export to CSV

### Transaction Activity Report
- Go to `/trust-accounting/transactions`
- Filter by date, type, client
- Export to CSV

### Three-Way Reconciliation Report
- Go to `/trust-accounting/reconciliation`
- Select account
- Export/Print report

---

## 5️⃣ Compliance Checks

### Automatic Alerts:
- ❌ **Negative balance:** CRITICAL (blocked by system)
- ⚠️ **Low balance (< $500):** WARNING
- ⚠️ **Large transaction (> $10,000):** INFO alert
- ⚠️ **Unreconciled account (> 30 days):** WARNING

### Where to view alerts:
(Future enhancement: Dashboard widget)

---

## 6️⃣ Best Practices

### Daily:
- Review new transactions
- Check for compliance alerts

### Weekly:
- Review client ledger balances
- Verify outstanding transactions

### Monthly (REQUIRED):
- ✅ Run three-way reconciliation
- ✅ Complete bank reconciliation
- ✅ Resolve any discrepancies
- ✅ Export and save reports

### Annually:
- Generate annual trust account activity report
- Provide to state bar (if required)

---

## 🚨 Troubleshooting

### "Transaction would create negative balance"
**Cause:** Trying to withdraw more than available
**Fix:** Reduce withdrawal amount or verify ledger balance

### "Cannot transfer to the same ledger"
**Cause:** Source and destination are the same
**Fix:** Select different destination client

### "Three-way reconciliation failed"
**Cause:** Trust account balance ≠ sum of client ledgers
**Fix:** 
1. Review all transactions
2. Check for pending/failed transactions
3. Verify database triggers are working
4. Contact support if persists

### "Discrepancy detected in bank reconciliation"
**Cause:** Bank balance ≠ book balance
**Fix:**
1. Check for outstanding checks
2. Check for deposits in transit
3. Verify all transactions are recorded
4. Check bank statement for errors

---

## 📞 Support Checklist

Before contacting support, gather:
- Trust account ID
- Transaction IDs (if applicable)
- Screenshots of error messages
- Three-way reconciliation report
- Bank reconciliation details

---

## ✅ Success Checklist

Your trust accounting is working correctly if:
- ✅ Trust account balance equals sum of client ledgers
- ✅ All transactions have descriptions
- ✅ No negative balances exist
- ✅ Monthly reconciliations are completed
- ✅ Bank balance matches book balance
- ✅ All compliance alerts resolved
- ✅ Audit logs are complete

---

**Keep your law firm compliant. Keep your trust accounts balanced. Keep your bar license safe. ⚖️**
