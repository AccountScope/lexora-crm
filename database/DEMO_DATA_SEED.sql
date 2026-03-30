-- ============================================================================
-- LEXORA CRM - PROFESSIONAL DEMO DATA SEED
-- Creates realistic legal demo data for one organization
-- ============================================================================

BEGIN;

-- Verify organization exists (should be from backfill)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001') THEN
        RAISE EXCEPTION 'Organization not found. Run BACKFILL_ORGANIZATION_DATA.sql first.';
    END IF;
END $$;

-- ============================================================================
-- STEP 1: CREATE DEMO CLIENTS
-- ============================================================================

INSERT INTO clients (
    id,
    organization_id,
    firm_reference_code,
    legal_name,
    display_name,
    status,
    billing_email,
    phone,
    address_line1,
    city,
    postal_code,
    country_code,
    data_classification,
    created_at
) VALUES
    (
        'c1000000-0000-0000-0000-000000000001'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'CLT-2024-001',
        'Stratford Manufacturing Ltd',
        'Stratford Manufacturing',
        'ACTIVE',
        'finance@stratfordmfg.co.uk',
        '+44 20 7946 0958',
        '145 Bishopsgate',
        'London',
        'EC2M 3YD',
        'GB',
        'FIRM_CONFIDENTIAL',
        NOW() - INTERVAL '6 months'
    ),
    (
        'c1000000-0000-0000-0000-000000000002'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'CLT-2024-015',
        'Williams Property Group PLC',
        'Williams Property',
        'ACTIVE',
        'legal@williamsprop.com',
        '+44 161 927 5543',
        '42 King Street',
        'Manchester',
        'M2 6BA',
        'GB',
        'FIRM_CONFIDENTIAL',
        NOW() - INTERVAL '3 months'
    ),
    (
        'c1000000-0000-0000-0000-000000000003'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'CLT-2024-032',
        'Davidson Technology Solutions Ltd',
        'Davidson Tech',
        'ACTIVE',
        'contracts@davidsontech.io',
        '+44 117 496 3382',
        '88 Queens Road',
        'Bristol',
        'BS8 1RT',
        'GB',
        'FIRM_CONFIDENTIAL',
        NOW() - INTERVAL '1 month'
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: CREATE DEMO MATTERS
-- ============================================================================

INSERT INTO matters (
    id,
    organization_id,
    client_id,
    matter_number,
    title,
    description,
    status,
    practice_area,
    lead_attorney_id,
    opens_on,
    data_classification,
    created_at
) VALUES
    (
        'm1000000-0000-0000-0000-000000000001'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'c1000000-0000-0000-0000-000000000001'::uuid,
        'MAT-2024-187',
        'Employment Dispute - Senior Engineer Dismissal',
        'Former senior engineer alleges unfair dismissal and breach of contract. High-value claim with significant reputational risk. Tribunal hearing scheduled for Q2 2025.',
        'OPEN',
        'Employment Law',
        (SELECT id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
        CURRENT_DATE - INTERVAL '45 days',
        'FIRM_CONFIDENTIAL',
        NOW() - INTERVAL '45 days'
    ),
    (
        'm1000000-0000-0000-0000-000000000002'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'c1000000-0000-0000-0000-000000000002'::uuid,
        'MAT-2024-203',
        'Commercial Property Acquisition - Manchester Warehouse',
        'Acquisition of 50,000 sq ft warehouse facility in Manchester. Due diligence review, contract negotiations, and completion. Purchase price £4.2M.',
        'OPEN',
        'Real Estate',
        (SELECT id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
        CURRENT_DATE - INTERVAL '21 days',
        'FIRM_CONFIDENTIAL',
        NOW() - INTERVAL '21 days'
    ),
    (
        'm1000000-0000-0000-0000-000000000003'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        'c1000000-0000-0000-0000-000000000003'::uuid,
        'MAT-2024-219',
        'Software Licensing Agreement Review',
        'Review and negotiation of enterprise software licensing agreement with US-based SaaS provider. Annual contract value £380K.',
        'PENDING',
        'Commercial Contracts',
        (SELECT id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
        CURRENT_DATE - INTERVAL '7 days',
        'FIRM_CONFIDENTIAL',
        NOW() - INTERVAL '7 days'
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: CREATE DEMO TIME ENTRIES
-- ============================================================================

INSERT INTO time_entries (
    id,
    organization_id,
    matter_id,
    user_id,
    work_date,
    hours,
    description,
    billable,
    status,
    amount,
    created_at
) VALUES
    -- Employment dispute entries
    (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000001'::uuid,
        'm1000000-0000-0000-0000-000000000001'::uuid,
        (SELECT id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
        CURRENT_DATE - INTERVAL '3 days',
        2.5,
        'Initial client consultation and case assessment',
        true,
        'UNBILLED',
        500.00,
        NOW() - INTERVAL '3 days'
    ),
    (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000001'::uuid,
        'm1000000-0000-0000-0000-000000000001'::uuid,
        (SELECT id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
        CURRENT_DATE - INTERVAL '2 days',
        4.0,
        'Review employment contract and supporting documentation',
        true,
        'UNBILLED',
        800.00,
        NOW() - INTERVAL '2 days'
    ),
    (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000001'::uuid,
        'm1000000-0000-0000-0000-000000000001'::uuid,
        (SELECT id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
        CURRENT_DATE - INTERVAL '1 day',
        1.5,
        'Correspondence with opposing counsel',
        true,
        'UNBILLED',
        300.00,
        NOW() - INTERVAL '1 day'
    ),
    
    -- Property acquisition entries
    (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000001'::uuid,
        'm1000000-0000-0000-0000-000000000002'::uuid,
        (SELECT id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
        CURRENT_DATE - INTERVAL '5 days',
        3.5,
        'Due diligence review - title searches and planning permissions',
        true,
        'UNBILLED',
        700.00,
        NOW() - INTERVAL '5 days'
    ),
    (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000001'::uuid,
        'm1000000-0000-0000-0000-000000000002'::uuid,
        (SELECT id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
        CURRENT_DATE - INTERVAL '4 days',
        2.0,
        'Draft sale and purchase agreement',
        true,
        'UNBILLED',
        400.00,
        NOW() - INTERVAL '4 days'
    ),
    
    -- Contract review entries
    (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000001'::uuid,
        'm1000000-0000-0000-0000-000000000003'::uuid,
        (SELECT id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
        CURRENT_DATE - INTERVAL '2 days',
        1.5,
        'Initial contract review and risk assessment',
        true,
        'UNBILLED',
        300.00,
        NOW() - INTERVAL '2 days'
    ),
    (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000001'::uuid,
        'm1000000-0000-0000-0000-000000000003'::uuid,
        (SELECT id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
        CURRENT_DATE - INTERVAL '1 day',
        2.5,
        'Redline review and client consultation on key terms',
        true,
        'UNBILLED',
        500.00,
        NOW() - INTERVAL '1 day'
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 4: CREATE DEMO DOCUMENTS (if table exists)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
        INSERT INTO documents (
            id,
            organization_id,
            matter_id,
            client_id,
            title,
            document_type,
            status,
            created_by,
            data_classification,
            created_at
        ) VALUES
            (
                gen_random_uuid(),
                '00000000-0000-0000-0000-000000000001'::uuid,
                'm1000000-0000-0000-0000-000000000001'::uuid,
                'c1000000-0000-0000-0000-000000000001'::uuid,
                'Employment Contract - John Smith',
                'CONTRACT',
                'FINAL',
                (SELECT id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
                'FIRM_CONFIDENTIAL',
                NOW() - INTERVAL '40 days'
            ),
            (
                gen_random_uuid(),
                '00000000-0000-0000-0000-000000000001'::uuid,
                'm1000000-0000-0000-0000-000000000002'::uuid,
                'c1000000-0000-0000-0000-000000000002'::uuid,
                'Property Title Deed - Manchester Warehouse',
                'DEED',
                'FINAL',
                (SELECT id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
                'CLIENT_VISIBLE',
                NOW() - INTERVAL '18 days'
            ),
            (
                gen_random_uuid(),
                '00000000-0000-0000-0000-000000000001'::uuid,
                'm1000000-0000-0000-0000-000000000003'::uuid,
                'c1000000-0000-0000-0000-000000000003'::uuid,
                'Software License Agreement - DRAFT v3',
                'CONTRACT',
                'DRAFT',
                (SELECT id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
                'FIRM_CONFIDENTIAL',
                NOW() - INTERVAL '5 days'
            )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- STEP 5: CREATE DEMO INVOICE (if table exists with correct schema)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'organization_id'
    ) THEN
        INSERT INTO invoices (
            id,
            organization_id,
            client_id,
            matter_id,
            invoice_number,
            issue_date,
            due_date,
            status,
            total_amount,
            issued_by,
            created_at
        ) VALUES
            (
                gen_random_uuid(),
                '00000000-0000-0000-0000-000000000001'::uuid,
                'c1000000-0000-0000-0000-000000000001'::uuid,
                'm1000000-0000-0000-0000-000000000001'::uuid,
                'INV-2024-0142',
                CURRENT_DATE - INTERVAL '7 days',
                CURRENT_DATE + INTERVAL '23 days',
                'SENT',
                1600.00,
                (SELECT id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LIMIT 1),
                NOW() - INTERVAL '7 days'
            )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check demo data created:
-- SELECT 'Clients', COUNT(*) FROM clients WHERE organization_id = '00000000-0000-0000-0000-000000000001'
-- UNION ALL
-- SELECT 'Matters', COUNT(*) FROM matters WHERE organization_id = '00000000-0000-0000-0000-000000000001'
-- UNION ALL
-- SELECT 'Time Entries', COUNT(*) FROM time_entries WHERE organization_id = '00000000-0000-0000-0000-000000000001';

-- Check unbilled amount:
-- SELECT SUM(amount) as unbilled_total 
-- FROM time_entries 
-- WHERE organization_id = '00000000-0000-0000-0000-000000000001' 
--   AND status = 'UNBILLED';
