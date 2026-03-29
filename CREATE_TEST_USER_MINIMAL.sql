-- MINIMAL TEST USER CREATION
-- Just creates auth user + public user record
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Generate user ID
  user_id := gen_random_uuid();
  
  -- Step 1: Create auth user
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
    user_id,
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
  );

  -- Step 2: Create public user record
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
  );

  RAISE NOTICE 'SUCCESS! Test user created:';
  RAISE NOTICE 'Email: sabrina@test.com';
  RAISE NOTICE 'Password: TestPassword123!';
  RAISE NOTICE 'User ID: %', user_id;
  
END $$;
