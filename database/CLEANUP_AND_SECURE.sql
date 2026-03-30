-- ============================================================================
-- LEXORA DATABASE CLEANUP & SECURITY
-- Removes problematic data and ensures system integrity
-- ============================================================================

BEGIN;

-- 1. Remove any duplicate/test records that might cause issues
DELETE FROM time_entries WHERE description = 'Test';

-- 2. Ensure all records have proper organization_id (safety check)
UPDATE clients SET organization_id = '00000000-0000-0000-0000-000000000001' 
WHERE organization_id IS NULL;

UPDATE matters SET organization_id = '00000000-0000-0000-0000-000000000001' 
WHERE organization_id IS NULL;

UPDATE time_entries SET organization_id = '00000000-0000-0000-0000-000000000001' 
WHERE organization_id IS NULL;

-- 3. Verify data integrity (no orphaned records)
DELETE FROM matters WHERE client_id NOT IN (SELECT id FROM clients);
DELETE FROM time_entries WHERE matter_id NOT IN (SELECT id FROM matters);
DELETE FROM time_entries WHERE client_id NOT IN (SELECT id FROM clients);

-- 4. Clean up any invalid status values
UPDATE matters SET status = 'OPEN' WHERE status NOT IN ('OPEN', 'PENDING', 'ON_HOLD', 'CLOSED');
UPDATE time_entries SET status = 'UNBILLED' WHERE status NOT IN ('UNBILLED', 'INVOICED', 'WRITEOFF');

COMMIT;

-- Verify cleanup worked
SELECT 
    'Post-Cleanup Check' as check_type,
    (SELECT COUNT(*) FROM clients WHERE organization_id IS NULL) as clients_missing_org,
    (SELECT COUNT(*) FROM matters WHERE organization_id IS NULL) as matters_missing_org,
    (SELECT COUNT(*) FROM time_entries WHERE organization_id IS NULL) as time_missing_org,
    (SELECT COUNT(*) FROM matters WHERE client_id NOT IN (SELECT id FROM clients)) as orphaned_matters,
    (SELECT COUNT(*) FROM time_entries WHERE matter_id NOT IN (SELECT id FROM matters)) as orphaned_time;
