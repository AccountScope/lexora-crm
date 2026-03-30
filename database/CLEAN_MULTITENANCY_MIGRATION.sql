-- ============================================================================
-- LEXORA MULTITENANCY MIGRATION
-- Adds organization_id to existing tables + RLS policies
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: CREATE ORGANIZATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    slug                TEXT NOT NULL UNIQUE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    subscription_tier   TEXT NOT NULL DEFAULT 'starter',
    trial_ends_at       TIMESTAMPTZ,
    data_classification data_classification NOT NULL DEFAULT 'INTERNAL_ONLY',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS organizations_active_idx ON organizations(is_active);

-- ============================================================================
-- STEP 2: ADD ORGANIZATION_ID TO EXISTING TABLES
-- ============================================================================

-- Add to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS users_org_idx ON users(organization_id);

-- Add to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS clients_org_idx ON clients(organization_id);

-- Add to matters table
ALTER TABLE matters ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS matters_org_idx ON matters(organization_id);

-- Add to roles table
ALTER TABLE roles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS roles_org_idx ON roles(organization_id);

-- Add to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS reports_org_idx ON reports(organization_id);

-- Add to documents table (if you want document isolation)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS documents_org_idx ON documents(organization_id);

-- Add to deadlines table
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS deadlines_org_idx ON deadlines(organization_id);

-- Add to time_entries table
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS time_entries_org_idx ON time_entries(organization_id);

-- Add to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS invoices_org_idx ON invoices(organization_id);

-- ============================================================================
-- STEP 3: ROW-LEVEL SECURITY HELPER FUNCTION
-- ============================================================================

-- Helper function: Get current user's organization
CREATE OR REPLACE FUNCTION public.user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- STEP 4: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================================================

-- Organizations: Users can only see their own organization
DROP POLICY IF EXISTS organizations_tenant_isolation ON organizations;
CREATE POLICY organizations_tenant_isolation ON organizations
    FOR ALL
    USING (id = public.user_organization_id());

-- Users: Users can only see users in their organization
DROP POLICY IF EXISTS users_tenant_isolation ON users;
CREATE POLICY users_tenant_isolation ON users
    FOR ALL
    USING (organization_id = public.user_organization_id());

-- Clients: Users can only see clients in their organization
DROP POLICY IF EXISTS clients_tenant_isolation ON clients;
CREATE POLICY clients_tenant_isolation ON clients
    FOR ALL
    USING (organization_id = public.user_organization_id());

-- Matters: Users can only see matters in their organization
DROP POLICY IF EXISTS matters_tenant_isolation ON matters;
CREATE POLICY matters_tenant_isolation ON matters
    FOR ALL
    USING (organization_id = public.user_organization_id());

-- Roles: Users can only see roles in their organization
DROP POLICY IF EXISTS roles_tenant_isolation ON roles;
CREATE POLICY roles_tenant_isolation ON roles
    FOR ALL
    USING (organization_id = public.user_organization_id());

-- Reports: Users can only see reports in their organization
DROP POLICY IF EXISTS reports_tenant_isolation ON reports;
CREATE POLICY reports_tenant_isolation ON reports
    FOR ALL
    USING (organization_id = public.user_organization_id());

-- Documents: Users can only see documents in their organization
DROP POLICY IF EXISTS documents_tenant_isolation ON documents;
CREATE POLICY documents_tenant_isolation ON documents
    FOR ALL
    USING (organization_id = public.user_organization_id());

-- Deadlines: Users can only see deadlines in their organization
DROP POLICY IF EXISTS deadlines_tenant_isolation ON deadlines;
CREATE POLICY deadlines_tenant_isolation ON deadlines
    FOR ALL
    USING (organization_id = public.user_organization_id());

-- Time Entries: Users can only see time entries in their organization
DROP POLICY IF EXISTS time_entries_tenant_isolation ON time_entries;
CREATE POLICY time_entries_tenant_isolation ON time_entries
    FOR ALL
    USING (organization_id = public.user_organization_id());

-- Invoices: Users can only see invoices in their organization
DROP POLICY IF EXISTS invoices_tenant_isolation ON invoices;
CREATE POLICY invoices_tenant_isolation ON invoices
    FOR ALL
    USING (organization_id = public.user_organization_id());

COMMIT;

-- ============================================================================
-- POST-MIGRATION: VERIFICATION QUERIES
-- ============================================================================
-- Run these after migration to verify success:

-- 1. Check organizations table exists
-- SELECT COUNT(*) FROM organizations;

-- 2. Check all tables have organization_id column
-- SELECT table_name, column_name 
-- FROM information_schema.columns 
-- WHERE column_name = 'organization_id' AND table_schema = 'public'
-- ORDER BY table_name;

-- 3. Check RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('organizations', 'users', 'clients', 'matters', 'roles', 'reports')
-- ORDER BY tablename;

-- 4. Check policies exist
-- SELECT tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
