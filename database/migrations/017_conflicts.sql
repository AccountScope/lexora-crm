BEGIN;

CREATE TYPE conflict_status AS ENUM ('pending', 'accepted', 'waived', 'rejected', 'escalated');
CREATE TYPE conflict_severity AS ENUM ('high', 'medium', 'low');
CREATE TYPE conflict_type AS ENUM ('direct', 'opposing', 'related', 'former_client', 'third_party');

CREATE TABLE conflict_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    opposing_parties TEXT[] NOT NULL,
    other_parties TEXT[] NOT NULL DEFAULT '{}',
    case_type TEXT,
    description TEXT,
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status conflict_status NOT NULL DEFAULT 'pending',
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX conflict_checks_client_idx ON conflict_checks (LOWER(client_name));
CREATE INDEX conflict_checks_status_idx ON conflict_checks (status);
CREATE INDEX conflict_checks_created_idx ON conflict_checks (created_at DESC);
CREATE INDEX conflict_checks_requested_idx ON conflict_checks (requested_by);
CREATE INDEX conflict_checks_opposing_idx ON conflict_checks USING GIN (opposing_parties);
CREATE INDEX conflict_checks_other_idx ON conflict_checks USING GIN (other_parties);

CREATE TABLE conflicts_found (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conflict_check_id UUID NOT NULL REFERENCES conflict_checks(id) ON DELETE CASCADE,
    case_id UUID REFERENCES matters(id) ON DELETE SET NULL,
    conflict_type conflict_type NOT NULL,
    severity conflict_severity NOT NULL,
    party_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX conflicts_found_check_idx ON conflicts_found (conflict_check_id);
CREATE INDEX conflicts_found_case_idx ON conflicts_found (case_id);
CREATE INDEX conflicts_found_type_idx ON conflicts_found (conflict_type);
CREATE INDEX conflicts_found_severity_idx ON conflicts_found (severity);

CREATE TABLE conflict_waivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conflict_check_id UUID NOT NULL REFERENCES conflict_checks(id) ON DELETE CASCADE,
    case_id UUID REFERENCES matters(id) ON DELETE SET NULL,
    waiver_text TEXT NOT NULL,
    signed_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    signed_by TEXT,
    signed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX conflict_waivers_check_idx ON conflict_waivers (conflict_check_id);
CREATE INDEX conflict_waivers_case_idx ON conflict_waivers (case_id);
CREATE INDEX conflict_waivers_document_idx ON conflict_waivers (signed_document_id);

CREATE TABLE watch_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_name TEXT NOT NULL UNIQUE,
    reason TEXT,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX watch_list_added_idx ON watch_list (added_by);
CREATE INDEX watch_list_search_idx ON watch_list USING GIN (to_tsvector('english', party_name));

COMMIT;
