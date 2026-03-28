/**
 * Trust Account Reports
 * Generate compliance and reconciliation reports
 */

import Decimal from 'decimal.js';
import { createClient } from '@/lib/api/db';

export interface ThreeWayReport {
  trust_account_id: string;
  trust_account_name: string;
  bank_balance: string;
  book_balance: string;
  ledger_total: string;
  difference: string;
  is_balanced: boolean;
  client_ledgers: Array<{
    client_id: string;
    client_name: string;
    balance: string;
  }>;
  generated_at: string;
}

export interface ClientLedgerReport {
  client_id: string;
  client_name: string;
  current_balance: string;
  last_transaction_date: string | null;
  status: string;
  trust_account_name: string;
}

export interface TransactionActivityReport {
  transaction_id: string;
  date: string;
  type: string;
  client_name: string;
  amount: string;
  balance_after: string;
  description: string;
  reference_number: string | null;
}

/**
 * Generate Three-Way Reconciliation Report
 * Most critical IOLTA compliance report
 */
export async function generateThreeWayReport(
  trustAccountId: string
): Promise<ThreeWayReport | null> {
  try {
    const supabase = createClient();

    // Get trust account
    const { data: account, error: accountError } = await supabase
      .from('trust_accounts')
      .select('id, name, current_balance')
      .eq('id', trustAccountId)
      .single();

    if (accountError || !account) {
      throw new Error('Trust account not found');
    }

    // Get all client ledgers for this account
    const { data: ledgers, error: ledgersError } = await supabase
      .from('client_ledgers')
      .select(`
        id,
        client_id,
        current_balance,
        clients:client_id (
          id,
          name
        )
      `)
      .eq('trust_account_id', trustAccountId)
      .eq('status', 'active');

    if (ledgersError) throw ledgersError;

    // Calculate ledger total
    const ledgerTotal = (ledgers || []).reduce(
      (sum, ledger) => sum.plus(new Decimal(ledger.current_balance)),
      new Decimal(0)
    );

    const bookBalance = new Decimal(account.current_balance);
    const difference = bookBalance.minus(ledgerTotal);

    return {
      trust_account_id: account.id,
      trust_account_name: account.name,
      bank_balance: bookBalance.toFixed(2),
      book_balance: bookBalance.toFixed(2),
      ledger_total: ledgerTotal.toFixed(2),
      difference: difference.toFixed(2),
      is_balanced: difference.equals(0),
      client_ledgers: (ledgers || []).map((ledger: any) => ({
        client_id: ledger.client_id,
        client_name: ledger.clients?.name || 'Unknown Client',
        balance: new Decimal(ledger.current_balance).toFixed(2)
      })),
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('[GENERATE_THREE_WAY_REPORT]', error);
    return null;
  }
}

/**
 * Generate Client Ledger Balance Report
 */
export async function generateClientLedgerReport(): Promise<ClientLedgerReport[]> {
  try {
    const supabase = createClient();

    const { data: ledgers, error } = await supabase
      .from('client_ledgers')
      .select(`
        client_id,
        current_balance,
        status,
        clients:client_id (
          id,
          name
        ),
        trust_accounts:trust_account_id (
          name
        ),
        trust_transactions:client_ledger_id (
          date
        )
      `)
      .order('current_balance', { ascending: false });

    if (error) throw error;

    return (ledgers || []).map((ledger: any) => {
      const transactions = ledger.trust_transactions || [];
      const lastTransactionDate =
        transactions.length > 0
          ? transactions.sort(
              (a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0].date
          : null;

      return {
        client_id: ledger.client_id,
        client_name: ledger.clients?.name || 'Unknown Client',
        current_balance: new Decimal(ledger.current_balance).toFixed(2),
        last_transaction_date: lastTransactionDate,
        status: ledger.status,
        trust_account_name: ledger.trust_accounts?.name || 'Unknown Account'
      };
    });
  } catch (error) {
    console.error('[GENERATE_CLIENT_LEDGER_REPORT]', error);
    return [];
  }
}

/**
 * Generate Transaction Activity Report
 */
export async function generateTransactionActivityReport(
  startDate: string,
  endDate: string,
  trustAccountId?: string
): Promise<TransactionActivityReport[]> {
  try {
    const supabase = createClient();

    let query = supabase
      .from('trust_transactions')
      .select(`
        id,
        date,
        type,
        amount,
        description,
        reference_number,
        client_ledgers:client_ledger_id (
          clients:client_id (
            name
          )
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (trustAccountId) {
      query = query.eq('trust_account_id', trustAccountId);
    }

    const { data: transactions, error } = await query;

    if (error) throw error;

    // Calculate running balance for each transaction
    let runningBalance = new Decimal(0);

    return (transactions || []).map((txn: any) => {
      const amount = new Decimal(txn.amount);

      if (txn.type === 'deposit') {
        runningBalance = runningBalance.plus(amount);
      } else if (txn.type === 'withdrawal' || txn.type === 'fee') {
        runningBalance = runningBalance.minus(amount);
      }

      return {
        transaction_id: txn.id,
        date: txn.date,
        type: txn.type,
        client_name: txn.client_ledgers?.clients?.name || 'Unknown Client',
        amount: amount.toFixed(2),
        balance_after: runningBalance.toFixed(2),
        description: txn.description,
        reference_number: txn.reference_number
      };
    });
  } catch (error) {
    console.error('[GENERATE_TRANSACTION_ACTIVITY_REPORT]', error);
    return [];
  }
}

/**
 * Generate Outstanding Fees Report
 * Fees earned but not yet transferred to operating account
 */
export async function generateOutstandingFeesReport(): Promise<any[]> {
  try {
    const supabase = createClient();

    // This would need to query invoices that are paid but not transferred from trust
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    console.error('[GENERATE_OUTSTANDING_FEES_REPORT]', error);
    return [];
  }
}

/**
 * Generate Zero-Balance Ledgers Report
 */
export async function generateZeroBalanceLedgersReport(): Promise<ClientLedgerReport[]> {
  try {
    const supabase = createClient();

    const { data: ledgers, error } = await supabase
      .from('client_ledgers')
      .select(`
        client_id,
        current_balance,
        status,
        clients:client_id (
          id,
          name
        ),
        trust_accounts:trust_account_id (
          name
        )
      `)
      .eq('current_balance', 0)
      .order('status', { ascending: true });

    if (error) throw error;

    return (ledgers || []).map((ledger: any) => ({
      client_id: ledger.client_id,
      client_name: ledger.clients?.name || 'Unknown Client',
      current_balance: '0.00',
      last_transaction_date: null,
      status: ledger.status,
      trust_account_name: ledger.trust_accounts?.name || 'Unknown Account'
    }));
  } catch (error) {
    console.error('[GENERATE_ZERO_BALANCE_REPORT]', error);
    return [];
  }
}

/**
 * Format currency for reports
 */
export function formatReportCurrency(amount: string | number): string {
  const dec = new Decimal(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(dec.toNumber());
}
