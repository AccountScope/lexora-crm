import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleApiError, success } from '@/lib/api/response';
import { db } from '@/lib/api/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser(request);
    const emailId = params.id;

    const email = await db.queryOne<{
      id: string;
      from_email: string;
      from_name: string | null;
      to_emails: string[];
      cc_emails: string[];
      bcc_emails: string[];
      subject: string;
      body_html: string | null;
      body_text: string | null;
      date: Date;
      case_id: string | null;
      case_number: string | null;
      has_attachments: boolean;
    }>(
      `SELECT 
        e.id, e.from_email, e.from_name, e.to_emails, e.cc_emails, e.bcc_emails,
        e.subject, e.body_html, e.body_text, e.date, e.case_id, m.case_number,
        e.has_attachments
      FROM emails e
      JOIN email_accounts ea ON e.email_account_id = ea.id
      LEFT JOIN matters m ON e.case_id = m.id
      WHERE e.id = $1 AND ea.user_id = $2`,
      [emailId, user.id]
    );

    if (!email) {
      throw new Error('Email not found or unauthorized');
    }

    // Get attachments
    const attachments = await db.query<{
      id: string;
      filename: string;
      content_type: string | null;
      size: number | null;
    }>(
      `SELECT id, filename, content_type, size
      FROM email_attachments
      WHERE email_id = $1`,
      [emailId]
    );

    return success({ data: { ...email, attachments } });
  } catch (error) {
    return handleApiError(error);
  }
}
