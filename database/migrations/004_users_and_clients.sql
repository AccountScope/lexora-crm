BEGIN;
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
COMMIT;
