BEGIN;
CREATE TABLE audit_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type          TEXT NOT NULL,
    event_type          TEXT NOT NULL,
    target_table        TEXT NOT NULL,
    target_id           UUID,
    request_id          UUID,
    ip_address          INET,
    user_agent          TEXT,
    changes             JSONB,
    data_classification data_classification NOT NULL DEFAULT 'RESTRICTED',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_event_idx ON audit_logs(event_type);
CREATE INDEX audit_logs_target_idx ON audit_logs(target_table, target_id);

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_no_update
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
COMMIT;
