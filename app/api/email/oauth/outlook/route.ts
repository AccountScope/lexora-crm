import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleApiError, success } from '@/lib/api/response';
import { getOutlookAuthUrl } from '@/lib/email/oauth';

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);
    const authUrl = getOutlookAuthUrl();
    return success({ data: { authUrl } });
  } catch (error) {
    return handleApiError(error);
  }
}
