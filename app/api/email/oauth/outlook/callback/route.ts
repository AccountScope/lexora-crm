import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { exchangeOutlookCode, storeEmailAccount } from '@/lib/email/oauth';
import { Client } from '@microsoft/microsoft-graph-client';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      throw new Error('Authorization code is required');
    }

    const tokens = await exchangeOutlookCode(code);

    // Get user's email address
    const client = Client.init({
      authProvider: (done) => {
        done(null, tokens.accessToken);
      },
    });
    const profile = await client.api('/me').select('mail').get();
    const emailAddress = profile.mail || profile.userPrincipalName;

    // Store account
    await storeEmailAccount(
      user.id,
      'outlook',
      emailAddress,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresAt
    );

    // Redirect to settings page
    return NextResponse.redirect(new URL('/settings/email?success=outlook', request.url));
  } catch (error) {
    console.error('Outlook OAuth callback error:', error);
    return NextResponse.redirect(new URL('/settings/email?error=outlook', request.url));
  }
}
