# Email Integration System

Phase 3A email integration for LEXORA - enterprise legal CRM.

## Features

### ✅ Part 1: Email Account Connection
- Gmail OAuth2 integration
- Outlook OAuth2 integration
- Account management (connect/disconnect)
- Sync settings configuration
- Manual sync trigger

### ✅ Part 2: Email Sync
- Automatic email sync (configurable frequency: 5/15/30/60 minutes)
- Download emails from configurable time range (7/30/90/365 days)
- Store emails in PostgreSQL with full-text search
- Parse email metadata (from, to, cc, bcc, subject, date)
- Extract email body (HTML + plain text)
- Track attachments (metadata only - download not implemented)

### ✅ Part 3: Email Viewer
- Email list page with pagination (50 emails per page)
- Search by subject/body (full-text search)
- Filter by sender, date range, linked/unlinked status
- Email detail page with full metadata
- HTML email rendering
- Link to case functionality

### ✅ Part 4: Case-Email Linking
- Manual linking (search and select case)
- Auto-linking rules:
  - Match sender email to client email
  - Match case number in subject line
  - Match client name in subject line
  - Match email domain to client domain
- Auto-link suggestions with confidence levels
- Bulk linking (multiple emails to one case)
- Case email tab showing all linked emails

### ⚠️ Part 5: Email Sending (NOT IMPLEMENTED)
- Email sending functionality was not included in this phase
- Can be added in a future phase

### ✅ Part 6: Email Search
- Full-text search (subject + body)
- Filter by sender, date range, linked/unlinked status
- Filter by case
- Pagination support

## Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
# Email Integration
EMAIL_ENCRYPTION_KEY=your-32-char-secret-key-here
GMAIL_CLIENT_ID=your-gmail-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/email/oauth/gmail/callback
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
OUTLOOK_REDIRECT_URI=http://localhost:3000/api/email/oauth/outlook/callback
```

### 2. Database Migration

Run the email integration migration:

```bash
psql $DATABASE_URL -f database/migrations/018_email_integration.sql
```

### 3. OAuth Setup

#### Gmail OAuth2
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable Gmail API
4. Create OAuth2 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/email/oauth/gmail/callback`
6. Copy Client ID and Client Secret to `.env.local`

#### Outlook OAuth2
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory > App registrations
3. Create a new app registration
4. Add redirect URI: `http://localhost:3000/api/email/oauth/outlook/callback`
5. Add API permissions: `Mail.Read`, `Mail.Send`, `offline_access`
6. Create a client secret
7. Copy Application (client) ID and Client Secret to `.env.local`

### 4. Generate Encryption Key

Generate a secure 32-character key for `EMAIL_ENCRYPTION_KEY`:

```bash
openssl rand -base64 32
```

## Usage

### Connect Email Account

1. Navigate to **Settings > Email**
2. Click **Connect Gmail** or **Connect Outlook**
3. Authorize LEXORA to access your email
4. Configure sync settings (frequency, age, folders)

### View Emails

1. Navigate to **Emails** from the sidebar
2. Use search and filters to find emails
3. Click an email to view details
4. Click **Link to Case** to associate with a case

### Link Emails to Cases

1. Open an email detail page
2. Click **Link to Case**
3. Search for the case
4. Select and confirm

### View Case Emails

1. Navigate to a case detail page
2. Scroll to the **Linked Emails** section
3. See all emails associated with this case

### Auto-Linking

Auto-linking runs during email sync and suggests matches based on:
- Sender email matches client email (high confidence)
- Case number in subject line (high confidence)
- Client name in subject line (medium confidence)
- Email domain matches client domain (low confidence)

## API Endpoints

### Email Accounts
- `GET /api/email/accounts` - List connected accounts
- `DELETE /api/email/accounts?accountId={id}` - Disconnect account
- `PATCH /api/email/accounts` - Update account settings

### OAuth
- `GET /api/email/oauth/gmail` - Get Gmail auth URL
- `GET /api/email/oauth/gmail/callback` - Gmail OAuth callback
- `GET /api/email/oauth/outlook` - Get Outlook auth URL
- `GET /api/email/oauth/outlook/callback` - Outlook OAuth callback

### Email Sync
- `POST /api/email/sync` - Trigger manual sync

### Emails
- `GET /api/email` - List emails (with filters)
- `GET /api/email/{id}` - Get email detail
- `POST /api/email/{id}/link` - Link email to case
- `DELETE /api/email/{id}/link` - Unlink email from case

### Auto-Linking
- `GET /api/email/auto-link` - Get auto-link suggestions
- `POST /api/email/auto-link` - Apply auto-link suggestion
- `POST /api/email/bulk-link` - Bulk link emails to case

## Security

### Token Encryption
- Access and refresh tokens are encrypted using AES-256-GCM
- Encryption key is stored in environment variable
- Never logged or exposed in API responses

### OAuth Flow
- Uses standard OAuth2 authorization code flow
- Refresh tokens stored encrypted
- Automatic token refresh before expiration

### Rate Limiting
- Email sync processes in batches (max 500 emails per sync)
- Recommended sync frequency: 15-30 minutes
- Avoid syncing too frequently to prevent API rate limits

## Database Schema

### `email_accounts`
- User's connected email accounts
- Encrypted tokens
- Sync settings (JSONB)
- Last sync timestamp

### `emails`
- Synced email messages
- Full-text search index on subject + body
- Link to case (nullable)
- Auto-linked flag

### `email_attachments`
- Attachment metadata
- Storage path (for future file storage)

## Components

### Pages
- `/settings/email` - Email settings and account management
- `/emails` - Email list with search/filters
- `/emails/[id]` - Email detail view

### Components
- `components/email/link-to-case.tsx` - Case linking dialog
- `components/email/case-emails.tsx` - Case email tab
- `components/email/email-sync-status.tsx` - Sync status widget

### Library
- `lib/email/encryption.ts` - Token encryption/decryption
- `lib/email/oauth.ts` - OAuth helpers
- `lib/email/sync.ts` - Email sync logic
- `lib/email/auto-link.ts` - Auto-linking rules

## Future Enhancements

1. **Email Sending**
   - Compose and send emails from LEXORA
   - Email templates with variables
   - Track sent emails

2. **Attachment Storage**
   - Download and store email attachments
   - Link attachments to document vault

3. **Email Threading**
   - Group emails by thread_id
   - Show conversation view

4. **Advanced Auto-Linking**
   - Machine learning-based matching
   - Learn from user corrections
   - Suggest multiple potential cases

5. **Two-Way Sync**
   - Sync sent emails
   - Mark emails as read/unread
   - Archive/delete emails

6. **Email Analytics**
   - Response time metrics
   - Email volume by case
   - Client communication stats

## Troubleshooting

### Sync Not Working
- Check environment variables are set correctly
- Verify OAuth credentials are valid
- Check database connection
- Review logs for errors

### Token Expired
- Tokens are automatically refreshed
- If refresh fails, reconnect the account

### Missing Emails
- Check sync settings (age, folders)
- Verify account has sync enabled
- Trigger manual sync

### Auto-Link Not Working
- Ensure client emails are populated
- Check case numbers in database
- Review auto-link confidence levels

## Dependencies

```json
{
  "@googleapis/gmail": "^latest",
  "@microsoft/microsoft-graph-client": "^latest",
  "mailparser": "^latest",
  "imap-simple": "^latest",
  "nodemailer": "^latest"
}
```

## License

Part of LEXORA - Enterprise Legal CRM
