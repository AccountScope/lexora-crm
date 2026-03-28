import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleApiError, success } from '@/lib/api/response';
import { db } from '@/lib/api/db';
import { decrypt } from '@/lib/email/encryption';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    const accounts = await db.query<{
      id: string;
      provider: string;
      email_address: string;
      sync_enabled: boolean;
      last_synced_at: Date | null;
      sync_settings: any;
      created_at: Date;
    }>(
      `SELECT id, provider, email_address, sync_enabled, last_synced_at, sync_settings, created_at
      FROM email_accounts
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [user.id]
    );

    return success({ data: accounts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      throw new Error('Account ID is required');
    }

    // Verify ownership
    const account = await db.queryOne(
      'SELECT id FROM email_accounts WHERE id = $1 AND user_id = $2',
      [accountId, user.id]
    );

    if (!account) {
      throw new Error('Account not found or unauthorized');
    }

    // Delete account (cascade will delete emails and attachments)
    await db.query('DELETE FROM email_accounts WHERE id = $1', [accountId]);

    return success({ message: 'Email account disconnected' });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const { accountId, syncEnabled, syncSettings } = body;

    if (!accountId) {
      throw new Error('Account ID is required');
    }

    // Verify ownership
    const account = await db.queryOne(
      'SELECT id FROM email_accounts WHERE id = $1 AND user_id = $2',
      [accountId, user.id]
    );

    if (!account) {
      throw new Error('Account not found or unauthorized');
    }

    // Update settings
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (syncEnabled !== undefined) {
      updates.push(`sync_enabled = $${paramCount++}`);
      values.push(syncEnabled);
    }

    if (syncSettings !== undefined) {
      updates.push(`sync_settings = $${paramCount++}`);
      values.push(syncSettings);
    }

    if (updates.length > 0) {
      values.push(accountId);
      await db.query(
        `UPDATE email_accounts SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        values
      );
    }

    return success({ message: 'Email account updated' });
  } catch (error) {
    return handleApiError(error);
  }
}
