/**
 * Trust Transactions API
 * GET - List all trust transactions
 * POST - Create new trust transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/api/db';
import { getCurrentUser } from '@/lib/auth';
import { validateTransaction } from '@/lib/trust/validation';
import Decimal from 'decimal.js';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const trustAccountId = searchParams.get('trust_account_id');
    const clientLedgerId = searchParams.get('client_ledger_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const supabase = createClient();

    let query = supabase
      .from('trust_transactions')
      .select(`
        *,
        client_ledgers!client_ledger_id (
          id,
          clients!client_id (
            id,
            name
          )
        ),
        trust_accounts!trust_account_id (
          id,
          name
        ),
        users!created_by (
          id,
          first_name,
          last_name
        )
      `)
      .order('date', { ascending: false });

    if (trustAccountId) {
      query = query.eq('trust_account_id', trustAccountId);
    }

    if (clientLedgerId) {
      query = query.eq('client_ledger_id', clientLedgerId);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data: transactions, error } = await query;

    if (error) throw error;

    // Format transactions
    const formattedTransactions = (transactions || []).map((txn: any) => ({
      id: txn.id,
      date: txn.date,
      type: txn.type,
      amount: txn.amount,
      description: txn.description,
      reference_number: txn.reference_number,
      client_name: txn.client_ledgers?.clients?.name || 'Unknown Client',
      trust_account_name: txn.trust_accounts?.name || 'Unknown Account',
      reconciled: txn.reconciled,
      created_by_name: txn.users
        ? `${txn.users.first_name} ${txn.users.last_name}`
        : 'System'
    }));

    return NextResponse.json({ transactions: formattedTransactions });
  } catch (error) {
    console.error('[TRUST_TRANSACTIONS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      client_ledger_id,
      destination_ledger_id,
      amount,
      date,
      description,
      reference_number,
      invoice_id,
      case_id
    } = body;

    // Validation
    if (!type || !client_ledger_id || !amount || !date || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['deposit', 'withdrawal', 'transfer', 'fee'].includes(type)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    const supabase = createClient();

    // Get client ledger
    const { data: ledger, error: ledgerError } = await supabase
      .from('client_ledgers')
      .select('*')
      .eq('id', client_ledger_id)
      .single();

    if (ledgerError || !ledger) {
      return NextResponse.json({ error: 'Client ledger not found' }, { status: 404 });
    }

    // Get destination ledger if transfer
    let destinationLedger = null;
    if (type === 'transfer' && destination_ledger_id) {
      const { data: destLedger, error: destError } = await supabase
        .from('client_ledgers')
        .select('*')
        .eq('id', destination_ledger_id)
        .single();

      if (destError || !destLedger) {
        return NextResponse.json(
          { error: 'Destination ledger not found' },
          { status: 404 }
        );
      }

      destinationLedger = destLedger;
    }

    // Validate transaction
    const validation = validateTransaction(
      { type, amount, client_ledger_id, destination_ledger_id, description, reference_number },
      ledger,
      destinationLedger || undefined
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Create transaction
    const { data: transaction, error: txnError } = await supabase
      .from('trust_transactions')
      .insert({
        trust_account_id: ledger.trust_account_id,
        client_ledger_id,
        destination_ledger_id: type === 'transfer' ? destination_ledger_id : null,
        type,
        amount,
        date,
        description,
        reference_number,
        invoice_id,
        case_id,
        created_by: user.id
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // Audit log
    await supabase.from('trust_audit_log').insert({
      trust_account_id: ledger.trust_account_id,
      transaction_id: transaction.id,
      action: 'created_transaction',
      new_values: transaction,
      performed_by: user.id
    });

    // Check for compliance violations after transaction
    const amountDec = new Decimal(amount);
    let newBalance = new Decimal(ledger.current_balance);

    if (type === 'deposit') {
      newBalance = newBalance.plus(amountDec);
    } else if (type === 'withdrawal' || type === 'fee' || type === 'transfer') {
      newBalance = newBalance.minus(amountDec);
    }

    // Create compliance alert if needed
    if (newBalance.lessThan(0)) {
      await supabase.from('trust_compliance_alerts').insert({
        trust_account_id: ledger.trust_account_id,
        client_ledger_id,
        transaction_id: transaction.id,
        alert_type: 'negative_balance',
        severity: 'critical',
        message: `Negative balance detected: ${newBalance.toFixed(2)}`
      });
    } else if (newBalance.lessThan(500) && newBalance.greaterThan(0)) {
      await supabase.from('trust_compliance_alerts').insert({
        trust_account_id: ledger.trust_account_id,
        client_ledger_id,
        transaction_id: transaction.id,
        alert_type: 'low_balance',
        severity: 'low',
        message: `Low balance warning: ${newBalance.toFixed(2)}`
      });
    }

    // Large transaction alert
    if (amountDec.greaterThan(10000)) {
      await supabase.from('trust_compliance_alerts').insert({
        trust_account_id: ledger.trust_account_id,
        client_ledger_id,
        transaction_id: transaction.id,
        alert_type: 'large_transaction',
        severity: 'medium',
        message: `Large transaction detected: ${amountDec.toFixed(2)}`
      });
    }

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('[TRUST_TRANSACTIONS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
