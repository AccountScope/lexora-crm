import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleApiError, success } from '@/lib/api/response';
import { db } from '@/lib/http/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    
    const caseId = searchParams.get('caseId');
    const search = searchParams.get('search');
    const sender = searchParams.get('sender');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const linked = searchParams.get('linked'); // 'true', 'false', or null (all)
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query
    const conditions: string[] = ['ea.user_id = $1'];
    const values: any[] = [user.id];
    let paramCount = 2;

    if (caseId) {
      conditions.push(`e.case_id = $${paramCount++}`);
      values.push(caseId);
    }

    if (linked === 'true') {
      conditions.push('e.case_id IS NOT NULL');
    } else if (linked === 'false') {
      conditions.push('e.case_id IS NULL');
    }

    if (sender) {
      conditions.push(`e.from_email ILIKE $${paramCount++}`);
      values.push(`%${sender}%`);
    }

    if (dateFrom) {
      conditions.push(`e.date >= $${paramCount++}`);
      values.push(dateFrom);
    }

    if (dateTo) {
      conditions.push(`e.date <= $${paramCount++}`);
      values.push(dateTo);
    }

    if (search) {
      conditions.push(`(
        e.subject ILIKE $${paramCount} OR 
        e.body_text ILIKE $${paramCount} OR
        to_tsvector('simple', coalesce(e.subject,'') || ' ' || coalesce(e.body_text,'')) @@ plainto_tsquery('simple', $${paramCount})
      )`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count
      FROM emails e
      JOIN email_accounts ea ON e.email_account_id = ea.id
      WHERE ${whereClause}`,
      values
    );

    const total = countResult?.count || 0;

    // Get emails
    values.push(limit, offset);
    const emails = await db.query<{
      id: string;
      from_email: string;
      from_name: string | null;
      subject: string;
      date: Date;
      case_id: string | null;
      case_number: string | null;
      has_attachments: boolean;
    }>(
      `SELECT 
        e.id, e.from_email, e.from_name, e.subject, e.date, 
        e.case_id, m.case_number, e.has_attachments
      FROM emails e
      JOIN email_accounts ea ON e.email_account_id = ea.id
      LEFT JOIN matters m ON e.case_id = m.id
      WHERE ${whereClause}
      ORDER BY e.date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

    return success({
      data: {
        emails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
