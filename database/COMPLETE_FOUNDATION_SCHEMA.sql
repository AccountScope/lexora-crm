-- ============================================================================
-- LEXORA COMPLETE FOUNDATION SCHEMA
-- Run this FIRST to create all base tables before multitenancy migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- STEP 2: ENUMS (Idempotent - skip if already exists)
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE data_classification AS ENUM (
        'INTERNAL_ONLY',
        'FIRM_CONFIDENTIAL',
        'CLIENT_VISIBLE',
        'CLIENT_DOWNLOADABLE',
        'RESTRICTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_type AS ENUM ('STAFF', 'CLIENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE matter_status AS ENUM ('OPEN', 'PENDING', 'ON_HOLD', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('DRAFT', 'FINAL', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- STEP 3: ORGANIZATIONS (Foundation for Multitenancy)
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    slug                TEXT NOT NULL UNIQUE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    subscription_tier   TEXT NOT NULL DEFAULT 'starter', -- starter, professional, enterprise
    trial_ends_at       TIMESTAMPTZ,
    data_classification data_classification NOT NULL DEFAULT 'INTERNAL_ONLY',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS organizations_active_idx ON organizations(is_active);

-- ============================================================================
-- STEP 4: PROFILES (Replaces users table, linked to Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_type           user_type NOT NULL DEFAULT 'STAFF',
    status              user_status NOT NULL DEFAULT 'INVITED',
    email               CITEXT NOT NULL,
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    phone               TEXT,
    timezone            TEXT DEFAULT 'UTC',
    avatar_url          TEXT,
    last_login_at       TIMESTAMPTZ,
    data_classification data_classification NOT NULL DEFAULT 'INTERNAL_ONLY',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS profiles_org_idx ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON profiles(status);
CREATE INDEX IF NOT EXISTS profiles_type_idx ON profiles(user_type);

-- ============================================================================
-- STEP 5: ROLES & PERMISSIONS (RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    description         TEXT,
    is_system           BOOLEAN NOT NULL DEFAULT FALSE,
    data_classification data_classification NOT NULL DEFAULT 'INTERNAL_ONLY',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS permissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key                 TEXT NOT NULL UNIQUE,
    description         TEXT,
    data_classification data_classification NOT NULL DEFAULT 'INTERNAL_ONLY',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id             UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id       UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    data_classification data_classification NOT NULL DEFAULT 'INTERNAL_ONLY',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id             UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    data_classification data_classification NOT NULL DEFAULT 'INTERNAL_ONLY',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- ============================================================================
-- STEP 6: CLIENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    firm_reference_code TEXT,
    legal_name          TEXT NOT NULL,
    display_name        TEXT,
    status              TEXT NOT NULL DEFAULT 'ACTIVE',
    primary_contact_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
    deleted_at          TIMESTAMPTZ,
    UNIQUE (organization_id, firm_reference_code)
);

CREATE INDEX IF NOT EXISTS clients_org_idx ON clients(organization_id);
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status);

-- ============================================================================
-- STEP 7: MATTERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS matters (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    matter_reference    TEXT NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT,
    status              matter_status NOT NULL DEFAULT 'OPEN',
    opened_at           DATE NOT NULL DEFAULT CURRENT_DATE,
    closed_at           DATE,
    responsible_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    data_classification data_classification NOT NULL DEFAULT 'FIRM_CONFIDENTIAL',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    UNIQUE (organization_id, matter_reference)
);

CREATE INDEX IF NOT EXISTS matters_org_idx ON matters(organization_id);
CREATE INDEX IF NOT EXISTS matters_client_idx ON matters(client_id);
CREATE INDEX IF NOT EXISTS matters_status_idx ON matters(status);
CREATE INDEX IF NOT EXISTS matters_responsible_idx ON matters(responsible_user_id);

-- ============================================================================
-- STEP 8: UPLOADED FILES (For document attachments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS uploaded_files (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    matter_id           UUID REFERENCES matters(id) ON DELETE CASCADE,
    uploader_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    original_filename   TEXT NOT NULL,
    storage_path        TEXT NOT NULL UNIQUE,
    mime_type           TEXT NOT NULL,
    size_bytes          BIGINT NOT NULL,
    checksum_sha256     TEXT NOT NULL,
    data_classification data_classification NOT NULL DEFAULT 'CLIENT_VISIBLE',
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS uploaded_files_org_idx ON uploaded_files(organization_id);
CREATE INDEX IF NOT EXISTS uploaded_files_matter_idx ON uploaded_files(matter_id);
CREATE INDEX IF NOT EXISTS uploaded_files_uploader_idx ON uploaded_files(uploader_id);

-- ============================================================================
-- STEP 9: UPDATE EXISTING REPORTS TABLE
-- ============================================================================
-- Add organization_id to existing reports table if it doesn't have it
ALTER TABLE reports ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS reports_org_idx ON reports(organization_id);

-- ============================================================================
-- STEP 10: ADD ORGANIZATION_ID TO EXISTING TABLES
-- ============================================================================
-- Add organization_id to tables that might already exist without it

-- Add to roles if missing
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE roles ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS roles_org_idx ON roles(organization_id);
    END IF;
END $$;

-- Add to clients if missing
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE clients ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS clients_org_idx ON clients(organization_id);
    END IF;
END $$;

-- Add to matters if missing
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matters' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE matters ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS matters_org_idx ON matters(organization_id);
    END IF;
END $$;

-- Add to uploaded_files if missing
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'uploaded_files' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE uploaded_files ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS uploaded_files_org_idx ON uploaded_files(organization_id);
    END IF;
END $$;

-- Add to profiles if missing
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS profiles_org_idx ON profiles(organization_id);
    END IF;
END $$;

-- ============================================================================
-- STEP 11: ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Helper function: Get current user's organization
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Profiles: Users can only see profiles in their organization
CREATE POLICY profiles_tenant_isolation ON profiles
    FOR ALL
    USING (organization_id = auth.user_organization_id());

-- Organizations: Users can only see their own organization
CREATE POLICY organizations_tenant_isolation ON organizations
    FOR ALL
    USING (id = auth.user_organization_id());

-- Roles: Users can only see roles in their organization
CREATE POLICY roles_tenant_isolation ON roles
    FOR ALL
    USING (organization_id = auth.user_organization_id());

-- Clients: Users can only see clients in their organization
CREATE POLICY clients_tenant_isolation ON clients
    FOR ALL
    USING (organization_id = auth.user_organization_id());

-- Matters: Users can only see matters in their organization
CREATE POLICY matters_tenant_isolation ON matters
    FOR ALL
    USING (organization_id = auth.user_organization_id());

-- Uploaded Files: Users can only see files in their organization
CREATE POLICY uploaded_files_tenant_isolation ON uploaded_files
    FOR ALL
    USING (organization_id = auth.user_organization_id());

-- Reports: Users can only see reports in their organization
CREATE POLICY reports_tenant_isolation ON reports
    FOR ALL
    USING (organization_id = auth.user_organization_id());

-- Permissions: Global permissions table (no RLS needed, but enabled for consistency)
CREATE POLICY permissions_allow_all ON permissions
    FOR SELECT
    USING (true);

-- Role Permissions: Accessible via roles policy
CREATE POLICY role_permissions_tenant_isolation ON role_permissions
    FOR ALL
    USING (
        role_id IN (
            SELECT id FROM roles WHERE organization_id = auth.user_organization_id()
        )
    );

-- User Roles: Accessible via profiles policy
CREATE POLICY user_roles_tenant_isolation ON user_roles
    FOR ALL
    USING (
        user_id IN (
            SELECT id FROM profiles WHERE organization_id = auth.user_organization_id()
        )
    );

-- ============================================================================
-- STEP 12: SEED DEFAULT PERMISSIONS
-- ============================================================================
INSERT INTO permissions (key, description) VALUES
    ('matters.view', 'View matters'),
    ('matters.create', 'Create matters'),
    ('matters.edit', 'Edit matters'),
    ('matters.delete', 'Delete matters'),
    ('clients.view', 'View clients'),
    ('clients.create', 'Create clients'),
    ('clients.edit', 'Edit clients'),
    ('clients.delete', 'Delete clients'),
    ('documents.view', 'View documents'),
    ('documents.upload', 'Upload documents'),
    ('documents.delete', 'Delete documents'),
    ('reports.view', 'View reports'),
    ('reports.generate', 'Generate reports'),
    ('users.view', 'View users'),
    ('users.manage', 'Manage users'),
    ('settings.view', 'View settings'),
    ('settings.manage', 'Manage settings')
ON CONFLICT (key) DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these after migration)
-- ============================================================================
-- Check all tables exist:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check permissions seeded:
-- SELECT COUNT(*) FROM permissions;
