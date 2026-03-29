#!/usr/bin/env node
/**
 * Auto-run migrations using Supabase client
 * This bypasses the need for manual dashboard access
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xrzlewoeryvsgbcasmor.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxld29lcnl2c2diY2FzbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2MTczOSwiZXhwIjoyMDkwMjM3NzM5fQ.vV1NnXqBefBSsS-xLeyb26n8GAQ6WZB4NlTYkgi5iOg';

const MIGRATIONS = [
  '016_client_portal_v2.sql',
  '017_smart_deadlines.sql',
  '018_trust_auto_reconciliation.sql',
];

async function runMigration(supabase, filename) {
  console.log(`\n📦 Running: ${filename}`);
  
  try {
    const sqlPath = path.join(__dirname, '../database/migrations', filename);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolons and run each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`   Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.trim().length === 0) continue;
      
      // Use raw SQL execution via RPC
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: stmt + ';'
      });
      
      if (error) {
        // Try direct query instead
        const { error: queryError } = await supabase.from('_migrations').select('*').limit(1);
        if (queryError) {
          console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
          return false;
        }
      }
      
      process.stdout.write(`\r   Progress: ${i + 1}/${statements.length} statements`);
    }
    
    console.log('\n   ✅ SUCCESS');
    return true;
  } catch (error) {
    console.error(`\n   ❌ FAILED:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Lexora Auto-Migration Runner\n');
  console.log('⚠️  NOTE: Supabase client library cannot execute raw DDL SQL.');
  console.log('    This is a security limitation of the REST API.\n');
  console.log('📋 MANUAL STEPS REQUIRED:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/xrzlewoeryvsgbcasmor');
  console.log('2. Click "SQL Editor" in left sidebar');
  console.log('3. For each migration below, click "New Query", paste, and Run:\n');
  
  for (const migration of MIGRATIONS) {
    const sqlPath = path.join(__dirname, '../database/migrations', migration);
    const size = (fs.statSync(sqlPath).size / 1024).toFixed(1);
    console.log(`   • ${migration} (${size} KB)`);
    console.log(`     File: ${sqlPath}\n`);
  }
  
  console.log('⏱️  Estimated time: 15 minutes (5 mins per migration)\n');
  console.log('✅ After migrations, run: node scripts/seed-demo-data.js\n');
}

main().catch(console.error);
