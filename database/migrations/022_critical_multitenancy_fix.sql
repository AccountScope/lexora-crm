-- ============================================================================
-- CRITICAL: Multi-Tenancy Security Fix
-- ============================================================================
-- This migration adds organization_id to all core tables to prevent
-- data leakage between firms. This is a PRODUCTION BLOCKER fix.
--
-- Created: 2026-03-30
-- Phase: 2 (Backend Foundation)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADD ORGANIZATION_ID TO CORE TABLES
-- ============================================================================

-- Users (if not already added by organizations migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE users 
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX idx_users_organization ON users(organization_id);
  END IF;
END $$;

-- Clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE clients 
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX idx_clients_organization ON clients(organization_id);
  END IF;
END $$;

-- Matters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matters' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE matters 
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX idx_matters_organization ON matters(organization_id);
  END IF;
END $$;

-- Documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE documents 
      ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    
    CREATE INDEX idx_documents_organization ON documents(organization_id);
  END IF;
END $$;

-- Time Entries (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'time_entries' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE time_entries 
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      
      CREATE INDEX idx_time_entries_organization ON time_entries(organization_id);
    END IF;
  END IF;
END $$;

-- Tasks/Deadlines (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE tasks 
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      
      CREATE INDEX idx_tasks_organization ON tasks(organization_id);
    END IF;
  END IF;
END $$;

-- Deadlines table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deadlines') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'deadlines' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE deadlines 
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      
      CREATE INDEX idx_deadlines_organization ON deadlines(organization_id);
    END IF;
  END IF;
END $$;

-- Notes (if separate table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'notes' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE notes 
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      
      CREATE INDEX idx_notes_organization ON notes(organization_id);
    END IF;
  END IF;
END $$;

-- Activities/Audit Logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'activities' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE activities 
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      
      CREATE INDEX idx_activities_organization ON activities(organization_id);
    END IF;
  END IF;
END $$;

-- Notifications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE notifications 
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      
      CREATE INDEX idx_notifications_organization ON notifications(organization_id);
    END IF;
  END IF;
END $$;

-- Invoices/Billing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE invoices 
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      
      CREATE INDEX idx_invoices_organization ON invoices(organization_id);
    END IF;
  END IF;
END $$;

-- Trust Accounts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trust_accounts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'trust_accounts' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE trust_accounts 
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      
      CREATE INDEX idx_trust_accounts_organization ON trust_accounts(organization_id);
    END IF;
  END IF;
END $$;

-- Trust Ledgers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trust_ledgers') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'trust_ledgers' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE trust_ledgers 
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      
      CREATE INDEX idx_trust_ledgers_organization ON trust_ledgers(organization_id);
    END IF;
  END IF;
END $$;

-- Trust Transactions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trust_transactions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'trust_transactions' AND column_name = 'organization_id'
    ) THEN
      ALTER TABLE trust_transactions 
        ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      
      CREATE INDEX idx_trust_transactions_organization ON trust_transactions(organization_id);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 2. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's organization
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT organization_id 
  FROM profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Users RLS
DROP POLICY IF EXISTS users_tenant_isolation ON users;
CREATE POLICY users_tenant_isolation ON users
  FOR ALL
  USING (organization_id = auth.user_organization_id());

-- Clients RLS
DROP POLICY IF EXISTS clients_tenant_isolation ON clients;
CREATE POLICY clients_tenant_isolation ON clients
  FOR ALL
  USING (organization_id = auth.user_organization_id());

-- Matters RLS
DROP POLICY IF EXISTS matters_tenant_isolation ON matters;
CREATE POLICY matters_tenant_isolation ON matters
  FOR ALL
  USING (organization_id = auth.user_organization_id());

-- Documents RLS
DROP POLICY IF EXISTS documents_tenant_isolation ON documents;
CREATE POLICY documents_tenant_isolation ON documents
  FOR ALL
  USING (organization_id = auth.user_organization_id());

-- Time Entries RLS (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries') THEN
    EXECUTE 'ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS time_entries_tenant_isolation ON time_entries';
    EXECUTE 'CREATE POLICY time_entries_tenant_isolation ON time_entries FOR ALL USING (organization_id = auth.user_organization_id())';
  END IF;
END $$;

-- Tasks RLS (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    EXECUTE 'ALTER TABLE tasks ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS tasks_tenant_isolation ON tasks';
    EXECUTE 'CREATE POLICY tasks_tenant_isolation ON tasks FOR ALL USING (organization_id = auth.user_organization_id())';
  END IF;
END $$;

-- Deadlines RLS (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deadlines') THEN
    EXECUTE 'ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS deadlines_tenant_isolation ON deadlines';
    EXECUTE 'CREATE POLICY deadlines_tenant_isolation ON deadlines FOR ALL USING (organization_id = auth.user_organization_id())';
  END IF;
END $$;

-- ============================================================================
-- 3. DATA MIGRATION (For existing records without organization_id)
-- ============================================================================
-- WARNING: This assumes a single organization for existing data.
-- In production with multiple orgs, you'd need a more sophisticated migration.

-- Create default organization if none exists
INSERT INTO organizations (name, slug, subscription_tier, subscription_status)
VALUES ('Default Law Firm', 'default-firm', 'enterprise', 'active')
ON CONFLICT (slug) DO NOTHING;

-- Get the default organization ID
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  SELECT id INTO default_org_id FROM organizations WHERE slug = 'default-firm' LIMIT 1;
  
  -- Migrate users
  UPDATE users SET organization_id = default_org_id WHERE organization_id IS NULL;
  
  -- Migrate clients
  UPDATE clients SET organization_id = default_org_id WHERE organization_id IS NULL;
  
  -- Migrate matters
  UPDATE matters SET organization_id = default_org_id WHERE organization_id IS NULL;
  
  -- Migrate documents
  UPDATE documents SET organization_id = default_org_id WHERE organization_id IS NULL;
  
  -- Migrate other tables if they exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries') THEN
    EXECUTE 'UPDATE time_entries SET organization_id = $1 WHERE organization_id IS NULL' USING default_org_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    EXECUTE 'UPDATE tasks SET organization_id = $1 WHERE organization_id IS NULL' USING default_org_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deadlines') THEN
    EXECUTE 'UPDATE deadlines SET organization_id = $1 WHERE organization_id IS NULL' USING default_org_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    EXECUTE 'UPDATE notifications SET organization_id = $1 WHERE organization_id IS NULL' USING default_org_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    EXECUTE 'UPDATE activities SET organization_id = $1 WHERE organization_id IS NULL' USING default_org_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    EXECUTE 'UPDATE invoices SET organization_id = $1 WHERE organization_id IS NULL' USING default_org_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trust_accounts') THEN
    EXECUTE 'UPDATE trust_accounts SET organization_id = $1 WHERE organization_id IS NULL' USING default_org_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trust_ledgers') THEN
    EXECUTE 'UPDATE trust_ledgers SET organization_id = $1 WHERE organization_id IS NULL' USING default_org_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trust_transactions') THEN
    EXECUTE 'UPDATE trust_transactions SET organization_id = $1 WHERE organization_id IS NULL' USING default_org_id;
  END IF;
END $$;

-- ============================================================================
-- 4. MAKE ORGANIZATION_ID NOT NULL (After data migration)
-- ============================================================================

-- Users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'organization_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END $$;

-- Clients
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'organization_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE clients ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END $$;

-- Matters
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matters' AND column_name = 'organization_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE matters ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END $$;

-- Documents
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'organization_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE documents ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify the migration)
-- ============================================================================

-- Check that all tables have organization_id
SELECT 
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE column_name = 'organization_id'
  AND table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'clients', 'matters', 'documents')
ORDER BY tablename;

-- Check no records have NULL organization_id
SELECT 
  'users' as table_name, COUNT(*) as null_count FROM users WHERE organization_id IS NULL
UNION ALL
SELECT 'clients', COUNT(*) FROM clients WHERE organization_id IS NULL
UNION ALL
SELECT 'matters', COUNT(*) FROM matters WHERE organization_id IS NULL
UNION ALL
SELECT 'documents', COUNT(*) FROM documents WHERE organization_id IS NULL;
