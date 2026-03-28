import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { encrypt, decrypt } from './encryption';
import { db } from '@/lib/api/db';

// Gmail OAuth2 configuration
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/email/oauth/gmail/callback';

// Outlook OAuth2 configuration
const OUTLOOK_CLIENT_ID = process.env.OUTLOOK_CLIENT_ID;
const OUTLOOK_CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET;
const OUTLOOK_REDIRECT_URI = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3000/api/email/oauth/outlook/callback';

export type EmailProvider = 'gmail' | 'outlook';

/**
 * Get Gmail OAuth2 URL
 */
export function getGmailAuthUrl(): string {
  const oauth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent to get refresh token
  });
}

/**
 * Get Outlook OAuth2 URL
 */
export function getOutlookAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: OUTLOOK_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: OUTLOOK_REDIRECT_URI,
    response_mode: 'query',
    scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access',
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Exchange Gmail authorization code for tokens
 */
export async function exchangeGmailCode(code: string) {
  const oauth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
  );

  const { tokens } = await oauth2Client.getToken(code);
  
  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
  };
}

/**
 * Exchange Outlook authorization code for tokens
 */
export async function exchangeOutlookCode(code: string) {
  const params = new URLSearchParams({
    client_id: OUTLOOK_CLIENT_ID!,
    client_secret: OUTLOOK_CLIENT_SECRET!,
    code,
    redirect_uri: OUTLOOK_REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange Outlook code');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Refresh Gmail access token
 */
export async function refreshGmailToken(refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    accessToken: credentials.access_token!,
    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600 * 1000),
  };
}

/**
 * Refresh Outlook access token
 */
export async function refreshOutlookToken(refreshToken: string) {
  const params = new URLSearchParams({
    client_id: OUTLOOK_CLIENT_ID!,
    client_secret: OUTLOOK_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Outlook token');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Get valid access token for an email account (refresh if needed)
 */
export async function getValidAccessToken(accountId: string): Promise<string> {
  const account = await db.queryOne<{
    id: string;
    provider: EmailProvider;
    access_token: string | null;
    refresh_token: string | null;
    token_expires_at: Date | null;
  }>(
    'SELECT id, provider, access_token, refresh_token, token_expires_at FROM email_accounts WHERE id = $1',
    [accountId]
  );

  if (!account) {
    throw new Error('Email account not found');
  }

  // Check if token is still valid (with 5 min buffer)
  const now = new Date();
  const expiresAt = account.token_expires_at;
  const needsRefresh = !expiresAt || expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

  if (!needsRefresh && account.access_token) {
    return decrypt(account.access_token);
  }

  // Need to refresh token
  if (!account.refresh_token) {
    throw new Error('No refresh token available');
  }

  const decryptedRefreshToken = decrypt(account.refresh_token);
  
  let newTokens;
  if (account.provider === 'gmail') {
    newTokens = await refreshGmailToken(decryptedRefreshToken);
  } else {
    newTokens = await refreshOutlookToken(decryptedRefreshToken);
  }

  // Update database with new tokens
  await db.query(
    'UPDATE email_accounts SET access_token = $1, token_expires_at = $2 WHERE id = $3',
    [encrypt(newTokens.accessToken), newTokens.expiresAt, accountId]
  );

  return newTokens.accessToken;
}

/**
 * Store email account tokens (encrypted)
 */
export async function storeEmailAccount(
  userId: string,
  provider: EmailProvider,
  emailAddress: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date
) {
  const encryptedAccessToken = encrypt(accessToken);
  const encryptedRefreshToken = encrypt(refreshToken);

  const result = await db.queryOne<{ id: string }>(
    `INSERT INTO email_accounts 
      (user_id, provider, email_address, access_token, refresh_token, token_expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id, email_address) 
    DO UPDATE SET 
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expires_at = EXCLUDED.token_expires_at
    RETURNING id`,
    [userId, provider, emailAddress, encryptedAccessToken, encryptedRefreshToken, expiresAt]
  );

  return result?.id;
}
