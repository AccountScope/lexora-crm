-- ============================================================================
-- LEXORA ORGANIZATION DATA BACKFILL
-- Run this AFTER the main migration to assign existing data to an organization
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: CREATE YOUR FIRST ORGANIZATION
-- ============================================================================

INSERT INTO organizations (id, name, slug, is_active, subscription_tier)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'LEXORA Law Firm',  -- Change this to your firm name
    'lexora-law-firm',   -- Change this to your firm slug
    true,
    'enterprise'         -- or 'starter', 'professional'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: ASSIGN ALL EXISTING RECORDS TO THIS ORGANIZATION
-- ============================================================================

-- Update users
UPDATE users 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- Update clients
UPDATE clients 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- Update matters
UPDATE matters 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- Update roles
UPDATE roles 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- Update reports
UPDATE reports 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- Update documents
UPDATE documents 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- Update deadlines
UPDATE deadlines 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- Update time_entries
UPDATE time_entries 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- Update invoices
UPDATE invoices 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that all records have an organization_id:
-- SELECT 
--     'users' as table_name, 
--     COUNT(*) as total, 
--     COUNT(organization_id) as with_org,
--     COUNT(*) - COUNT(organization_id) as without_org
-- FROM users
-- UNION ALL
-- SELECT 'clients', COUNT(*), COUNT(organization_id), COUNT(*) - COUNT(organization_id) FROM clients
-- UNION ALL
-- SELECT 'matters', COUNT(*), COUNT(organization_id), COUNT(*) - COUNT(organization_id) FROM matters
-- UNION ALL
-- SELECT 'roles', COUNT(*), COUNT(organization_id), COUNT(*) - COUNT(organization_id) FROM roles
-- UNION ALL
-- SELECT 'reports', COUNT(*), COUNT(organization_id), COUNT(*) - COUNT(organization_id) FROM reports
-- UNION ALL
-- SELECT 'documents', COUNT(*), COUNT(organization_id), COUNT(*) - COUNT(organization_id) FROM documents
-- UNION ALL
-- SELECT 'deadlines', COUNT(*), COUNT(organization_id), COUNT(*) - COUNT(organization_id) FROM deadlines
-- UNION ALL
-- SELECT 'time_entries', COUNT(*), COUNT(organization_id), COUNT(*) - COUNT(organization_id) FROM time_entries
-- UNION ALL
-- SELECT 'invoices', COUNT(*), COUNT(organization_id), COUNT(*) - COUNT(organization_id) FROM invoices;
