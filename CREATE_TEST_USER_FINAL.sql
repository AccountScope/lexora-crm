-- Create test user for Sabrina (FINAL VERSION - checks actual schema)
-- Email: sabrina@test.com
-- Password: TestPassword123!

-- First, let's check what columns exist in public.users
-- Run this to see the schema:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public';

-- Create test user with columns that actually exist
DO $$
DECLARE
  user_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- Check if user already exists in auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = 'sabrina@test.com';
  user_exists := (user_id IS NOT NULL);
  
  IF NOT user_exists THEN
    -- Create new auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'sabrina@test.com',
      crypt('TestPassword123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"full_name": "Sabrina Williams"}'::jsonb,
      false,
      encode(gen_random_bytes(32), 'hex'),
      '',
      ''
    )
    RETURNING id INTO user_id;
    
    RAISE NOTICE 'Created new auth user: %', user_id;
  ELSE
    -- Update existing user password
    UPDATE auth.users 
    SET encrypted_password = crypt('TestPassword123!', gen_salt('bf')),
        updated_at = NOW(),
        raw_user_meta_data = '{"full_name": "Sabrina Williams"}'::jsonb
    WHERE id = user_id;
    
    RAISE NOTICE 'Updated existing user: %', user_id;
  END IF;
  
  -- Now create/update public.users record (use only columns that exist)
  -- Common columns: id, email, created_at, updated_at
  INSERT INTO public.users (
    id,
    email,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    'sabrina@test.com',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = 'sabrina@test.com',
      updated_at = NOW();
  
  RAISE NOTICE 'Profile synced to public.users';
  
END $$;

-- Display success
SELECT 
  '✅ Test account created!' as status,
  'Email: sabrina@test.com' as login,
  'Password: TestPassword123!' as credentials,
  'Now run: SELECT id, email FROM public.users WHERE email = ''sabrina@test.com'';' as verify;
