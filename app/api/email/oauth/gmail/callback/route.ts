import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleApiError } from '@/lib/api/response';
import { exchangeGmailCode, storeEmailAccount } from '@/lib/email/oauth';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      throw new Error('Authorization code is required');
    }

    const tokens = await exchangeGmailCode(code);

    // Get user's email address
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: tokens.accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });

    const emailAddress = profile.data.emailAddress!;

    // Store account
    await storeEmailAccount(
      user.id,
      'gmail',
      emailAddress,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresAt
    );

    // Redirect to settings page
    return NextResponse.redirect(new URL('/settings/email?success=gmail', request.url));
  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    return NextResponse.redirect(new URL('/settings/email?error=gmail', request.url));
  }
}
