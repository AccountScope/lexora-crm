/**
 * Trust Reconciliation API
 * POST - Submit bank reconciliation (three-way IOLTA compliance)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withDb, query } from '@/lib/api/db';
import { getCurrentUser } from '@/lib/auth';
import { generateThreeWayReport } from '@/lib/trust/reports';
import Decimal from 'decimal.js';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trust_account_id, reconciliation_date, bank_statement_balance } = body;

    if (!trust_account_id || !reconciliation_date || bank_statement_balance === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get trust account
    const accountResult = await query(
      'SELECT * FROM trust_accounts WHERE id = $1 AND user_id = $2',
      [trust_account_id, user.id]
    );

    if (accountResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Trust account not found' },
        { status: 404 }
      );
    }

    const account = accountResult.rows[0];

    // Generate three-way report
    const threeWayReport = await generateThreeWayReport(trust_account_id);
    if (!threeWayReport) {
      return NextResponse.json(
        { error: 'Failed to generate three-way report' },
        { status: 500 }
      );
    }

    const bankBalance = new Decimal(bank_statement_balance);
    const bookBalance = new Decimal(account.current_balance);
    const ledgerTotal = new Decimal(threeWayReport.ledger_total);
    const difference = bankBalance.minus(bookBalance);

    // Determine status (IOLTA compliance check)
    let status = 'reconciled';
    if (Math.abs(difference.toNumber()) > 0.01) {
      status = 'discrepancy';
    }
    if (!threeWayReport.is_balanced) {
      status = 'discrepancy';
    }

    // Execute reconciliation in transaction
    const reconciliation = await withDb(async (client) => {
      // Check if reconciliation already exists for this date
      const existingResult = await client.query(
        `SELECT id FROM trust_reconciliations 
         WHERE trust_account_id = $1 AND reconciliation_date = $2`,
        [trust_account_id, reconciliation_date]
      );

      let result;

      if (existingResult.rows.length > 0) {
        // Update existing
        result = await client.query(
          `UPDATE trust_reconciliations
           SET bank_statement_balance = $1,
               book_balance = $2,
               ledger_balance = $3,
               difference = $4,
               status = $5,
               reconciled_by = $6,
               reconciled_at = NOW()
           WHERE id = $7
           RETURNING *`,
          [
            bankBalance.toFixed(2),
            bookBalance.toFixed(2),
            ledgerTotal.toFixed(2),
            difference.toFixed(2),
            status,
            user.id,
            existingResult.rows[0].id
          ]
        );
      } else {
        // Create new
        result = await client.query(
          `INSERT INTO trust_reconciliations (
            trust_account_id, reconciliation_date,
            bank_statement_balance, book_balance, ledger_balance,
            difference, status, reconciled_by, reconciled_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING *`,
          [
            trust_account_id,
            reconciliation_date,
            bankBalance.toFixed(2),
            bookBalance.toFixed(2),
            ledgerTotal.toFixed(2),
            difference.toFixed(2),
            status,
            user.id
          ]
        );
      }

      // Update last_reconciled_at on trust account
      await client.query(
        'UPDATE trust_accounts SET last_reconciled_at = NOW() WHERE id = $1',
        [trust_account_id]
      );

      // Create compliance alert if discrepancy (IOLTA violation)
      if (status === 'discrepancy') {
        await client.query(
          `INSERT INTO trust_compliance_alerts (
            trust_account_id, alert_type, severity, message
          ) VALUES ($1, $2, $3, $4)`,
          [
            trust_account_id,
            'failed_reconciliation',
            'high',
            `Reconciliation discrepancy detected: ${difference.toFixed(2)}`
          ]
        );
      }

      // Audit log (compliance requirement)
      await client.query(
        `INSERT INTO trust_audit_log (
          trust_account_id, action, new_values, performed_by
        ) VALUES ($1, $2, $3, $4)`,
        [
          trust_account_id,
          'completed_reconciliation',
          JSON.stringify(result.rows[0]),
          user.id
        ]
      );

      return result.rows[0];
    });

    return NextResponse.json({ reconciliation }, { status: 201 });
  } catch (error) {
    console.error('[RECONCILIATION_POST]', error);
    return NextResponse.json(
      { error: 'Failed to submit reconciliation' },
      { status: 500 }
    );
  }
}
