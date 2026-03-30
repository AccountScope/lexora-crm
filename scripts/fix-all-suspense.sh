#!/bin/bash

cd /data/.openclaw/workspace/lexora

# Function to wrap a page with Suspense
wrap_page() {
  local PAGE_PATH="$1"
  local DIR=$(dirname "$PAGE_PATH")
  local CONTENT_FILE="$DIR/$(basename "$DIR")-content.tsx"
  
  echo "Processing: $PAGE_PATH"
  
  # Backup original
  cp "$PAGE_PATH" "$PAGE_PATH.backup"
  
  # Move content to -content.tsx file
  cat "$PAGE_PATH" | sed 's/^export default function \(.*\)Page()/export function \1PageContent()/' > "$CONTENT_FILE"
  
  # Create new wrapper page
  cat > "$PAGE_PATH" <<'EOF'
'use client';

import { Suspense } from 'react';
import { COMPONENT_IMPORT } from './COMPONENT_FILE';

export default function FUNCTION_NAME() {
  return (
    <Suspense fallback={<div className="p-8 animate-pulse">Loading...</div>}>
      <COMPONENT_NAME />
    </Suspense>
  );
}
EOF
  
  # Replace placeholders based on filename
  local BASE_NAME=$(basename "$DIR")
  local COMPONENT_NAME="${BASE_NAME^}PageContent"
  local FUNCTION_NAME="${BASE_NAME^}Page"
  
  sed -i "s/COMPONENT_IMPORT/${COMPONENT_NAME}/g" "$PAGE_PATH"
  sed -i "s/COMPONENT_FILE/${BASE_NAME}-content/g" "$PAGE_PATH"
  sed -i "s/COMPONENT_NAME/${COMPONENT_NAME}/g" "$PAGE_PATH"
  sed -i "s/FUNCTION_NAME/${FUNCTION_NAME}/g" "$PAGE_PATH"
  
  echo "✅ Created: $CONTENT_FILE"
  echo "✅ Updated: $PAGE_PATH"
}

# Manually handle each one since they have different structures

# 1. Reports Builder
echo "=== Reports Builder ==="
cp "app/(authenticated)/reports/builder/page.tsx" "app/(authenticated)/reports/builder/builder-content.tsx"
sed -i 's/^export default function ReportBuilderPage()/export function ReportBuilderPageContent()/' "app/(authenticated)/reports/builder/builder-content.tsx"

cat > "app/(authenticated)/reports/builder/page.tsx" <<'EOF'
'use client';

import { Suspense } from 'react';
import { ReportBuilderPageContent } from './builder-content';

export default function ReportBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 animate-pulse">Loading report builder...</div>}>
      <ReportBuilderPageContent />
    </Suspense>
  );
}
EOF

# 2. Settings Billing
echo "=== Settings Billing ==="
cp "app/(authenticated)/settings/billing/page.tsx" "app/(authenticated)/settings/billing/billing-content.tsx"
sed -i 's/^export default function BillingPage()/export function BillingPageContent()/' "app/(authenticated)/settings/billing/billing-content.tsx"

cat > "app/(authenticated)/settings/billing/page.tsx" <<'EOF'
'use client';

import { Suspense } from 'react';
import { BillingPageContent } from './billing-content';

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 animate-pulse">Loading billing...</div>}>
      <BillingPageContent />
    </Suspense>
  );
}
EOF

# 3. Trust Accounting Transactions New
echo "=== Trust Accounting Transactions New ==="
cp "app/(authenticated)/trust-accounting/transactions/new/page.tsx" "app/(authenticated)/trust-accounting/transactions/new/new-content.tsx"
sed -i 's/^export default function NewTransactionPage()/export function NewTransactionPageContent()/' "app/(authenticated)/trust-accounting/transactions/new/new-content.tsx"

cat > "app/(authenticated)/trust-accounting/transactions/new/page.tsx" <<'EOF'
'use client';

import { Suspense } from 'react';
import { NewTransactionPageContent } from './new-content';

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<div className="p-8 animate-pulse">Loading transaction form...</div>}>
      <NewTransactionPageContent />
    </Suspense>
  );
}
EOF

echo ""
echo "✅ All pages wrapped with Suspense!"
echo ""
echo "Modified pages:"
echo "  - app/(authenticated)/emails/page.tsx (already done)"
echo "  - app/(authenticated)/reports/builder/page.tsx"
echo "  - app/(authenticated)/settings/billing/page.tsx"
echo "  - app/(authenticated)/trust-accounting/transactions/new/page.tsx"
