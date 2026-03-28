BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS two_factor_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS two_factor_locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS two_factor_recovery_token TEXT,
  ADD COLUMN IF NOT EXISTS two_factor_recovery_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS two_factor_force_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS two_factor_force_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS two_factor_session_revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
  ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verification_last_sent TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS backup_codes_user_id_idx ON backup_codes(user_id);
CREATE INDEX IF NOT EXISTS users_email_verification_token_idx ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS users_two_factor_recovery_token_idx ON users(two_factor_recovery_token);

COMMIT;
