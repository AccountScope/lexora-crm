-- Create test user for Sabrina (SIMPLE VERSION)
-- Email: sabrina@test.com
-- Password: TestPassword123!

-- Step 1: Check if user exists
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Try to find existing user
  SELECT id INTO user_id FROM auth.users WHERE email = 'sabrina@test.com';
  
  IF user_id IS NULL THEN
    -- User doesn't exist, create new one
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
    
    RAISE NOTICE 'Created new auth user with ID: %', user_id;
  ELSE
    RAISE NOTICE 'User already exists with ID: %', user_id;
    
    -- Update password if user exists
    UPDATE auth.users 
    SET encrypted_password = crypt('TestPassword123!', gen_salt('bf')),
        updated_at = NOW()
    WHERE id = user_id;
    
    RAISE NOTICE 'Updated password for existing user';
  END IF;
  
  -- Create or update profile in public.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    'sabrina@test.com',
    'Sabrina Williams',
    'solicitor',
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = 'Sabrina Williams',
      role = 'solicitor',
      status = 'active',
      updated_at = NOW();
  
  RAISE NOTICE 'Profile created/updated in public.users';
END $$;

-- Display success message
SELECT 
  '✅ Test account ready!' as status,
  'sabrina@test.com' as email,
  'TestPassword123!' as password,
  'Sabrina Williams' as name;
