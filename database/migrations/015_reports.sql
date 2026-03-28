BEGIN;

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('cases','time','billing','documents','users')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_template BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX reports_type_idx ON reports(type);
CREATE INDEX reports_created_by_idx ON reports(created_by);

CREATE TABLE report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly')),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    time_of_day TIME NOT NULL DEFAULT TIME '08:00',
    recipients TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    format TEXT NOT NULL CHECK (format IN ('excel','pdf','csv')),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX report_schedules_report_idx ON report_schedules(report_id);
CREATE INDEX report_schedules_enabled_idx ON report_schedules(enabled);

COMMIT;
