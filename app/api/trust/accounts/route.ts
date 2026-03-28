/**
 * Trust Accounts API
 * GET - List all trust accounts
 * POST - Create new trust account
 */

import { NextRequest, NextResponse } from 'next/server';
import { withDb, query } from '@/lib/api/db';
import { getCurrentUser } from '@/lib/auth';
import { ApiError } from '@/lib/api/errors';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT * FROM trust_accounts 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user.id]
    );

    return NextResponse.json({ accounts: result.rows });
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
    const user = await getCurrentUser(request);
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
      currency = 'GBP',
      is_iolta = true,
    } = body;

    // Validate required fields
    if (!name || !bank_name || !account_number_last4) {
      return NextResponse.json(
        { error: 'Missing required fields: name, bank_name, account_number_last4' },
        { status: 400 }
      );
    }

    const result = await withDb(async (client) => {
      // Create trust account
      const accountResult = await client.query(
        `INSERT INTO trust_accounts (
          user_id, name, bank_name, account_number_last4,
          routing_number, account_type, currency, is_iolta
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [user.id, name, bank_name, account_number_last4, routing_number, account_type, currency, is_iolta]
      );

      return accountResult.rows[0];
    });

    return NextResponse.json({ account: result }, { status: 201 });
  } catch (error) {
    console.error('[TRUST_ACCOUNTS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create trust account' },
      { status: 500 }
    );
  }
}
