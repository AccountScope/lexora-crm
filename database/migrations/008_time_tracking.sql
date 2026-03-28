BEGIN;

DO $$ BEGIN
    ALTER TYPE time_entry_status ADD VALUE 'IN_PROGRESS';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TYPE time_entry_status ADD VALUE 'APPROVED';
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE billing_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    hourly_rate NUMERIC(10,2) NOT NULL CHECK (hourly_rate >= 0),
    discount_percent NUMERIC(5,2) DEFAULT 0,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    superseded_rate_id UUID REFERENCES billing_rates(id) ON DELETE SET NULL,
    data_classification data_classification NOT NULL DEFAULT 'FIRM_CONFIDENTIAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX billing_rates_user_idx ON billing_rates(user_id);
CREATE INDEX billing_rates_client_idx ON billing_rates(client_id);
CREATE INDEX billing_rates_matter_idx ON billing_rates(matter_id);

CREATE TABLE time_entry_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    description TEXT,
    default_hours NUMERIC(6,2) NOT NULL DEFAULT 1,
    default_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    default_billable BOOLEAN NOT NULL DEFAULT TRUE,
    default_activity_code TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
    data_classification data_classification NOT NULL DEFAULT 'FIRM_CONFIDENTIAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX time_entry_templates_owner_idx ON time_entry_templates(owner_id);

CREATE TABLE time_entry_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT,
    total_entries INTEGER NOT NULL DEFAULT 0,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE time_entries
    ADD COLUMN activity_code TEXT,
    ADD COLUMN started_at TIMESTAMPTZ,
    ADD COLUMN ended_at TIMESTAMPTZ,
    ADD COLUMN notes TEXT,
    ADD COLUMN template_id UUID REFERENCES time_entry_templates(id) ON DELETE SET NULL,
    ADD COLUMN billing_rate_id UUID REFERENCES billing_rates(id) ON DELETE SET NULL,
    ADD COLUMN batch_id UUID REFERENCES time_entry_batches(id) ON DELETE SET NULL,
    ADD COLUMN write_down_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

CREATE TABLE invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    paid_on DATE NOT NULL,
    method TEXT,
    reference TEXT,
    recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX invoice_payments_invoice_idx ON invoice_payments(invoice_id);

CREATE TABLE invoice_delivery_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    recipient_emails TEXT[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'QUEUED',
    sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX invoice_delivery_invoice_idx ON invoice_delivery_log(invoice_id);

ALTER TABLE invoice_line_items
    ADD COLUMN discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    ADD COLUMN discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE invoices
    ADD COLUMN tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    ADD COLUMN discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN last_sent_at TIMESTAMPTZ,
    ADD COLUMN last_sent_to TEXT[];

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1001;
ALTER TABLE invoices ALTER COLUMN invoice_number SET DEFAULT ('INV-' || LPAD(nextval('invoice_number_seq')::text, 5, '0'));

COMMIT;
