/**
 * Client Ledger Detail API
 * GET - Get ledger details with transaction history
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/api/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get ledger details
    const ledgerResult = await query(
      `SELECT 
        cl.*,
        c.id as client_id,
        c.name as client_name,
        c.email as client_email,
        ta.id as trust_account_id,
        ta.name as trust_account_name
       FROM client_ledgers cl
       LEFT JOIN clients c ON cl.client_id = c.id
       LEFT JOIN trust_accounts ta ON cl.trust_account_id = ta.id
       WHERE cl.id = $1 AND cl.user_id = $2`,
      [id, user.id]
    );

    if (ledgerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Ledger not found' }, { status: 404 });
    }

    const ledger = ledgerResult.rows[0];

    // Get transaction history
    const txnResult = await query(
      `SELECT 
        tt.*,
        u.first_name,
        u.last_name
       FROM trust_transactions tt
       LEFT JOIN users u ON tt.created_by = u.id
       WHERE tt.client_ledger_id = $1
       ORDER BY tt.date DESC`,
      [id]
    );

    // Format response
    const formattedLedger = {
      id: ledger.id,
      client_id: ledger.client_id,
      client_name: ledger.client_name || 'Unknown Client',
      current_balance: ledger.current_balance,
      status: ledger.status,
      trust_account_name: ledger.trust_account_name || 'Unknown Account',
      trust_account_id: ledger.trust_account_id,
      created_at: ledger.created_at
    };

    const formattedTransactions = txnResult.rows.map((txn: any) => ({
      id: txn.id,
      date: txn.date,
      type: txn.type,
      amount: txn.amount,
      description: txn.description,
      reference_number: txn.reference_number,
      balance_after: 0, // Will calculate below
      created_by_name: txn.first_name && txn.last_name
        ? `${txn.first_name} ${txn.last_name}`
        : 'System'
    }));

    // Calculate running balances (backwards from current)
    let runningBalance = parseFloat(ledger.current_balance);
    for (let i = 0; i < formattedTransactions.length; i++) {
      formattedTransactions[i].balance_after = runningBalance;
      const txn = formattedTransactions[i];
      
      // Work backwards through transactions
      if (txn.type === 'deposit') {
        runningBalance -= parseFloat(txn.amount);
      } else if (txn.type === 'withdrawal' || txn.type === 'fee') {
        runningBalance += parseFloat(txn.amount);
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
