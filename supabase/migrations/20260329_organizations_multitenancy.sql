-- Multi-Tenancy Foundation: Organizations, Roles, Audit Logs
-- Created: 2026-03-29
-- Purpose: Enable multiple law firms/organizations on one platform

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  
  -- Contact info
  email TEXT,
  phone TEXT,
  address JSONB, -- {street, city, state, zip, country}
  
  -- Settings
  settings JSONB DEFAULT '{
    "timezone": "Europe/London",
    "currency": "GBP",
    "date_format": "DD/MM/YYYY",
    "time_format": "24h",
    "fiscal_year_start": "01-04",
    "require_2fa": false,
    "session_timeout_minutes": 30,
    "allowed_ips": []
  }'::jsonb,
  
  -- Subscription
  subscription_tier TEXT DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'starter', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  
  -- Limits
  max_users INTEGER DEFAULT 10,
  max_matters INTEGER,
  storage_limit_gb INTEGER DEFAULT 10,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Add organization_id to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member'));

-- Create index
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);

-- ============================================================================
-- ROLES & PERMISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Permissions structure
  permissions JSONB NOT NULL DEFAULT '{
    "cases": {"read": true, "write": false, "delete": false},
    "clients": {"read": true, "write": false, "delete": false},
    "documents": {"read": true, "write": false, "delete": false},
    "time": {"read": true, "write": true, "delete": false},
    "invoices": {"read": true, "write": false, "delete": false, "approve": false},
    "trust": {"read": false, "write": false, "delete": false, "reconcile": false},
    "reports": {"read": true},
    "settings": {"read": false, "write": false},
    "users": {"read": false, "write": false, "delete": false}
  }'::jsonb,
  
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_roles_organization ON roles(organization_id);

-- User role assignments
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org ON user_roles(organization_id);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Action details
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view', 'download', 'share', 'login', 'logout')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  
  -- Change tracking
  changes JSONB, -- {before: {...}, after: {...}}
  
  -- Request metadata
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,
  
  -- Context
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ============================================================================
-- ADD ORGANIZATION_ID TO EXISTING TABLES
-- ============================================================================

-- Cases
ALTER TABLE cases 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_cases_organization ON cases(organization_id);

