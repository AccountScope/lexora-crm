#!/bin/bash

# Batch add PageHeaders to remaining settings pages

cd /data/.openclaw/workspace/lexora

echo "Adding PageHeaders to settings pages..."

# List of pages to update
PAGES=(
  "email:Email Integration:Connect your email accounts to sync emails and link them to cases"
  "organization:Organization Settings:Manage your firm's profile and preferences"
  "security:Security Settings:Two-factor authentication, login policies, and security logs"
  "team:Team Management:Invite members, assign roles, and manage permissions"
)

for page_info in "${PAGES[@]}"; do
  IFS=':' read -r page title desc <<< "$page_info"
  file="app/(authenticated)/settings/$page/page.tsx"
  
  if [ -f "$file" ]; then
    echo "Processing $file..."
    # This would need manual editing - just documenting what needs to be done
    echo "  - Add: import { PageHeader } from '@/components/ui/page-header';"
    echo "  - Replace h1/p with: <PageHeader title=\"$title\" description=\"$desc\" />"
  fi
done

echo "Done! Manual edits needed for each file."
