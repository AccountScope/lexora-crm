BEGIN;
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
COMMIT;
