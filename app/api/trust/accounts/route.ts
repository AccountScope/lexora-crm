/**
 * Trust Accounts API
 * GET - List all trust accounts
 * POST - Create new trust account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/api/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    const { data: accounts, error } = await supabase
      .from('trust_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('[TRUST_ACCOUNTS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch trust accounts' },
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
      name,
      bank_name,
      account_number_last4,
      routing_number,
      account_type,
      opening_balance,
      opening_date
    } = body;

    // Validation
    if (!name || !bank_name || !account_number_last4 || !account_type || !opening_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['checking', 'savings'].includes(account_type)) {
      return NextResponse.json(
        { error: 'Invalid account type' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: account, error } = await supabase
      .from('trust_accounts')
      .insert({
        name,
        bank_name,
        account_number_last4,
        routing_number,
        account_type,
        opening_balance: opening_balance || 0,
        opening_date,
        current_balance: opening_balance || 0,
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from('trust_audit_log').insert({
      trust_account_id: account.id,
      action: 'created_account',
      new_values: account,
      performed_by: user.id
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error('[TRUST_ACCOUNTS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create trust account' },
      { status: 500 }
    );
  }
}
