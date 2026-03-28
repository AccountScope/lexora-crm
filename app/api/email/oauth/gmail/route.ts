import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleApiError, success } from '@/lib/api/response';
import { getGmailAuthUrl } from '@/lib/email/oauth';

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const authUrl = getGmailAuthUrl();
    return success({ data: { authUrl } });
  } catch (error) {
    return handleApiError(error);
  }
}
