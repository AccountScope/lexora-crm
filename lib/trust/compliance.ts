/**
 * IOLTA Compliance Checks
 * Trust Account Compliance & Monitoring
 */

import Decimal from 'decimal.js';

export interface ComplianceAlert {
  id?: string;
  trust_account_id?: string;
  client_ledger_id?: string;
  transaction_id?: string;
  alert_type:
    | 'negative_balance'
    | 'low_balance'
    | 'unreconciled_account'
    | 'large_transaction'
    | 'failed_reconciliation'
    | 'overdraft_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  created_at?: Date;
}

const COMPLIANCE_THRESHOLDS = {
  LOW_BALANCE_WARNING: 500, // Warn if balance below $500
  LARGE_TRANSACTION: 10000, // Alert if transaction over $10,000
  UNRECONCILED_DAYS: 30, // Alert if not reconciled in 30 days
  INACTIVE_DAYS: 90 // Alert if no transactions in 90 days
};

/**
 * Check for negative balance (CRITICAL)
 */
export function checkNegativeBalance(
  ledgerId: string,
  balance: number | string
): ComplianceAlert | null {
  const bal = new Decimal(balance);
  
  if (bal.lessThan(0)) {
    return {
      client_ledger_id: ledgerId,
      alert_type: 'negative_balance',
      severity: 'critical',
      message: `CRITICAL: Client ledger has negative balance of $${bal.toFixed(2)}`
    };
  }
  
  return null;
}

/**
 * Check for low balance warning
 */
export function checkLowBalance(
  ledgerId: string,
  balance: number | string,
  threshold: number = COMPLIANCE_THRESHOLDS.LOW_BALANCE_WARNING
): ComplianceAlert | null {
  const bal = new Decimal(balance);
  
  if (bal.greaterThan(0) && bal.lessThan(threshold)) {
    return {
      client_ledger_id: ledgerId,
      alert_type: 'low_balance',
      severity: 'low',
      message: `Low balance warning: Client ledger balance is $${bal.toFixed(2)}`
    };
  }
  
  return null;
}

/**
 * Check for large transaction
 */
export function checkLargeTransaction(
  transactionId: string,
  amount: number | string,
  threshold: number = COMPLIANCE_THRESHOLDS.LARGE_TRANSACTION
): ComplianceAlert | null {
  const amt = new Decimal(amount);
  
  if (amt.greaterThan(threshold)) {
    return {
      transaction_id: transactionId,
      alert_type: 'large_transaction',
      severity: 'medium',
      message: `Large transaction detected: $${amt.toFixed(2)}`
    };
  }
  
  return null;
}

/**
 * Check if account needs reconciliation
 */
export function checkUnreconciledAccount(
  accountId: string,
  lastReconciledDate: Date | null,
  threshold: number = COMPLIANCE_THRESHOLDS.UNRECONCILED_DAYS
): ComplianceAlert | null {
  if (!lastReconciledDate) {
    return {
      trust_account_id: accountId,
      alert_type: 'unreconciled_account',
      severity: 'high',
      message: 'Trust account has never been reconciled'
    };
  }

  const daysSince = Math.floor(
    (Date.now() - lastReconciledDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince > threshold) {
    return {
      trust_account_id: accountId,
      alert_type: 'unreconciled_account',
      severity: 'high',
      message: `Trust account not reconciled in ${daysSince} days (threshold: ${threshold} days)`
    };
  }

  return null;
}

/**
 * Check for reconciliation failure
 */
export function checkFailedReconciliation(
  accountId: string,
  difference: number | string
): ComplianceAlert | null {
  const diff = new Decimal(difference);
  
  if (!diff.equals(0)) {
    const severity = diff.abs().greaterThan(100) ? 'critical' : 'high';
    
    return {
      trust_account_id: accountId,
      alert_type: 'failed_reconciliation',
      severity,
      message: `Reconciliation failed with difference of $${diff.toFixed(2)}`
    };
  }
  
  return null;
}

/**
 * Check for overdraft attempt
 */
export function checkOverdraftAttempt(
  ledgerId: string,
  currentBalance: number | string,
  withdrawalAmount: number | string
): ComplianceAlert | null {
  const balance = new Decimal(currentBalance);
  const withdrawal = new Decimal(withdrawalAmount);
  const resultingBalance = balance.minus(withdrawal);
  
  if (resultingBalance.lessThan(0)) {
    return {
      client_ledger_id: ledgerId,
      alert_type: 'overdraft_attempt',
      severity: 'critical',
      message: `Overdraft attempt prevented: Withdrawal of $${withdrawal.toFixed(2)} would result in balance of $${resultingBalance.toFixed(2)}`
    };
  }
  
  return null;
}

/**
 * Run all compliance checks on a ledger
 */
export function runLedgerComplianceChecks(
  ledgerId: string,
  balance: number | string
): ComplianceAlert[] {
  const alerts: ComplianceAlert[] = [];

  const negativeCheck = checkNegativeBalance(ledgerId, balance);
  if (negativeCheck) alerts.push(negativeCheck);

  const lowBalanceCheck = checkLowBalance(ledgerId, balance);
  if (lowBalanceCheck) alerts.push(lowBalanceCheck);

  return alerts;
}

/**
 * Run all compliance checks on a trust account
 */
export function runAccountComplianceChecks(
  accountId: string,
  lastReconciledDate: Date | null,
  currentBalance: number | string,
  ledgerBalances: Array<number | string>
): ComplianceAlert[] {
  const alerts: ComplianceAlert[] = [];

  // Check reconciliation status
  const reconCheck = checkUnreconciledAccount(accountId, lastReconciledDate);
  if (reconCheck) alerts.push(reconCheck);

  // Check three-way reconciliation
  const totalLedgers = ledgerBalances.reduce(
    (sum, bal) => sum.plus(new Decimal(bal)),
    new Decimal(0)
  );
  const difference = new Decimal(currentBalance).minus(totalLedgers);
  
  const reconFailCheck = checkFailedReconciliation(accountId, difference.toNumber());
  if (reconFailCheck) alerts.push(reconFailCheck);

  return alerts;
}

/**
 * Get compliance status summary
 */
export function getComplianceStatus(alerts: ComplianceAlert[]): {
  status: 'compliant' | 'warning' | 'critical';
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  total_count: number;
} {
  const critical = alerts.filter(a => a.severity === 'critical').length;
  const high = alerts.filter(a => a.severity === 'high').length;
  const medium = alerts.filter(a => a.severity === 'medium').length;
  const low = alerts.filter(a => a.severity === 'low').length;

  let status: 'compliant' | 'warning' | 'critical' = 'compliant';
  if (critical > 0) status = 'critical';
  else if (high > 0 || medium > 0) status = 'warning';

  return {
    status,
    critical_count: critical,
    high_count: high,
    medium_count: medium,
    low_count: low,
    total_count: alerts.length
  };
}

/**
 * Format alert for display
 */
export function formatAlert(alert: ComplianceAlert): string {
  const timestamp = alert.created_at
    ? new Date(alert.created_at).toLocaleString()
    : 'Now';
  
  return `[${alert.severity.toUpperCase()}] ${timestamp}: ${alert.message}`;
}

/**
 * Priority sort alerts (critical first)
 */
export function sortAlertsByPriority(alerts: ComplianceAlert[]): ComplianceAlert[] {
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  
  return alerts.sort((a, b) => {
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
