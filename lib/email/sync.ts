import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import { simpleParser, ParsedMail } from 'mailparser';
import { getValidAccessToken } from './oauth';
import { db } from '@/lib/api/db';

export type SyncSettings = {
  frequency: number; // minutes
  downloadUnreadOnly: boolean;
  maxAgeDays: number;
  direction: 'download' | 'two-way';
  folders: string[];
  downloadAttachments: boolean;
};

type EmailAccount = {
  id: string;
  provider: 'gmail' | 'outlook';
  email_address: string;
  sync_settings: SyncSettings;
  last_synced_at: Date | null;
};

/**
 * Sync emails for a specific account
 */
export async function syncEmailAccount(accountId: string): Promise<number> {
  const account = await db.queryOne<EmailAccount>(
    'SELECT id, provider, email_address, sync_settings, last_synced_at FROM email_accounts WHERE id = $1 AND sync_enabled = TRUE',
    [accountId]
  );

  if (!account) {
    throw new Error('Email account not found or sync disabled');
  }

  const accessToken = await getValidAccessToken(accountId);
  
  let emailsCount = 0;

  if (account.provider === 'gmail') {
    emailsCount = await syncGmailAccount(account, accessToken);
  } else {
    emailsCount = await syncOutlookAccount(account, accessToken);
  }

  // Update last_synced_at
  await db.query(
    'UPDATE email_accounts SET last_synced_at = NOW() WHERE id = $1',
    [accountId]
  );

  return emailsCount;
}

/**
 * Sync Gmail account
 */
async function syncGmailAccount(account: EmailAccount, accessToken: string): Promise<number> {
  const gmail = google.gmail({ version: 'v1' });
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const settings: SyncSettings = account.sync_settings as SyncSettings;
  
  // Calculate date filter
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - settings.maxAgeDays);
  const afterTimestamp = Math.floor(afterDate.getTime() / 1000);

  // Build query
  let query = `after:${afterTimestamp}`;
  if (settings.downloadUnreadOnly) {
    query += ' is:unread';
  }

  // Get messages list
  const listResponse = await gmail.users.messages.list({
    auth,
    userId: 'me',
    q: query,
    maxResults: 500, // Process in batches
  });

  const messages = listResponse.data.messages || [];
  let emailsCount = 0;

  // Process each message
  for (const message of messages) {
    try {
      const fullMessage = await gmail.users.messages.get({
        auth,
        userId: 'me',
        id: message.id!,
        format: 'raw',
      });

      const raw = fullMessage.data.raw;
      if (!raw) continue;

      const buffer = Buffer.from(raw, 'base64');
      const parsed = await simpleParser(buffer);

      await storeEmail(account.id, parsed, message.id!);
      emailsCount++;
    } catch (error) {
      console.error(`Failed to sync Gmail message ${message.id}:`, error);
    }
  }

  return emailsCount;
}

/**
 * Sync Outlook account
 */
async function syncOutlookAccount(account: EmailAccount, accessToken: string): Promise<number> {
  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });

  const settings: SyncSettings = account.sync_settings as SyncSettings;

  // Calculate date filter
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - settings.maxAgeDays);

  // Build filter
  let filter = `receivedDateTime ge ${afterDate.toISOString()}`;
  if (settings.downloadUnreadOnly) {
    filter += ' and isRead eq false';
  }

  // Get messages
  const messages = await client
    .api('/me/messages')
    .filter(filter)
    .top(500)
    .select('id,subject,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,body,hasAttachments,internetMessageId')
    .get();

  let emailsCount = 0;

  for (const message of messages.value || []) {
    try {
      await storeOutlookEmail(account.id, message);
      emailsCount++;
    } catch (error) {
      console.error(`Failed to sync Outlook message ${message.id}:`, error);
    }
  }

  return emailsCount;
}

/**
 * Store parsed email in database (Gmail)
 */
async function storeEmail(accountId: string, parsed: ParsedMail, messageId: string): Promise<void> {
  const from = parsed.from?.value[0];
  const toEmails = parsed.to?.value.map((a) => a.address || '') || [];
  const ccEmails = parsed.cc?.value.map((a) => a.address || '') || [];
  const bccEmails = parsed.bcc?.value.map((a) => a.address || '') || [];

  // Check if email already exists
  const exists = await db.queryOne(
    'SELECT id FROM emails WHERE message_id = $1',
    [messageId]
  );

  if (exists) {
    return; // Skip duplicate
  }

  const emailId = await db.queryOne<{ id: string }>(
    `INSERT INTO emails (
      email_account_id, message_id, from_email, from_name,
      to_emails, cc_emails, bcc_emails, subject,
      body_html, body_text, date, has_attachments
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id`,
    [
      accountId,
      messageId,
      from?.address || '',
      from?.name || '',
      toEmails,
      ccEmails,
      bccEmails,
      parsed.subject || '',
      parsed.html || '',
      parsed.text || '',
      parsed.date || new Date(),
      (parsed.attachments?.length || 0) > 0,
    ]
  );

  // Store attachments (if any)
  if (parsed.attachments && parsed.attachments.length > 0 && emailId) {
    for (const attachment of parsed.attachments) {
      await db.query(
        `INSERT INTO email_attachments (email_id, filename, content_type, size)
        VALUES ($1, $2, $3, $4)`,
        [emailId.id, attachment.filename || 'attachment', attachment.contentType || '', attachment.size || 0]
      );
    }
  }
}

/**
 * Store Outlook email in database
 */
async function storeOutlookEmail(accountId: string, message: any): Promise<void> {
  const from = message.from?.emailAddress;
  const toEmails = message.toRecipients?.map((r: any) => r.emailAddress?.address || '') || [];
  const ccEmails = message.ccRecipients?.map((r: any) => r.emailAddress?.address || '') || [];
  const bccEmails = message.bccRecipients?.map((r: any) => r.emailAddress?.address || '') || [];

  // Check if email already exists
  const exists = await db.queryOne(
    'SELECT id FROM emails WHERE message_id = $1',
    [message.internetMessageId || message.id]
  );

  if (exists) {
    return; // Skip duplicate
  }

  const emailId = await db.queryOne<{ id: string }>(
    `INSERT INTO emails (
      email_account_id, message_id, from_email, from_name,
      to_emails, cc_emails, bcc_emails, subject,
      body_html, body_text, date, has_attachments
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id`,
    [
      accountId,
      message.internetMessageId || message.id,
      from?.address || '',
      from?.name || '',
      toEmails,
      ccEmails,
      bccEmails,
      message.subject || '',
      message.body?.contentType === 'html' ? message.body.content : '',
      message.body?.contentType === 'text' ? message.body.content : '',
      new Date(message.receivedDateTime),
      message.hasAttachments || false,
    ]
  );
}

/**
 * Sync all enabled email accounts for a user
 */
export async function syncAllUserAccounts(userId: string): Promise<{ accountId: string; count: number }[]> {
  const accounts = await db.query<{ id: string }>(
    'SELECT id FROM email_accounts WHERE user_id = $1 AND sync_enabled = TRUE',
    [userId]
  );

  const results: { accountId: string; count: number }[] = [];

  for (const account of accounts) {
    try {
      const count = await syncEmailAccount(account.id);
      results.push({ accountId: account.id, count });
    } catch (error) {
      console.error(`Failed to sync account ${account.id}:`, error);
      results.push({ accountId: account.id, count: 0 });
    }
  }

  return results;
}
