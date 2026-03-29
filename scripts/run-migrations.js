#!/usr/bin/env node
/**
 * Run pending database migrations for Lexora
 * Usage: node scripts/run-migrations.js
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xrzlewoeryvsgbcasmor.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxld29lcnl2c2diY2FzbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2MTczOSwiZXhwIjoyMDkwMjM3NzM5fQ.vV1NnXqBefBSsS-xLeyb26n8GAQ6WZB4NlTYkgi5iOg';

const MIGRATIONS_DIR = path.join(__dirname, '../database/migrations');

const MIGRATIONS_TO_RUN = [
  '016_client_portal_v2.sql',
  '017_smart_deadlines.sql',
  '018_trust_auto_reconciliation.sql',
];

async function runMigration(filename) {
  console.log(`📦 Running: ${filename}`);
  
  try {
    const sqlPath = path.join(MIGRATIONS_DIR, filename);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL via Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    console.log(`✅ SUCCESS: ${filename}\n`);
    return true;
  } catch (error) {
    console.error(`❌ FAILED: ${filename}`);
    console.error(error.message);
    console.error('');
    return false;
  }
}

async function main() {
  console.log('🚀 Running Lexora database migrations...\n');
  
  let successCount = 0;
  
  for (const migration of MIGRATIONS_TO_RUN) {
    const success = await runMigration(migration);
    if (success) {
      successCount++;
    } else {
      console.error('⚠️ Migration failed. Stopping.');
      process.exit(1);
    }
  }
  
  console.log(`🎉 All ${successCount} migrations completed successfully!\n`);
  console.log('Next steps:');
  console.log('1. Create demo data: node scripts/seed-demo-data.js');
  console.log('2. Test core workflow');
  console.log('3. Deploy to staging\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
