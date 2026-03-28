-- Migration 012: Login Security + GDPR Compliance
-- LEXORA Enterprise Legal CRM

BEGIN;

-- ========================================================================
-- LOGIN SECURITY TABLES
-- ========================================================================

-- Track all login attempts (success + failure)
CREATE TABLE login_attempts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               TEXT NOT NULL,
    ip_address          INET NOT NULL,
    success             BOOLEAN NOT NULL,
    device              TEXT,
    browser             TEXT,
    location            TEXT,
    failure_reason      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX login_attempts_email_idx ON login_attempts(email);
CREATE INDEX login_attempts_ip_idx ON login_attempts(ip_address);
CREATE INDEX login_attempts_created_idx ON login_attempts(created_at DESC);

-- Track blocked IPs (temporary bans)
CREATE TABLE blocked_ips (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address          INET NOT NULL UNIQUE,
    reason              TEXT NOT NULL,
    blocked_until       TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX blocked_ips_address_idx ON blocked_ips(ip_address);
CREATE INDEX blocked_ips_until_idx ON blocked_ips(blocked_until);

-- Add login security fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMPTZ;

-- ========================================================================
-- GDPR COMPLIANCE TABLES
-- ========================================================================

-- Data export requests (Article 15 - Right to Access)
CREATE TABLE data_export_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'pending', -- pending, processing, ready, downloaded, expired
    file_path           TEXT,
    download_token      TEXT UNIQUE,
    expires_at          TIMESTAMPTZ,
    downloaded_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);

CREATE INDEX data_export_user_idx ON data_export_requests(user_id);
CREATE INDEX data_export_status_idx ON data_export_requests(status);

-- Account deletion requests (Article 17 - Right to be Forgotten)
CREATE TABLE deletion_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'pending', -- pending, cancelled, completed
    cancellation_token  TEXT UNIQUE,
    deletion_date       TIMESTAMPTZ NOT NULL, -- 30 days from request
    cancelled_at        TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX deletion_requests_user_idx ON deletion_requests(user_id);
CREATE INDEX deletion_requests_date_idx ON deletion_requests(deletion_date);

-- Add deletion tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

-- Consent records (GDPR compliance)
CREATE TABLE consent_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    consent_type        TEXT NOT NULL, -- privacy_policy, terms_of_service, cookies, marketing
    version             TEXT NOT NULL,
    accepted            BOOLEAN NOT NULL,
    ip_address          INET,
    user_agent          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX consent_records_user_idx ON consent_records(user_id);
CREATE INDEX consent_records_type_idx ON consent_records(consent_type);

-- Marketing preferences
CREATE TABLE marketing_preferences (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    product_updates     BOOLEAN DEFAULT FALSE,
    tips_best_practices BOOLEAN DEFAULT FALSE,
    promotional_offers  BOOLEAN DEFAULT FALSE,
    share_usage_data    BOOLEAN DEFAULT FALSE,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Policy versions (track changes to privacy policy / TOS)
CREATE TABLE policy_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_type         TEXT NOT NULL, -- privacy_policy, terms_of_service
    version             TEXT NOT NULL,
    content             TEXT NOT NULL,
    effective_date      DATE NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (policy_type, version)
);

-- ========================================================================
-- HELPER FUNCTIONS
-- ========================================================================

-- Function to check if IP is currently blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(check_ip INET)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM blocked_ips
        WHERE ip_address = check_ip
        AND blocked_until > NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is currently locked
CREATE OR REPLACE FUNCTION is_user_locked(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE email = user_email
        AND locked_until IS NOT NULL
        AND locked_until > NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
    p_email TEXT,
    p_ip INET,
    p_success BOOLEAN,
    p_device TEXT DEFAULT NULL,
    p_browser TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_failure_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO login_attempts (
        email, ip_address, success, device, browser, location, failure_reason
    ) VALUES (
        p_email, p_ip, p_success, p_device, p_browser, p_location, p_failure_reason
    );
    
    -- If failed, increment failed login count
    IF NOT p_success THEN
        UPDATE users
        SET 
            failed_login_count = failed_login_count + 1,
            last_failed_login = NOW()
        WHERE email = p_email;
        
        -- Lock account after 5 failed attempts
        UPDATE users
        SET locked_until = NOW() + INTERVAL '15 minutes'
        WHERE email = p_email
        AND failed_login_count >= 5
        AND (locked_until IS NULL OR locked_until < NOW());
    ELSE
        -- Reset failed login count on success
        UPDATE users
        SET 
            failed_login_count = 0,
            last_failed_login = NULL,
            locked_until = NULL
        WHERE email = p_email;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;
