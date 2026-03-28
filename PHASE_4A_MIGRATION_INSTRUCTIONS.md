# Phase 4A: Database Migration Instructions

## Run Migration via Supabase Dashboard

Since `psql` is not available in this environment, run the migration through the Supabase Dashboard:

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `xrzlewoeryvsgbcasmor`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy Migration SQL**
   - Open `database/migrations/020_billing.sql`
   - Copy the entire contents

4. **Execute Migration**
   - Paste the SQL into the editor
   - Click "Run" button
   - Wait for completion

5. **Verify Tables Created**
   Run this query to verify:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('subscriptions', 'payment_methods', 'usage_records', 'stripe_webhook_events');
   ```

   Should return 4 rows.

6. **Check Users Table Updates**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'users' 
   AND column_name IN ('stripe_customer_id', 'current_plan');
   ```

   Should return 2 rows.

## Alternative: Run Migration via Node Script

Create a file `scripts/run-migration.ts`:

```typescript
import { query } from '../lib/api/db';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const migrationPath = path.join(__dirname, '../database/migrations/020_billing.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  try {
    await query(sql);
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
```

Then run:
```bash
npx tsx scripts/run-migration.ts
```

## Quick Verification

After migration, verify the billing system is ready:

```sql
-- Check subscriptions table
SELECT COUNT(*) FROM subscriptions;

-- Check free plans were created for existing users
SELECT u.email, s.plan, s.status 
FROM users u 
LEFT JOIN subscriptions s ON u.id = s.user_id 
LIMIT 5;

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('subscriptions', 'payment_methods', 'usage_records');
```

All existing users should have a free plan subscription created automatically.
