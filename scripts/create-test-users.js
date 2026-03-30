#!/usr/bin/env node

const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://xrzlewoeryvsgbcasmor.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxld29lcnl2c2diY2FzbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2MTczOSwiZXhwIjoyMDkwMjM3NzM5fQ.vV1NnXqBefBSsS-xLeyb26n8GAQ6WZB4NlTYkgi5iOg';

const testUsers = [
  {
    email: 'admin@lexora.com',
    password: 'Admin123!',
    user_type: 'STAFF',
    first_name: 'Admin',
    last_name: 'User'
  },
  {
    email: 'harris@lexora.com',
    password: 'Harris123!',
    user_type: 'STAFF',
    first_name: 'Harris',
    last_name: 'Joseph',
    update: true // Update existing user
  },
  {
    email: 'test@lexora.com',
    password: 'Test123!',
    user_type: 'STAFF',
    first_name: 'Test',
    last_name: 'User'
  },
  {
    email: 'solicitor@lexora.com',
    password: 'Solicitor123!',
    user_type: 'STAFF',
    first_name: 'John',
    last_name: 'Solicitor'
  }
];

async function createOrUpdateUser(user) {
  const passwordHash = await bcrypt.hash(user.password, 6);

  const userData = {
    email: user.email,
    password_hash: passwordHash,
    user_type: user.user_type,
    first_name: user.first_name,
    last_name: user.last_name,
    email_verified: true,
    status: 'ACTIVE'
  };

  try {
    if (user.update) {
      // Update existing user
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${user.email}`, {
        method: 'PATCH',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          password_hash: passwordHash,
          first_name: user.first_name,
          last_name: user.last_name,
          email_verified: true,
          status: 'ACTIVE'
        })
      });

      if (!updateRes.ok) {
        const error = await updateRes.text();
        console.error(`❌ Failed to update ${user.email}:`, error);
        return;
      }

      console.log(`✅ Updated: ${user.email} (password: ${user.password})`);
    } else {
      // Check if user exists
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${user.email}`, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      });

      const existing = await checkRes.json();
      if (existing.length > 0) {
        console.log(`⚠️  Skipping ${user.email} (already exists)`);
        return;
      }

      // Create new user
      const createRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(userData)
      });

      if (!createRes.ok) {
        const error = await createRes.text();
        console.error(`❌ Failed to create ${user.email}:`, error);
        return;
      }

      console.log(`✅ Created: ${user.email} (password: ${user.password})`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${user.email}:`, error.message);
  }
}

async function main() {
  console.log('🔧 Creating/updating test users...\n');

  for (const user of testUsers) {
    await createOrUpdateUser(user);
  }

  console.log('\n✅ Done! Test credentials:\n');
  testUsers.forEach(u => {
    console.log(`   ${u.email} / ${u.password}`);
  });
  console.log('');
}

main().catch(console.error);
