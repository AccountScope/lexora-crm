-- ============================================================================
-- LEXORA MULTITENANCY HARDENING (OPTIONAL - RUN AFTER DATA BACKFILL)
-- ============================================================================
-- Run this AFTER you've assigned organization_id to all existing records

BEGIN;

-- ============================================================================
-- STEP 1: MAKE ORGANIZATION_ID NOT NULL (AFTER BACKFILL)
-- ============================================================================
-- Only run these once ALL existing records have an organization_id assigned

ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE clients ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE matters ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE roles ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE reports ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE documents ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE deadlines ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE time_entries ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN organization_id SET NOT NULL;

-- ============================================================================
-- STEP 2: ADD ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================
-- These are already created in the main migration, but listed here for reference

-- CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
-- CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
-- CREATE INDEX IF NOT EXISTS idx_matters_org ON matters(organization_id);
-- CREATE INDEX IF NOT EXISTS idx_roles_org ON roles(organization_id);
-- CREATE INDEX IF NOT EXISTS idx_reports_org ON reports(organization_id);
-- CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
-- CREATE INDEX IF NOT EXISTS idx_deadlines_org ON deadlines(organization_id);
-- CREATE INDEX IF NOT EXISTS idx_time_entries_org ON time_entries(organization_id);
-- CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);

-- ============================================================================
-- STEP 3: PREVENT CROSS-TENANT INSERTS (TRIGGER-BASED)
-- ============================================================================
-- This adds an extra safety layer beyond RLS policies

CREATE OR REPLACE FUNCTION public.enforce_user_organization()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure new record's organization_id matches current user's organization
    IF NEW.organization_id != public.user_organization_id() THEN
        RAISE EXCEPTION 'Cannot insert/update records for a different organization';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to all tables
DROP TRIGGER IF EXISTS enforce_org_clients ON clients;
CREATE TRIGGER enforce_org_clients
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_user_organization();

DROP TRIGGER IF EXISTS enforce_org_matters ON matters;
CREATE TRIGGER enforce_org_matters
    BEFORE INSERT OR UPDATE ON matters
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_user_organization();

DROP TRIGGER IF EXISTS enforce_org_documents ON documents;
CREATE TRIGGER enforce_org_documents
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_user_organization();

DROP TRIGGER IF EXISTS enforce_org_deadlines ON deadlines;
CREATE TRIGGER enforce_org_deadlines
    BEFORE INSERT OR UPDATE ON deadlines
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_user_organization();

DROP TRIGGER IF EXISTS enforce_org_time_entries ON time_entries;
CREATE TRIGGER enforce_org_time_entries
    BEFORE INSERT OR UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_user_organization();

DROP TRIGGER IF EXISTS enforce_org_invoices ON invoices;
CREATE TRIGGER enforce_org_invoices
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_user_organization();

DROP TRIGGER IF EXISTS enforce_org_reports ON reports;
CREATE TRIGGER enforce_org_reports
    BEFORE INSERT OR UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_user_organization();

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check NOT NULL constraints are applied:
-- SELECT table_name, column_name, is_nullable 
-- FROM information_schema.columns 
-- WHERE column_name = 'organization_id' 
-- AND table_schema = 'public'
-- ORDER BY table_name;

-- Check triggers exist:
-- SELECT trigger_name, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public'
-- AND trigger_name LIKE 'enforce_org%'
-- ORDER BY event_object_table;
