-- LEXORA Phase 1 MVP Database Schema
-- Compatible with Supabase-managed Postgres and self-hosted PostgreSQL

BEGIN;

-- ------------------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ------------------------------------------------------------------------
-- Enumerated Types
-- ------------------------------------------------------------------------
CREATE TYPE data_classification AS ENUM (
    'INTERNAL_ONLY',
    'FIRM_CONFIDENTIAL',
    'CLIENT_VISIBLE',
    'CLIENT_DOWNLOADABLE',
    'RESTRICTED'
);

CREATE TYPE user_status AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED');
CREATE TYPE user_type AS ENUM ('STAFF', 'CLIENT');
CREATE TYPE matter_status AS ENUM ('OPEN', 'PENDING', 'ON_HOLD', 'CLOSED');
CREATE TYPE document_status AS ENUM ('DRAFT', 'FINAL', 'ARCHIVED');
CREATE TYPE custody_event_type AS ENUM ('CREATED', 'UPLOADED', 'TRANSFERRED', 'ACCESSED', 'DOWNLOADED', 'PUBLISHED', 'CHECKSUM_VERIFIED');
CREATE TYPE time_entry_status AS ENUM ('UNBILLED', 'INVOICED', 'WRITEOFF');
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'VOID');

-- ------------------------------------------------------------------------
-- RBAC: Roles & Permissions
-- ------------------------------------------------------------------------
CREATE TABLE roles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL UNIQUE,
    description         TEXT,
    is_system           BOOLEAN NOT NULL DEFAULT FALSE,
    data_classification data_classification NOT NULL DEFAULT 'INTERNAL_ONLY',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key                 TEXT NOT NULL UNIQUE,
    description         TEXT,
    data_classification data_classification NOT NULL DEFAULT 'INTERNAL_ONLY',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id             UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id       UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    data_classification data_classification NOT NULL DEFAULT 'INTERNAL_ONLY',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- ------------------------------------------------------------------------
-- Users & Clients
-- ------------------------------------------------------------------------
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_auth_id    TEXT UNIQUE,
    user_type           user_type NOT NULL,
    status              user_status NOT NULL DEFAULT 'INVITED',
    email               CITEXT NOT NULL UNIQUE,
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    phone               TEXT,
    timezone            TEXT,
    last_login_at       TIMESTAMPTZ,
    data_classification data_classification NOT NULL DEFAULT 'INTERNAL_ONLY',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX users_status_idx ON users(status);
CREATE INDEX users_type_idx ON users(user_type);

CREATE TABLE user_roles (
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id             UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    data_classification data_classification NOT NULL DEFAULT 'INTERNAL_ONLY',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE clients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_reference_code TEXT UNIQUE,
    legal_name          TEXT NOT NULL,
    display_name        TEXT,
    status              TEXT NOT NULL DEFAULT 'ACTIVE',
    primary_contact_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    billing_email       CITEXT,
    phone               TEXT,
    address_line1       TEXT,
    address_line2       TEXT,
    city                TEXT,
    region              TEXT,
    postal_code         TEXT,
    country_code        CHAR(2),
    notes               TEXT,
    data_classification data_classification NOT NULL DEFAULT 'FIRM_CONFIDENTIAL',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX clients_status_idx ON clients(status);

-- ------------------------------------------------------------------------
-- Matters / Cases
-- ------------------------------------------------------------------------
CREATE TABLE matters (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    matter_number       TEXT NOT NULL UNIQUE,
    title               TEXT NOT NULL,
    description         TEXT,
    status              matter_status NOT NULL DEFAULT 'OPEN',
    practice_area       TEXT,
    lead_attorney_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    opens_on            DATE NOT NULL DEFAULT CURRENT_DATE,
    closes_on           DATE,
    data_classification data_classification NOT NULL DEFAULT 'FIRM_CONFIDENTIAL',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX matters_client_id_idx ON matters(client_id);
CREATE INDEX matters_status_idx ON matters(status);

CREATE TABLE matter_participants (
    matter_id           UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_role    TEXT NOT NULL,
    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
    data_classification data_classification NOT NULL DEFAULT 'FIRM_CONFIDENTIAL',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (matter_id, user_id)
);

-- ------------------------------------------------------------------------
-- Documents & Chain of Custody
-- ------------------------------------------------------------------------
CREATE TABLE documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id           UUID REFERENCES matters(id) ON DELETE SET NULL,
    client_id           UUID REFERENCES clients(id) ON DELETE SET NULL,
    title               TEXT NOT NULL,
    document_type       TEXT,
    status              document_status NOT NULL DEFAULT 'DRAFT',
    latest_version_id   UUID,
    checksum            TEXT,
    tags                TEXT[],
    created_by          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    data_classification data_classification NOT NULL DEFAULT 'FIRM_CONFIDENTIAL',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX documents_matter_id_idx ON documents(matter_id);
CREATE INDEX documents_client_id_idx ON documents(client_id);

CREATE TABLE document_versions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number      INTEGER NOT NULL,
    storage_bucket      TEXT NOT NULL,
    storage_path        TEXT NOT NULL,
    file_size_bytes     BIGINT NOT NULL,
    mime_type           TEXT,
    checksum            TEXT NOT NULL,
    uploaded_by         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes               TEXT,
    signed_hash         TEXT,
    available_to_client BOOLEAN NOT NULL DEFAULT FALSE,
    data_classification data_classification NOT NULL DEFAULT 'FIRM_CONFIDENTIAL',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, version_number)
);

