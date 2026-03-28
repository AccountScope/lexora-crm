#!/bin/bash
# Verification script for Phase 4A Billing Integration

echo "🔍 Verifying Phase 4A: Stripe Billing Integration"
echo "=================================================="
echo ""

# Check if all files exist
echo "📁 Checking files..."
files=(
  "database/migrations/020_billing.sql"
  "lib/stripe/config.ts"
  "lib/stripe/checkout.ts"
  "lib/stripe/subscriptions.ts"
  "lib/stripe/webhooks.ts"
  "lib/stripe/usage.ts"
  "app/api/billing/checkout/route.ts"
  "app/api/billing/portal/route.ts"
  "app/api/billing/subscription/route.ts"
  "app/api/webhooks/stripe/route.ts"
  "components/billing/pricing-table.tsx"
  "components/billing/subscription-card.tsx"
  "components/billing/usage-display.tsx"
  "components/billing/payment-method-form.tsx"
  "app/(authenticated)/settings/billing/page.tsx"
  "app/(authenticated)/settings/billing/invoices/page.tsx"
  "app/pricing/page.tsx"
)

all_exist=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (MISSING)"
    all_exist=false
  fi
done

echo ""

# Check environment variables
echo "🔐 Checking environment variables..."
env_vars=(
  "STRIPE_SECRET_KEY"
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "STRIPE_PRICE_ESSENTIAL"
  "STRIPE_PRICE_PROFESSIONAL"
  "STRIPE_PRICE_ENTERPRISE"
)

missing_vars=()
for var in "${env_vars[@]}"; do
  if grep -q "^${var}=" .env.local 2>/dev/null; then
    value=$(grep "^${var}=" .env.local | cut -d= -f2)
    if [ "$value" == "sk_test_51234567890" ] || [ "$value" == "pk_test_51234567890" ] || [ "$value" == "whsec_test_1234567890" ] || [[ "$value" == price_*_test ]]; then
      echo "⚠️  $var (placeholder - needs real value)"
    else
      echo "✅ $var"
    fi
  else
    echo "❌ $var (MISSING)"
    missing_vars+=("$var")
  fi
done

echo ""

# Check dependencies
echo "📦 Checking npm dependencies..."
if npm list stripe >/dev/null 2>&1; then
  echo "✅ stripe"
else
  echo "❌ stripe (not installed)"
fi

if npm list @stripe/stripe-js >/dev/null 2>&1; then
  echo "✅ @stripe/stripe-js"
else
  echo "❌ @stripe/stripe-js (not installed)"
fi

echo ""

# Summary
echo "📊 Summary"
echo "=========="

if $all_exist; then
  echo "✅ All files present"
else
  echo "❌ Some files are missing"
fi

if [ ${#missing_vars[@]} -eq 0 ]; then
  echo "✅ All environment variables present"
else
  echo "⚠️  ${#missing_vars[@]} environment variables need configuration"
fi

echo ""
echo "📚 Next Steps:"
echo "1. Configure real Stripe keys in .env.local"
echo "2. Run database migration (see PHASE_4A_MIGRATION_INSTRUCTIONS.md)"
echo "3. Test checkout flow at /pricing"
echo "4. Configure webhook endpoint in Stripe Dashboard"
echo ""
echo "📖 Full setup guide: PHASE_4A_BILLING_SETUP.md"
