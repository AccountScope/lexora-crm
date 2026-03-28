/**
 * Client Ledgers API
 * GET - List all client ledgers
 * POST - Create new client ledger
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

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const trustAccountId = searchParams.get('trust_account_id');

    const supabase = createClient();

    let query = supabase
      .from('client_ledgers')
      .select(`
        *,
        client:clients(id, name, email),
        trust_account:trust_accounts(id, name)
      `)
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (trustAccountId) {
      query = query.eq('trust_account_id', trustAccountId);
    }

    const { data: ledgers, error } = await query;

    if (error) throw error;

    return NextResponse.json({ ledgers });
  } catch (error) {
    console.error('[CLIENT_LEDGERS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch client ledgers' },
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
    const { client_id, trust_account_id } = body;

    // Validation
    if (!client_id || !trust_account_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if ledger already exists
    const { data: existing } = await supabase
      .from('client_ledgers')
      .select('id')
      .eq('client_id', client_id)
      .eq('trust_account_id', trust_account_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Client ledger already exists for this account' },
        { status: 400 }
      );
    }

    const { data: ledger, error } = await supabase
      .from('client_ledgers')
      .insert({
        client_id,
        trust_account_id,
        created_by: user.id
      })
      .select(`
        *,
        client:clients(id, name, email),
        trust_account:trust_accounts(id, name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ ledger }, { status: 201 });
  } catch (error) {
    console.error('[CLIENT_LEDGERS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create client ledger' },
      { status: 500 }
    );
  }
}
