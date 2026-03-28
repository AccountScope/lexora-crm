/**
 * Client Ledgers API
 * GET - List all client ledgers
 * POST - Create new client ledger
 */

import { NextRequest, NextResponse } from 'next/server';
import { withDb, query } from '@/lib/api/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const trustAccountId = searchParams.get('trust_account_id');

    let sql = `
      SELECT 
        cl.*,
        json_build_object('id', c.id, 'name', c.name, 'email', c.email) as client,
        json_build_object('id', ta.id, 'name', ta.name) as trust_account
      FROM client_ledgers cl
      LEFT JOIN clients c ON cl.client_id = c.id
      LEFT JOIN trust_accounts ta ON cl.trust_account_id = ta.id
      WHERE cl.user_id = $1
    `;
    
    const params: any[] = [user.id];
    let paramCount = 1;

    if (clientId) {
      paramCount++;
      sql += ` AND cl.client_id = $${paramCount}`;
      params.push(clientId);
    }

    if (trustAccountId) {
      paramCount++;
      sql += ` AND cl.trust_account_id = $${paramCount}`;
      params.push(trustAccountId);
    }

    sql += ` ORDER BY cl.created_at DESC`;

    const result = await query(sql, params);

    return NextResponse.json({ ledgers: result.rows });
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
    const user = await getCurrentUser(request);
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

    const ledger = await withDb(async (client) => {
      // Check if ledger already exists
      const existingResult = await client.query(
        `SELECT id FROM client_ledgers 
         WHERE client_id = $1 AND trust_account_id = $2`,
        [client_id, trust_account_id]
      );

      if (existingResult.rows.length > 0) {
        throw new Error('Client ledger already exists for this account');
      }

      // Create ledger
      const ledgerResult = await client.query(
        `INSERT INTO client_ledgers (client_id, trust_account_id, user_id, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [client_id, trust_account_id, user.id, user.id]
      );

      // Fetch with relations
      const fullResult = await client.query(
        `SELECT 
          cl.*,
          json_build_object('id', c.id, 'name', c.name, 'email', c.email) as client,
          json_build_object('id', ta.id, 'name', ta.name) as trust_account
         FROM client_ledgers cl
         LEFT JOIN clients c ON cl.client_id = c.id
         LEFT JOIN trust_accounts ta ON cl.trust_account_id = ta.id
         WHERE cl.id = $1`,
        [ledgerResult.rows[0].id]
      );

      return fullResult.rows[0];
    });

    return NextResponse.json({ ledger }, { status: 201 });
  } catch (error) {
    console.error('[CLIENT_LEDGERS_POST]', error);
    const message = error instanceof Error ? error.message : 'Failed to create client ledger';
    const status = message.includes('already exists') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
