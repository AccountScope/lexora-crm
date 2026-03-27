BEGIN;
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
COMMIT;
