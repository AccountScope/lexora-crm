import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleApiError, success } from '@/lib/api/response';
import { getAutoLinkSuggestions, applyAutoLink } from '@/lib/email/auto-link';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const suggestions = await getAutoLinkSuggestions(user.id);
    return success({ data: suggestions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const { emailId, caseId } = body;

    if (!emailId || !caseId) {
      throw new Error('Email ID and Case ID are required');
    }

    await applyAutoLink(emailId, caseId);
    return success({ message: 'Auto-link applied' });
  } catch (error) {
    return handleApiError(error);
  }
}