-- Clients (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_clients_organization ON clients(organization_id);
  END IF;
END $$;

-- Documents (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_documents_organization ON documents(organization_id);
  END IF;
END $$;

-- Time entries (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries') THEN
    ALTER TABLE time_entries 
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_time_entries_organization ON time_entries(organization_id);
  END IF;
END $$;

-- Invoices (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_invoices_organization ON invoices(organization_id);
  END IF;
END $$;

-- Trust accounts (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trust_accounts') THEN
    ALTER TABLE trust_accounts 
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_trust_accounts_organization ON trust_accounts(organization_id);
  END IF;
END $$;

-- ============================================================================
-- SEED DEFAULT ROLES
-- ============================================================================

-- Function to create default roles for an organization
CREATE OR REPLACE FUNCTION create_default_roles(org_id UUID)
RETURNS void AS $$
BEGIN
  -- Admin role (full access)
  INSERT INTO roles (organization_id, name, description, is_default, permissions)
  VALUES (
    org_id,
    'Admin',
    'Full system access - can manage users, settings, and all data',
    true,
    '{
      "cases": {"read": true, "write": true, "delete": true},
      "clients": {"read": true, "write": true, "delete": true},
      "documents": {"read": true, "write": true, "delete": true},
      "time": {"read": true, "write": true, "delete": true},
      "invoices": {"read": true, "write": true, "delete": true, "approve": true},
      "trust": {"read": true, "write": true, "delete": true, "reconcile": true},
      "reports": {"read": true},
      "settings": {"read": true, "write": true},
      "users": {"read": true, "write": true, "delete": true}
    }'::jsonb
  );

  -- Manager role (most access, can't delete or manage users)
  INSERT INTO roles (organization_id, name, description, is_default, permissions)
  VALUES (
    org_id,
    'Manager',
    'Can manage cases and clients, approve invoices, view reports',
    true,
    '{
      "cases": {"read": true, "write": true, "delete": false},
      "clients": {"read": true, "write": true, "delete": false},
      "documents": {"read": true, "write": true, "delete": false},
      "time": {"read": true, "write": true, "delete": false},
      "invoices": {"read": true, "write": true, "delete": false, "approve": true},
      "trust": {"read": true, "write": false, "delete": false, "reconcile": false},
      "reports": {"read": true},
      "settings": {"read": true, "write": false},
      "users": {"read": true, "write": false, "delete": false}
    }'::jsonb
  );

  -- Lawyer role (can work on cases, log time, create invoices)
  INSERT INTO roles (organization_id, name, description, is_default, permissions)
  VALUES (
    org_id,
    'Lawyer',
    'Can manage cases, log time, and create invoices',
    true,
    '{
      "cases": {"read": true, "write": true, "delete": false},
      "clients": {"read": true, "write": true, "delete": false},
      "documents": {"read": true, "write": true, "delete": false},
      "time": {"read": true, "write": true, "delete": false},
      "invoices": {"read": true, "write": true, "delete": false, "approve": false},
      "trust": {"read": false, "write": false, "delete": false, "reconcile": false},
      "reports": {"read": true},
      "settings": {"read": false, "write": false},
      "users": {"read": true, "write": false, "delete": false}
    }'::jsonb
  );

  -- Paralegal role (can assist with cases, log time)
  INSERT INTO roles (organization_id, name, description, is_default, permissions)
  VALUES (
    org_id,
    'Paralegal',
    'Can assist with cases and log time',
    true,
    '{
      "cases": {"read": true, "write": true, "delete": false},
      "clients": {"read": true, "write": false, "delete": false},
      "documents": {"read": true, "write": true, "delete": false},
      "time": {"read": true, "write": true, "delete": false},
      "invoices": {"read": true, "write": false, "delete": false, "approve": false},
      "trust": {"read": false, "write": false, "delete": false, "reconcile": false},
      "reports": {"read": false},
      "settings": {"read": false, "write": false},
      "users": {"read": false, "write": false, "delete": false}
    }'::jsonb
  );

  -- Client role (limited access to own matters)
  INSERT INTO roles (organization_id, name, description, is_default, permissions)
  VALUES (
    org_id,
    'Client',
    'Can view own cases and documents via client portal',
    true,
    '{
      "cases": {"read": true, "write": false, "delete": false},
      "clients": {"read": false, "write": false, "delete": false},
      "documents": {"read": true, "write": false, "delete": false},
      "time": {"read": false, "write": false, "delete": false},
      "invoices": {"read": true, "write": false, "delete": false, "approve": false},
      "trust": {"read": false, "write": false, "delete": false, "reconcile": false},
      "reports": {"read": false},
      "settings": {"read": false, "write": false},
      "users": {"read": false, "write": false, "delete": false}
    }'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Organizations: Users can only see their own organization
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update own organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT p.organization_id 
      FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('owner', 'admin')
    )
  );

-- Roles: Users can view roles in their organization
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org roles"
  ON roles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Audit logs: Users can view audit logs in their organization (if admin)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own org audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT p.organization_id 
      FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  resource TEXT,
  action TEXT
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.permissions->resource->>action = 'true'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for roles
CREATE TRIGGER update_roles_updated_at 
  BEFORE UPDATE ON roles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE organizations IS 'Law firms and legal departments using the platform';
COMMENT ON TABLE roles IS 'Custom roles with granular permissions per organization';
COMMENT ON TABLE user_roles IS 'User role assignments within organizations';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail of all user actions';
COMMENT ON FUNCTION create_default_roles IS 'Creates 5 default roles (Admin, Manager, Lawyer, Paralegal, Client) for a new organization';
COMMENT ON FUNCTION has_permission IS 'Check if current user has a specific permission';
