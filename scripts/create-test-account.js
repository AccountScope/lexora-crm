#!/usr/bin/env node
/**
 * Create Test Account for Sabrina
 * Email: sabrina@test.com
 * Password: TestPassword123!
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrzlewoeryvsgbcasmor.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxld29lcnl2c2diY2FzbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2MTczOSwiZXhwIjoyMDkwMjM3NzM5fQ.vV1NnXqBefBSsS-xLeyb26n8GAQ6WZB4NlTYkgi5iOg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestAccount() {
  console.log('🔐 Creating test account for Sabrina...\n');

  try {
    const email = 'sabrina@test.com';
    const password = 'TestPassword123!';
    const fullName = 'Sabrina Williams';

    // 1. Create auth user via Supabase Auth Admin API
    console.log('📧 Creating Supabase auth user...');
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        role: 'solicitor',
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      process.exit(1);
    }

    console.log(`✅ Auth user created: ${authUser.user.id}\n`);

    // 2. Create user record in users table
    console.log('👤 Creating user profile...');

    const { error: userError } = await supabase
      .from('users')
      .insert([{
        id: authUser.user.id,
        email,
        full_name: fullName,
        role: 'solicitor',
        status: 'active',
        created_at: new Date().toISOString(),
      }]);

    if (userError) {
      console.error('❌ Error creating user profile:', userError.message);
      process.exit(1);
    }

    console.log(`✅ User profile created\n`);

    console.log('🎉 Test account created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    sabrina@test.com');
    console.log('🔑 Password: TestPassword123!');
    console.log('👤 Name:     Sabrina Williams');
    console.log('🎭 Role:     Solicitor');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🚀 Sabrina can now login at: https://lexora.vercel.app/login\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

createTestAccount()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