ALTER TABLE documents
    ADD CONSTRAINT documents_latest_version_fk
    FOREIGN KEY (latest_version_id) REFERENCES document_versions(id) ON DELETE SET NULL;

CREATE TABLE document_chain_of_custody (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
    event_type          custody_event_type NOT NULL,
    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    performed_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    previous_location   TEXT,
    new_location        TEXT,
    hash_verification   TEXT,
    metadata            JSONB,
    signature           TEXT,
    data_classification data_classification NOT NULL DEFAULT 'FIRM_CONFIDENTIAL',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX doc_chain_version_idx ON document_chain_of_custody(document_version_id);
CREATE INDEX doc_chain_event_idx ON document_chain_of_custody(event_type);

-- ------------------------------------------------------------------------
-- Billing: Invoices & Time Entries
-- ------------------------------------------------------------------------
CREATE TABLE invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    matter_id           UUID REFERENCES matters(id) ON DELETE SET NULL,
    invoice_number      TEXT NOT NULL UNIQUE,
    status              invoice_status NOT NULL DEFAULT 'DRAFT',
    issue_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date            DATE,
    currency_code       CHAR(3) NOT NULL DEFAULT 'GBP',
    subtotal_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
    balance_due         NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes               TEXT,
    issued_by           UUID REFERENCES users(id) ON DELETE SET NULL,
    data_classification data_classification NOT NULL DEFAULT 'FIRM_CONFIDENTIAL',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX invoices_client_idx ON invoices(client_id);
CREATE INDEX invoices_status_idx ON invoices(status);

CREATE TABLE time_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id           UUID NOT NULL REFERENCES matters(id) ON DELETE RESTRICT,
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    work_date           DATE NOT NULL,
    description         TEXT NOT NULL,
    hours               NUMERIC(6,2) NOT NULL CHECK (hours > 0),
    hourly_rate         NUMERIC(10,2) NOT NULL CHECK (hourly_rate >= 0),
    amount              NUMERIC(12,2) GENERATED ALWAYS AS (hours * hourly_rate) STORED,
    status              time_entry_status NOT NULL DEFAULT 'UNBILLED',
    invoice_id          UUID REFERENCES invoices(id) ON DELETE SET NULL,
    billable            BOOLEAN NOT NULL DEFAULT TRUE,
    data_classification data_classification NOT NULL DEFAULT 'FIRM_CONFIDENTIAL',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX time_entries_matter_idx ON time_entries(matter_id);
CREATE INDEX time_entries_user_idx ON time_entries(user_id);
CREATE INDEX time_entries_status_idx ON time_entries(status);

CREATE TABLE invoice_line_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    time_entry_id       UUID REFERENCES time_entries(id) ON DELETE SET NULL,
    description         TEXT NOT NULL,
    quantity            NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price          NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount              NUMERIC(12,2) NOT NULL,
    data_classification data_classification NOT NULL DEFAULT 'FIRM_CONFIDENTIAL',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX invoice_line_items_invoice_idx ON invoice_line_items(invoice_id);

-- ------------------------------------------------------------------------
-- Audit Logs (append-only)
-- ------------------------------------------------------------------------
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

-- Prevent updates/deletes on audit_logs to enforce immutability.
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
