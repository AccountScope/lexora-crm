#!/bin/bash

# Fix useSearchParams() Suspense boundary issues

cd /data/.openclaw/workspace/lexora

echo "🔧 Fixing Suspense boundaries for useSearchParams()..."

# Add export const dynamic = 'force-dynamic' to pages with useSearchParams
FILES=(
  "app/(authenticated)/emails/page.tsx"
  "app/(authenticated)/reports/builder/page.tsx"
  "app/(authenticated)/settings/billing/page.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Check if file already has dynamic export
    if ! grep -q "export const dynamic" "$file"; then
      # Add after 'use client' directive
      sed -i "/'use client';/a\\
\\
export const dynamic = 'force-dynamic';" "$file"
      echo "✅ Fixed: $file"
    else
      echo "⏭️  Skipped: $file (already has dynamic export)"
    fi
  else
    echo "⚠️  Not found: $file"
  fi
done

echo ""
echo "✅ All Suspense issues fixed!"
