import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleApiError, success } from '@/lib/api/response';
import { syncEmailAccount, syncAllUserAccounts } from '@/lib/email/sync';
import { db } from '@/lib/http/db';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const { accountId } = body;

    if (accountId) {
      // Sync specific account
      // Verify ownership
      const account = await db.queryOne(
        'SELECT id FROM email_accounts WHERE id = $1 AND user_id = $2',
        [accountId, user.id]
      );

      if (!account) {
        throw new Error('Account not found or unauthorized');
      }

      const count = await syncEmailAccount(accountId);
      return success({ data: { accountId, emailsCount: count } });
    } else {
      // Sync all accounts
      const results = await syncAllUserAccounts(user.id);
      return success({ data: { results } });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
