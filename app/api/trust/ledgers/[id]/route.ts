/**
 * Client Ledger Detail API
 * GET - Get ledger details with transaction history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/api/supabase-server';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const supabase = createClient();

    // Get ledger details
    const { data: ledger, error: ledgerError } = await supabase
      .from('client_ledgers')
      .select(`
        *,
        clients!client_id (
          id,
          name,
          email
        ),
        trust_accounts!trust_account_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (ledgerError) throw ledgerError;
    if (!ledger) {
      return NextResponse.json({ error: 'Ledger not found' }, { status: 404 });
    }

    // Get transaction history
    const { data: transactions, error: txnError } = await supabase
      .from('trust_transactions')
      .select(`
        *,
        users!created_by (
          id,
          first_name,
          last_name
        )
      `)
      .eq('client_ledger_id', id)
      .order('date', { ascending: false });

    if (txnError) throw txnError;

    // Format response
    const formattedLedger = {
      id: ledger.id,
      client_id: ledger.client_id,
      client_name: ledger.clients?.name || 'Unknown Client',
      current_balance: ledger.current_balance,
      status: ledger.status,
      trust_account_name: ledger.trust_accounts?.name || 'Unknown Account',
      trust_account_id: ledger.trust_account_id,
      created_at: ledger.created_at
    };

    const formattedTransactions = (transactions || []).map((txn: any) => ({
      id: txn.id,
      date: txn.date,
      type: txn.type,
      amount: txn.amount,
      description: txn.description,
      reference_number: txn.reference_number,
      balance_after: 0, // Will calculate running balance
      created_by_name: txn.users
        ? `${txn.users.first_name} ${txn.users.last_name}`
        : 'System'
    }));

    // Calculate running balances
    let runningBalance = ledger.current_balance;
    for (let i = 0; i < formattedTransactions.length; i++) {
      formattedTransactions[i].balance_after = runningBalance;
      const txn = formattedTransactions[i];
      
      // Work backwards through transactions
      if (txn.type === 'deposit') {
        runningBalance -= txn.amount;
      } else if (txn.type === 'withdrawal' || txn.type === 'fee') {
        runningBalance += txn.amount;
      }
    }

    // Reverse to show newest first with correct balances
    formattedTransactions.reverse();

    return NextResponse.json({
      ledger: formattedLedger,
      transactions: formattedTransactions
    });
  } catch (error) {
    console.error('[LEDGER_DETAIL_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch ledger details' },
      { status: 500 }
    );
  }
}
