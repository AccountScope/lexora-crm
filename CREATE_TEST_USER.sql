-- Create test user for Sabrina
-- Email: sabrina@test.com
-- Password: TestPassword123!

-- Insert into auth.users (Supabase auth table)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role
)
VALUES (
  gen_random_uuid(),
  'sabrina@test.com',
  crypt('TestPassword123!', gen_salt('bf')), -- Password hash
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Sabrina Williams", "role": "solicitor"}'::jsonb,
  'authenticated'
)
ON CONFLICT (email) DO UPDATE
SET encrypted_password = crypt('TestPassword123!', gen_salt('bf')),
    updated_at = NOW();

-- Insert into public.users table
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  status,
  created_at
)
SELECT 
  id,
  'sabrina@test.com',
  'Sabrina Williams',
  'solicitor',
  'active',
  NOW()
FROM auth.users
WHERE email = 'sabrina@test.com'
ON CONFLICT (id) DO UPDATE
SET full_name = 'Sabrina Williams',
    role = 'solicitor',
    status = 'active',
    updated_at = NOW();

-- Success message
SELECT 
  '✅ Test account created!' as status,
  'sabrina@test.com' as email,
  'TestPassword123!' as password,
  'Sabrina Williams' as name,
  'solicitor' as role;
