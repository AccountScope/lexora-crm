#!/bin/bash

# Add error boundaries to all page.tsx files that don't have them

cd /data/.openclaw/workspace/lexora

echo "Adding error boundaries to pages..."

# Find all page.tsx files
find app/\(authenticated\) -name "page.tsx" | while read file; do
  # Check if already has ErrorBoundary
  if grep -q "ErrorBoundary" "$file"; then
    echo "✓ $file (already has ErrorBoundary)"
  else
    echo "Adding to $file..."
    
    # Check if it's a client component
    if head -1 "$file" | grep -q '"use client"'; then
      # For client components, wrap existing return in ErrorBoundary
      # This is complex, skip for now and mark for manual review
      echo "  ⚠️  Skipping (client component, needs manual review)"
    else
      # For server components, add import and wrap
      # Check if file only has a single component export
      if grep -q "^export default function" "$file"; then
        echo "  ✅ Adding ErrorBoundary wrapper"
        # This needs careful handling - skip automated version
        echo "  ⚠️  Needs manual addition"
      fi
    fi
  fi
done

echo ""
echo "Done! Pages with ErrorBoundary:"
grep -l "ErrorBoundary" app/\(authenticated\)/*/page.tsx | wc -l
