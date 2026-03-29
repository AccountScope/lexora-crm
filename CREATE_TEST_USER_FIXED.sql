-- Create test user: Sabrina Williams (solicitor)
-- Fixed: Uses first_name/last_name instead of full_name

DO $$
DECLARE
  user_id UUID;
  client_id UUID;
  matter_id UUID;
  role_id UUID;
BEGIN
  -- Step 1: Create Supabase auth user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'sabrina@test.com',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    'authenticated'
  )
  RETURNING id INTO user_id;

  -- Step 2: Create public users record (FIXED: first_name/last_name)
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    user_type,
    status,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    'sabrina@test.com',
    'Sabrina',
    'Williams',
    'STAFF',
    'ACTIVE',
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = 'Sabrina',
    last_name = 'Williams',
    user_type = 'STAFF',
    status = 'ACTIVE',
    email_verified = TRUE,
    updated_at = NOW();

  -- Step 3: Get solicitor role ID
  SELECT id INTO role_id FROM public.roles WHERE name = 'Solicitor' LIMIT 1;
  
  IF role_id IS NULL THEN
    RAISE EXCEPTION 'Solicitor role not found. Run seed data first.';
  END IF;

  -- Step 4: Assign role
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (user_id, role_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  -- Step 5: Create a test client
  INSERT INTO public.clients (
    id,
    name,
    email,
    phone,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'Test Client Ltd',
    'client@test.com',
    '+44 20 1234 5678',
    NOW(),
    NOW()
  )
  RETURNING id INTO client_id;

  -- Step 6: Create a test matter
  INSERT INTO public.matters (
    id,
    client_id,
    title,
    reference_number,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    client_id,
    'Estate Settlement - Smith',
    'MAT-2026-001',
    'OPEN',
    NOW(),
    NOW()
  )
  RETURNING id INTO matter_id;

  RAISE NOTICE 'Test user created successfully!';
  RAISE NOTICE 'Email: sabrina@test.com';
  RAISE NOTICE 'Password: TestPassword123!';
  RAISE NOTICE 'User ID: %', user_id;
  RAISE NOTICE 'Client ID: %', client_id;
  RAISE NOTICE 'Matter ID: %', matter_id;
  
END $$;
