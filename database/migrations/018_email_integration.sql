BEGIN;

-- Email accounts
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail','outlook')),
  email_address CITEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  sync_settings JSONB NOT NULL DEFAULT jsonb_build_object(
    'frequency', 15,
    'downloadUnreadOnly', true,
    'maxAgeDays', 30,
    'direction', 'download',
    'folders', jsonb_build_array('INBOX'),
    'downloadAttachments', false
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, email_address)
);
CREATE INDEX IF NOT EXISTS email_accounts_user_idx ON email_accounts(user_id);

-- Emails
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  message_id TEXT UNIQUE,
  thread_id TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails TEXT[] NOT NULL DEFAULT '{}',
  cc_emails TEXT[] NOT NULL DEFAULT '{}',
  bcc_emails TEXT[] NOT NULL DEFAULT '{}',
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  date TIMESTAMPTZ NOT NULL,
  case_id UUID REFERENCES matters(id) ON DELETE SET NULL,
  auto_linked BOOLEAN NOT NULL DEFAULT FALSE,
  has_attachments BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS emails_account_idx ON emails(email_account_id);
CREATE INDEX IF NOT EXISTS emails_case_idx ON emails(case_id);
CREATE INDEX IF NOT EXISTS emails_date_idx ON emails(date DESC);
-- Full text search index (subject + body_text)
CREATE INDEX IF NOT EXISTS emails_search_idx ON emails USING GIN (to_tsvector('simple', coalesce(subject,'') || ' ' || coalesce(body_text,'')));

-- Email attachments
CREATE TABLE IF NOT EXISTS email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content_type TEXT,
  size BIGINT,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS email_attachments_email_idx ON email_attachments(email_id);

COMMIT;
