/**
 * Trust Account Reconciliation Logic
 * Three-Way Reconciliation for IOLTA Compliance
 */

import Decimal from 'decimal.js';

export interface ReconciliationData {
  trust_account_id: string;
  reconciliation_date: string;
  bank_statement_balance: number | string;
  book_balance: number | string;
  client_ledger_balances: Array<{
    client_id: string;
    client_name: string;
    balance: number | string;
  }>;
}

export interface ReconciliationResult {
  is_reconciled: boolean;
  total_ledger_balance: string;
  difference: string;
  discrepancies: Array<{
    type: string;
    message: string;
    amount?: string;
  }>;
  status: 'reconciled' | 'pending' | 'discrepancy';
}

/**
 * Perform three-way reconciliation
 * Trust Account Balance = Sum of Client Ledgers = Bank Statement Balance
 */
export function performReconciliation(
  data: ReconciliationData
): ReconciliationResult {
  const bankBalance = new Decimal(data.bank_statement_balance);
  const bookBalance = new Decimal(data.book_balance);
  
  // Calculate total of all client ledgers
  const totalLedgerBalance = data.client_ledger_balances.reduce(
    (sum, ledger) => sum.plus(new Decimal(ledger.balance)),
    new Decimal(0)
  );

  const discrepancies: Array<{
    type: string;
    message: string;
    amount?: string;
  }> = [];

  // Check book balance vs ledger total
  const bookLedgerDiff = bookBalance.minus(totalLedgerBalance);
  if (!bookLedgerDiff.equals(0)) {
    discrepancies.push({
      type: 'book_ledger_mismatch',
      message: 'Book balance does not match sum of client ledgers',
      amount: bookLedgerDiff.toFixed(2)
    });
  }

  // Check bank balance vs book balance
  const bankBookDiff = bankBalance.minus(bookBalance);
  if (!bankBookDiff.equals(0)) {
    discrepancies.push({
      type: 'bank_book_mismatch',
      message: 'Bank statement balance does not match book balance',
      amount: bankBookDiff.toFixed(2)
    });
  }

  // Check for negative ledger balances (CRITICAL)
  data.client_ledger_balances.forEach(ledger => {
    const balance = new Decimal(ledger.balance);
    if (balance.lessThan(0)) {
      discrepancies.push({
        type: 'negative_balance',
        message: `Client ${ledger.client_name} has negative balance`,
        amount: balance.toFixed(2)
      });
    }
  });

  const isReconciled = discrepancies.length === 0;
  const status = isReconciled
    ? 'reconciled'
    : discrepancies.some(d => d.type === 'negative_balance')
    ? 'discrepancy'
    : 'pending';

  return {
    is_reconciled: isReconciled,
    total_ledger_balance: totalLedgerBalance.toFixed(2),
    difference: bankBookDiff.toFixed(2),
    discrepancies,
    status
  };
}

/**
 * Generate reconciliation report data
 */
export function generateReconciliationReport(
  result: ReconciliationResult,
  data: ReconciliationData
) {
  return {
    reconciliation_date: data.reconciliation_date,
    trust_account_id: data.trust_account_id,
    bank_statement_balance: new Decimal(data.bank_statement_balance).toFixed(2),
    book_balance: new Decimal(data.book_balance).toFixed(2),
    total_ledger_balance: result.total_ledger_balance,
    difference: result.difference,
    status: result.status,
    is_reconciled: result.is_reconciled,
    discrepancies: result.discrepancies,
    client_ledgers: data.client_ledger_balances.map(ledger => ({
      ...ledger,
      balance: new Decimal(ledger.balance).toFixed(2)
    }))
  };
}

/**
 * Check if account needs reconciliation
 */
export function needsReconciliation(lastReconciledDate: Date | null): boolean {
  if (!lastReconciledDate) {
    return true;
  }

  const daysSinceReconciliation = Math.floor(
    (Date.now() - lastReconciledDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Alert if not reconciled in 30 days
  return daysSinceReconciliation > 30;
}

/**
 * Identify unreconciled transactions
 */
export function getUnreconciledTransactions(
  transactions: Array<{
    id: string;
    date: string;
    amount: number | string;
    type: string;
    reconciled: boolean;
  }>,
  reconciliationDate: string
): Array<{ id: string; date: string; amount: string; type: string }> {
  const reconDate = new Date(reconciliationDate);
  
  return transactions
    .filter(txn => {
      const txnDate = new Date(txn.date);
      return !txn.reconciled && txnDate <= reconDate;
    })
    .map(txn => ({
      id: txn.id,
      date: txn.date,
      amount: new Decimal(txn.amount).toFixed(2),
      type: txn.type
    }));
}

/**
 * Mark transactions as reconciled
 */
export function markTransactionsReconciled(
  transactionIds: string[],
  reconciledBy: string,
  reconciledAt: Date = new Date()
) {
  return {
    transaction_ids: transactionIds,
    reconciled: true,
    reconciled_by: reconciledBy,
    reconciled_at: reconciledAt.toISOString()
  };
}

/**
 * Calculate reconciliation adjustments needed
 */
export function calculateAdjustments(
  bankBalance: number | string,
  bookBalance: number | string,
  outstandingDeposits: Array<number | string>,
  outstandingChecks: Array<number | string>
): {
  adjusted_bank_balance: string;
  adjusted_book_balance: string;
  should_match: boolean;
} {
  let adjustedBank = new Decimal(bankBalance);
  let adjustedBook = new Decimal(bookBalance);

  // Add outstanding deposits to bank balance
  outstandingDeposits.forEach(deposit => {
    adjustedBank = adjustedBank.plus(new Decimal(deposit));
  });

  // Subtract outstanding checks from bank balance
  outstandingChecks.forEach(check => {
    adjustedBank = adjustedBank.minus(new Decimal(check));
  });

  const shouldMatch = adjustedBank.equals(adjustedBook);

  return {
    adjusted_bank_balance: adjustedBank.toFixed(2),
    adjusted_book_balance: adjustedBook.toFixed(2),
    should_match: shouldMatch
  };
}
