import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleApiError, success } from '@/lib/api/response';
import { bulkLinkEmails } from '@/lib/email/auto-link';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const { emailIds, caseId } = body;

    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      throw new Error('Email IDs array is required');
    }

    if (!caseId) {
      throw new Error('Case ID is required');
    }

    const count = await bulkLinkEmails(emailIds, caseId);
    return success({ data: { count }, message: `${count} emails linked to case` });
  } catch (error) {
    return handleApiError(error);
  }
}
