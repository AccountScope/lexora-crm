#!/bin/bash
# Run pending database migrations for Lexora
# Usage: ./scripts/run-migrations.sh

set -e

SUPABASE_URL="https://xrzlewoeryvsgbcasmor.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyemxld29lcnl2c2diY2FzbW9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2MTczOSwiZXhwIjoyMDkwMjM3NzM5fQ.vV1NnXqBefBSsS-xLeyb26n8GAQ6WZB4NlTYkgi5iOg"

echo "🚀 Running Lexora database migrations..."
echo ""

# Array of migrations to run
MIGRATIONS=(
  "016_client_portal_v2.sql"
  "017_smart_deadlines.sql"
  "018_trust_auto_reconciliation.sql"
)

for migration in "${MIGRATIONS[@]}"; do
  echo "📦 Running: $migration"
  
  # Read SQL file
  SQL_CONTENT=$(cat "database/migrations/$migration")
  
  # Execute via Supabase REST API (SQL editor endpoint)
  RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(jq -Rs . <<< "$SQL_CONTENT")}" \
    2>&1)
  
  # Check for errors
  if echo "$RESPONSE" | grep -qi "error"; then
    echo "❌ FAILED: $migration"
    echo "$RESPONSE"
    exit 1
  else
    echo "✅ SUCCESS: $migration"
  fi
  
  echo ""
done

echo "🎉 All migrations completed successfully!"
echo ""
echo "Next steps:"
echo "1. Create demo data (npm run seed:demo)"
echo "2. Test core workflow"
echo "3. Deploy to staging"
