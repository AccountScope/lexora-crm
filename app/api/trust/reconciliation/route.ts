/**
 * Trust Reconciliation API
 * POST - Submit bank reconciliation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/api/db';
import { getCurrentUser } from '@/lib/auth';
import { generateThreeWayReport } from '@/lib/trust/reports';
import Decimal from 'decimal.js';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
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

    const supabase = createClient();

    // Get trust account
    const { data: account, error: accountError } = await supabase
      .from('trust_accounts')
      .select('*')
      .eq('id', trust_account_id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Trust account not found' },
        { status: 404 }
      );
    }

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

    // Determine status
    let status = 'reconciled';
    if (Math.abs(difference.toNumber()) > 0.01) {
      status = 'discrepancy';
    }
    if (!threeWayReport.is_balanced) {
      status = 'discrepancy';
    }

    // Check if reconciliation already exists for this date
    const { data: existing } = await supabase
      .from('trust_reconciliations')
      .select('id')
      .eq('trust_account_id', trust_account_id)
      .eq('reconciliation_date', reconciliation_date)
      .single();

    let reconciliation;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('trust_reconciliations')
        .update({
          bank_statement_balance: bankBalance.toFixed(2),
          book_balance: bookBalance.toFixed(2),
          ledger_balance: ledgerTotal.toFixed(2),
          difference: difference.toFixed(2),
          status,
          reconciled_by: user.id,
          reconciled_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      reconciliation = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('trust_reconciliations')
        .insert({
          trust_account_id,
          reconciliation_date,
          bank_statement_balance: bankBalance.toFixed(2),
          book_balance: bookBalance.toFixed(2),
          ledger_balance: ledgerTotal.toFixed(2),
          difference: difference.toFixed(2),
          status,
          reconciled_by: user.id,
          reconciled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      reconciliation = data;
    }

    // Update last_reconciled_at on trust account
    await supabase
      .from('trust_accounts')
      .update({ last_reconciled_at: new Date().toISOString() })
      .eq('id', trust_account_id);

    // Create compliance alert if discrepancy
    if (status === 'discrepancy') {
      await supabase.from('trust_compliance_alerts').insert({
        trust_account_id,
        alert_type: 'failed_reconciliation',
        severity: 'high',
        message: `Reconciliation discrepancy detected: ${difference.toFixed(2)}`
      });
    }

    // Audit log
    await supabase.from('trust_audit_log').insert({
      trust_account_id,
      action: 'completed_reconciliation',
      new_values: reconciliation,
      performed_by: user.id
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
