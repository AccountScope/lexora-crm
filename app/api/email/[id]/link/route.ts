import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleApiError, success } from '@/lib/api/response';
import { db } from '@/lib/api/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser(request);
    const emailId = params.id;
    const body = await request.json();
    const { caseId } = body;

    if (!caseId) {
      throw new Error('Case ID is required');
    }

    // Verify email ownership
    const email = await db.queryOne(
      `SELECT e.id FROM emails e
      JOIN email_accounts ea ON e.email_account_id = ea.id
      WHERE e.id = $1 AND ea.user_id = $2`,
      [emailId, user.id]
    );

    if (!email) {
      throw new Error('Email not found or unauthorized');
    }

    // Link email to case
    await db.query(
      'UPDATE emails SET case_id = $1 WHERE id = $2',
      [caseId, emailId]
    );

    return success({ message: 'Email linked to case' });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser(request);
    const emailId = params.id;

    // Verify email ownership
    const email = await db.queryOne(
      `SELECT e.id FROM emails e
      JOIN email_accounts ea ON e.email_account_id = ea.id
      WHERE e.id = $1 AND ea.user_id = $2`,
      [emailId, user.id]
    );

    if (!email) {
      throw new Error('Email not found or unauthorized');
    }

    // Unlink email from case
    await db.query(
      'UPDATE emails SET case_id = NULL, auto_linked = FALSE WHERE id = $1',
      [emailId]
    );

    return success({ message: 'Email unlinked from case' });
  } catch (error) {
    return handleApiError(error);
  }
}
