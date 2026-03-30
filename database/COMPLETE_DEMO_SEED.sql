-- ============================================================================
-- LEXORA COMPLETE DEMO SEED - ALL-IN-ONE
-- Creates user + demo data in one transaction
-- ============================================================================

BEGIN;

-- Step 1: Create test user and capture ID
DO $$
DECLARE
    v_user_id UUID;
    v_client_1 UUID := 'c1000000-0000-0000-0000-000000000001';
    v_client_2 UUID := 'c2000000-0000-0000-0000-000000000002';
    v_client_3 UUID := 'c3000000-0000-0000-0000-000000000003';
    v_matter_1 UUID := 'a1000000-0000-0000-0000-000000000001';
    v_matter_2 UUID := 'a2000000-0000-0000-0000-000000000002';
    v_matter_3 UUID := 'a3000000-0000-0000-0000-000000000003';
    v_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Create or get existing user
    INSERT INTO users (
        id,
        organization_id,
        email,
        first_name,
        last_name,
        user_type,
        status,
        email_verified
    ) VALUES (
        gen_random_uuid(),
        v_org_id,
        'harris@lexora.com',
        'Harris',
        'Joseph',
        'STAFF',
        'ACTIVE',
        true
    )
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING id INTO v_user_id;
    
    -- If user already existed, get their ID
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users WHERE email = 'harris@lexora.com';
    END IF;
    
    RAISE NOTICE 'Using user ID: %', v_user_id;
    
    -- Create clients
    INSERT INTO clients (
        id, organization_id, firm_reference_code, legal_name, display_name, 
        status, billing_email, phone, address_line1, city, postal_code, 
        country_code, data_classification
    ) VALUES
        (v_client_1, v_org_id, 'CLT-2024-001', 'Stratford Manufacturing Ltd', 'Stratford Manufacturing', 
         'ACTIVE', 'finance@stratfordmfg.co.uk', '+44 20 7946 0958', '145 Bishopsgate', 'London', 'EC2M 3YD', 
         'GB', 'FIRM_CONFIDENTIAL'),
        (v_client_2, v_org_id, 'CLT-2024-015', 'Williams Property Group PLC', 'Williams Property', 
         'ACTIVE', 'legal@williamsprop.com', '+44 161 927 5543', '42 King Street', 'Manchester', 'M2 6BA', 
         'GB', 'FIRM_CONFIDENTIAL'),
        (v_client_3, v_org_id, 'CLT-2024-032', 'Davidson Technology Solutions Ltd', 'Davidson Tech', 
         'ACTIVE', 'contracts@davidsontech.io', '+44 117 496 3382', '88 Queens Road', 'Bristol', 'BS8 1RT', 
         'GB', 'FIRM_CONFIDENTIAL')
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created 3 clients';
    
    -- Create matters
    INSERT INTO matters (
        id, organization_id, client_id, matter_number, title, description, 
        status, practice_area, lead_attorney_id, opens_on, data_classification
    ) VALUES
        (v_matter_1, v_org_id, v_client_1, 'MAT-2024-187', 
         'Employment Dispute - Senior Engineer Dismissal',
         'Former senior engineer alleges unfair dismissal and breach of contract. High-value claim with significant reputational risk.',
         'OPEN', 'Employment Law', v_user_id, CURRENT_DATE - INTERVAL '45 days', 'FIRM_CONFIDENTIAL'),
        (v_matter_2, v_org_id, v_client_2, 'MAT-2024-203',
         'Commercial Property Acquisition - Manchester Warehouse',
         'Acquisition of 50,000 sq ft warehouse facility in Manchester. Due diligence review, contract negotiations, and completion.',
         'OPEN', 'Real Estate', v_user_id, CURRENT_DATE - INTERVAL '21 days', 'FIRM_CONFIDENTIAL'),
        (v_matter_3, v_org_id, v_client_3, 'MAT-2024-219',
         'Software Licensing Agreement Review',
         'Review and negotiation of enterprise software licensing agreement with US-based SaaS provider.',
         'PENDING', 'Commercial Contracts', v_user_id, CURRENT_DATE - INTERVAL '7 days', 'FIRM_CONFIDENTIAL')
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created 3 matters';
    
    -- Create time entries (client_id required, amount is auto-calculated)
    INSERT INTO time_entries (
        organization_id, matter_id, client_id, user_id, work_date, hours, 
        description, billable, status
    ) VALUES
        (v_org_id, v_matter_1, v_client_1, v_user_id, CURRENT_DATE - 3, 2.5, 'Initial client consultation and case assessment', true, 'UNBILLED'),
        (v_org_id, v_matter_1, v_client_1, v_user_id, CURRENT_DATE - 2, 4.0, 'Review employment contract and supporting documentation', true, 'UNBILLED'),
        (v_org_id, v_matter_1, v_client_1, v_user_id, CURRENT_DATE - 1, 1.5, 'Correspondence with opposing counsel', true, 'UNBILLED'),
        (v_org_id, v_matter_2, v_client_2, v_user_id, CURRENT_DATE - 5, 3.5, 'Due diligence review - title searches and planning permissions', true, 'UNBILLED'),
        (v_org_id, v_matter_2, v_client_2, v_user_id, CURRENT_DATE - 4, 2.0, 'Draft sale and purchase agreement', true, 'UNBILLED'),
        (v_org_id, v_matter_3, v_client_3, v_user_id, CURRENT_DATE - 2, 1.5, 'Initial contract review and risk assessment', true, 'UNBILLED'),
        (v_org_id, v_matter_3, v_client_3, v_user_id, CURRENT_DATE - 1, 2.5, 'Redline review and client consultation on key terms', true, 'UNBILLED');
    
    RAISE NOTICE 'Created 7 time entries';
    
END $$;

COMMIT;

-- Verify
SELECT 
    'Clients' as type, COUNT(*)::text as count 
FROM clients WHERE organization_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Matters', COUNT(*)::text 
FROM matters WHERE organization_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Time Entries', COUNT(*)::text 
FROM time_entries WHERE organization_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Unbilled Amount', '£' || SUM(amount)::text 
FROM time_entries WHERE organization_id = '00000000-0000-0000-0000-000000000001' AND status = 'UNBILLED';
