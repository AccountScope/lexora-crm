BEGIN;

CREATE TYPE deadline_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE deadline_status AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'MISSED');
CREATE TYPE notification_channel AS ENUM ('EMAIL', 'IN_APP', 'PUSH');
CREATE TYPE notification_frequency AS ENUM ('INSTANT', 'DAILY', 'WEEKLY');

CREATE TABLE court_deadline_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    jurisdiction TEXT,
    description TEXT,
    offset_days INTEGER NOT NULL DEFAULT 30,
    default_priority deadline_priority NOT NULL DEFAULT 'MEDIUM',
    default_status deadline_status NOT NULL DEFAULT 'PLANNED',
    reminder_offsets INTEGER[] NOT NULL DEFAULT ARRAY[7,3,1],
    metadata JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    case_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ NOT NULL,
    priority deadline_priority NOT NULL DEFAULT 'MEDIUM',
    status deadline_status NOT NULL DEFAULT 'PLANNED',
    reminder_offsets INTEGER[] NOT NULL DEFAULT ARRAY[7,3,1],
    recurrence_rule TEXT,
    recurrence_ends_on TIMESTAMPTZ,
    recurrence_parent_id UUID REFERENCES deadlines(id) ON DELETE CASCADE,
    rule_template_id UUID REFERENCES court_deadline_templates(id) ON DELETE SET NULL,
    offset_days INTEGER,
    source_date TIMESTAMPTZ,
    computed_from_rule BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX deadlines_case_idx ON deadlines(case_id);
CREATE INDEX deadlines_due_date_idx ON deadlines(due_date);
CREATE INDEX deadlines_assigned_idx ON deadlines(assigned_to);
CREATE INDEX deadlines_status_idx ON deadlines(status);

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    channels notification_channel[] NOT NULL DEFAULT ARRAY['EMAIL','IN_APP']::notification_channel[],
    email_frequency notification_frequency NOT NULL DEFAULT 'INSTANT',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    digest_hour INTEGER NOT NULL DEFAULT 7,
    toggles JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    url TEXT,
    related_case_id UUID REFERENCES matters(id) ON DELETE SET NULL,
    related_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    deadline_id UUID REFERENCES deadlines(id) ON DELETE SET NULL,
    priority deadline_priority,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX notifications_user_idx ON notifications(user_id, read_at);
CREATE INDEX notifications_created_idx ON notifications(created_at DESC);

CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type TEXT NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    payload JSONB,
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    last_error TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    deadline_id UUID REFERENCES deadlines(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX email_queue_status_idx ON email_queue(status, scheduled_for);

CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES email_queue(id) ON DELETE SET NULL,
    notification_type TEXT,
    to_email TEXT,
    subject TEXT,
    body TEXT,
    status TEXT NOT NULL,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX email_logs_created_idx ON email_logs(created_at DESC);

COMMIT;
