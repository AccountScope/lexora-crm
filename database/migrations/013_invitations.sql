BEGIN;
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    token TEXT NOT NULL UNIQUE,
    custom_message TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX invitations_email_idx ON invitations(email);
CREATE INDEX invitations_status_idx ON invitations(status);
CREATE INDEX invitations_expires_idx ON invitations(expires_at);
CREATE INDEX invitations_invited_by_idx ON invitations(invited_by);

COMMIT;
