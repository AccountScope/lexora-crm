/**
 * Trust Accounting Validation Rules
 * IOLTA Compliance & Transaction Validation
 */

import Decimal from 'decimal.js';

export interface TrustTransaction {
  id?: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'fee';
  amount: number | string;
  client_ledger_id: string;
  destination_ledger_id?: string;
  description: string;
  reference_number?: string;
}

export interface ClientLedger {
  id: string;
  client_id: string;
  current_balance: number | string;
  status: 'active' | 'closed';
}

export interface TrustAccount {
  id: string;
  current_balance: number | string;
  status: 'active' | 'closed';
}

/**
 * Validate transaction amount (must be positive)
 */
export function validateAmount(amount: number | string): boolean {
  const dec = new Decimal(amount);
  return dec.greaterThan(0);
}

/**
 * Validate that withdrawal doesn't exceed ledger balance
 */
export function validateWithdrawal(
  ledger: ClientLedger,
  amount: number | string
): { valid: boolean; error?: string } {
  const balance = new Decimal(ledger.current_balance);
  const withdrawalAmount = new Decimal(amount);

  if (withdrawalAmount.greaterThan(balance)) {
    return {
      valid: false,
      error: `Insufficient funds. Available: $${balance.toFixed(2)}, Requested: $${withdrawalAmount.toFixed(2)}`
    };
  }

  if (balance.minus(withdrawalAmount).lessThan(0)) {
    return {
      valid: false,
      error: 'Transaction would create negative balance'
    };
  }

  return { valid: true };
}

/**
 * Validate transfer between ledgers
 */
export function validateTransfer(
  sourceLedger: ClientLedger,
  destinationLedger: ClientLedger | undefined,
  amount: number | string
): { valid: boolean; error?: string } {
  if (!destinationLedger) {
    return {
      valid: false,
      error: 'Destination ledger is required for transfers'
    };
  }

  if (sourceLedger.id === destinationLedger.id) {
    return {
      valid: false,
      error: 'Cannot transfer to the same ledger'
    };
  }

  if (sourceLedger.status !== 'active') {
    return {
      valid: false,
      error: 'Source ledger is not active'
    };
  }

  if (destinationLedger.status !== 'active') {
    return {
      valid: false,
      error: 'Destination ledger is not active'
    };
  }

  return validateWithdrawal(sourceLedger, amount);
}

/**
 * Validate fee transaction
 */
export function validateFee(
  ledger: ClientLedger,
  amount: number | string,
  invoice?: { total: number | string; paid_from_trust?: boolean }
): { valid: boolean; error?: string } {
  // Check balance
  const balanceCheck = validateWithdrawal(ledger, amount);
  if (!balanceCheck.valid) {
    return balanceCheck;
  }

  // Check against invoice if provided
  if (invoice) {
    const invoiceTotal = new Decimal(invoice.total);
    const feeAmount = new Decimal(amount);

    if (feeAmount.greaterThan(invoiceTotal)) {
      return {
        valid: false,
        error: `Fee amount ($${feeAmount.toFixed(2)}) exceeds invoice total ($${invoiceTotal.toFixed(2)})`
      };
    }
  }

  return { valid: true };
}

/**
 * Validate three-way reconciliation
 * Trust Account Balance = Sum of All Client Ledgers
 */
export function validateThreeWayReconciliation(
  trustAccountBalance: number | string,
  clientLedgerBalances: Array<number | string>
): { valid: boolean; difference: string; error?: string } {
  const accountBalance = new Decimal(trustAccountBalance);
  
  const totalLedgerBalance = clientLedgerBalances.reduce(
    (sum, balance) => sum.plus(new Decimal(balance)),
    new Decimal(0)
  );

  const difference = accountBalance.minus(totalLedgerBalance);
  const isValid = difference.equals(0);

  return {
    valid: isValid,
    difference: difference.toFixed(2),
    error: isValid
      ? undefined
      : `Three-way reconciliation failed. Difference: $${difference.toFixed(2)}`
  };
}

/**
 * Check for compliance violations
 */
export function checkComplianceViolations(
  ledger: ClientLedger,
  trustAccount: TrustAccount
): Array<{ type: string; severity: 'low' | 'medium' | 'high' | 'critical'; message: string }> {
  const violations = [];
  const balance = new Decimal(ledger.current_balance);

  // Negative balance (CRITICAL)
  if (balance.lessThan(0)) {
    violations.push({
      type: 'negative_balance',
      severity: 'critical',
      message: `Client ledger has negative balance: $${balance.toFixed(2)}`
    });
  }

  // Low balance warning
  if (balance.lessThan(500) && balance.greaterThan(0)) {
    violations.push({
      type: 'low_balance',
      severity: 'low',
      message: `Client ledger balance is low: $${balance.toFixed(2)}`
    });
  }

  return violations as any;
}

/**
 * Validate transaction before creation
 */
export function validateTransaction(
  transaction: TrustTransaction,
  ledger: ClientLedger,
  destinationLedger?: ClientLedger,
  invoice?: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Amount validation
  if (!validateAmount(transaction.amount)) {
    errors.push('Transaction amount must be greater than zero');
  }

  // Type-specific validation
  switch (transaction.type) {
    case 'withdrawal':
      const withdrawalResult = validateWithdrawal(ledger, transaction.amount);
      if (!withdrawalResult.valid) {
        errors.push(withdrawalResult.error!);
      }
      break;

    case 'transfer':
      const transferResult = validateTransfer(ledger, destinationLedger, transaction.amount);
      if (!transferResult.valid) {
        errors.push(transferResult.error!);
      }
      break;

    case 'fee':
      const feeResult = validateFee(ledger, transaction.amount, invoice);
      if (!feeResult.valid) {
        errors.push(feeResult.error!);
      }
      break;

    case 'deposit':
      // Deposits always allowed (add funds)
      break;

    default:
      errors.push('Invalid transaction type');
  }

  // Description required
  if (!transaction.description || transaction.description.trim().length === 0) {
    errors.push('Transaction description is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number | string): string {
  const dec = new Decimal(amount);
  return `$${dec.toFixed(2)}`;
}

/**
 * Parse currency input
 */
export function parseCurrency(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const dec = new Decimal(cleaned || 0);
  return dec.toFixed(2);
}
