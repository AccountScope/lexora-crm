/**
 * Trust Transactions API
 * GET - List all trust transactions
 * POST - Create new trust transaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { withDb, query } from '@/lib/api/db';
import { getCurrentUser } from '@/lib/auth';
import { validateTransaction } from '@/lib/trust/validation';
import Decimal from 'decimal.js';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const trustAccountId = searchParams.get('trust_account_id');
    const clientLedgerId = searchParams.get('client_ledger_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let sql = `
      SELECT 
        tt.*,
        json_build_object(
          'id', cl.id,
          'client', json_build_object('id', c.id, 'name', c.name)
        ) as client_ledger,
        json_build_object('id', ta.id, 'name', ta.name) as trust_account,
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name
        ) as created_by_user
      FROM trust_transactions tt
      LEFT JOIN client_ledgers cl ON tt.client_ledger_id = cl.id
      LEFT JOIN clients c ON cl.client_id = c.id
      LEFT JOIN trust_accounts ta ON tt.trust_account_id = ta.id
      LEFT JOIN users u ON tt.created_by = u.id
      WHERE tt.user_id = $1
    `;

    const params: any[] = [user.id];
    let paramCount = 1;

    if (trustAccountId) {
      paramCount++;
      sql += ` AND tt.trust_account_id = $${paramCount}`;
      params.push(trustAccountId);
    }

    if (clientLedgerId) {
      paramCount++;
      sql += ` AND tt.client_ledger_id = $${paramCount}`;
      params.push(clientLedgerId);
    }

    if (startDate) {
      paramCount++;
      sql += ` AND tt.date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      sql += ` AND tt.date <= $${paramCount}`;
      params.push(endDate);
    }

    sql += ` ORDER BY tt.date DESC`;

    const result = await query(sql, params);

    // Format transactions
    const formattedTransactions = result.rows.map((txn: any) => ({
      id: txn.id,
      date: txn.date,
      type: txn.type,
      amount: txn.amount,
      description: txn.description,
      reference_number: txn.reference_number,
      client_name: txn.client_ledger?.client?.name || 'Unknown Client',
      trust_account_name: txn.trust_account?.name || 'Unknown Account',
      reconciled: txn.reconciled,
      created_by_name: txn.created_by_user?.first_name && txn.created_by_user?.last_name
        ? `${txn.created_by_user.first_name} ${txn.created_by_user.last_name}`
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
    const user = await getCurrentUser(request);
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

    // Execute in transaction
    const transaction = await withDb(async (client) => {
      // Get client ledger
      const ledgerResult = await client.query(
        'SELECT * FROM client_ledgers WHERE id = $1 AND user_id = $2',
        [client_ledger_id, user.id]
      );

      if (ledgerResult.rows.length === 0) {
        throw new Error('Client ledger not found');
      }

      const ledger = ledgerResult.rows[0];

      // Get destination ledger if transfer
      let destinationLedger = null;
      if (type === 'transfer' && destination_ledger_id) {
        const destResult = await client.query(
          'SELECT * FROM client_ledgers WHERE id = $1 AND user_id = $2',
          [destination_ledger_id, user.id]
        );

        if (destResult.rows.length === 0) {
          throw new Error('Destination ledger not found');
        }

        destinationLedger = destResult.rows[0];
      }

      // Validate transaction
      const validation = validateTransaction(
        { type, amount, client_ledger_id, destination_ledger_id, description, reference_number },
        ledger,
        destinationLedger || undefined
      );

      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Create transaction
      const txnResult = await client.query(
        `INSERT INTO trust_transactions (
          trust_account_id, client_ledger_id, destination_ledger_id,
          type, amount, date, description, reference_number,
          invoice_id, case_id, user_id, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          ledger.trust_account_id,
          client_ledger_id,
          type === 'transfer' ? destination_ledger_id : null,
          type,
          amount,
          date,
          description,
          reference_number,
          invoice_id,
          case_id,
          user.id,
          user.id
        ]
      );

      const newTransaction = txnResult.rows[0];

      // Audit log
      await client.query(
        `INSERT INTO trust_audit_log (
          trust_account_id, transaction_id, action, new_values, performed_by
        ) VALUES ($1, $2, $3, $4, $5)`,
        [ledger.trust_account_id, newTransaction.id, 'created_transaction', JSON.stringify(newTransaction), user.id]
      );

      // Check for compliance violations
      const amountDec = new Decimal(amount);
      let newBalance = new Decimal(ledger.current_balance);

      if (type === 'deposit') {
        newBalance = newBalance.plus(amountDec);
      } else if (type === 'withdrawal' || type === 'fee' || type === 'transfer') {
        newBalance = newBalance.minus(amountDec);
      }

      // Create compliance alerts if needed
      if (newBalance.lessThan(0)) {
        await client.query(
          `INSERT INTO trust_compliance_alerts (
            trust_account_id, client_ledger_id, transaction_id,
            alert_type, severity, message
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            ledger.trust_account_id,
            client_ledger_id,
            newTransaction.id,
            'negative_balance',
            'critical',
            `Negative balance detected: ${newBalance.toFixed(2)}`
          ]
        );
      } else if (newBalance.lessThan(500) && newBalance.greaterThan(0)) {
        await client.query(
          `INSERT INTO trust_compliance_alerts (
            trust_account_id, client_ledger_id, transaction_id,
            alert_type, severity, message
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            ledger.trust_account_id,
            client_ledger_id,
            newTransaction.id,
            'low_balance',
            'low',
            `Low balance warning: ${newBalance.toFixed(2)}`
          ]
        );
      }

      // Large transaction alert
      if (amountDec.greaterThan(10000)) {
        await client.query(
          `INSERT INTO trust_compliance_alerts (
            trust_account_id, client_ledger_id, transaction_id,
            alert_type, severity, message
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            ledger.trust_account_id,
            client_ledger_id,
            newTransaction.id,
            'large_transaction',
            'medium',
            `Large transaction detected: ${amountDec.toFixed(2)}`
          ]
        );
      }

      return newTransaction;
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('[TRUST_TRANSACTIONS_POST]', error);
    const message = error instanceof Error ? error.message : 'Failed to create transaction';
    const status = message.includes('not found') || message.includes('Invalid') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
