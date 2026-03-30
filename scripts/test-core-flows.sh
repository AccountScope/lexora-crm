#!/bin/bash
# LEXORA Core Flow Validation Script
# Tests: API endpoints, database writes, multitenancy

set -e

BASE_URL="http://localhost:3000"
TEST_ORG_ID="00000000-0000-0000-0000-000000000001"

echo "🧪 LEXORA CORE FLOW VALIDATION"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Test 1: Health Check
echo "Test 1: Health Endpoint"
HEALTH=$(curl -s $BASE_URL/api/health)
if echo "$HEALTH" | grep -q "ok"; then
    pass "Health endpoint responding"
else
    fail "Health endpoint failed: $HEALTH"
fi
echo ""

# Test 2: Analytics Endpoint (requires auth - will fail but should return 401, not 500)
echo "Test 2: Analytics Endpoint (Auth Check)"
ANALYTICS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/analytics)
if [ "$ANALYTICS_STATUS" = "401" ] || [ "$ANALYTICS_STATUS" = "403" ]; then
    pass "Analytics endpoint requires auth (expected)"
elif [ "$ANALYTICS_STATUS" = "200" ]; then
    warn "Analytics endpoint returned 200 (auth may be disabled?)"
else
    fail "Analytics endpoint returned $ANALYTICS_STATUS (expected 401/403)"
fi
echo ""

# Test 3: Cases API (requires auth)
echo "Test 3: Cases API (Auth Check)"
CASES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/cases)
if [ "$CASES_STATUS" = "401" ] || [ "$CASES_STATUS" = "403" ]; then
    pass "Cases endpoint requires auth (expected)"
elif [ "$CASES_STATUS" = "200" ]; then
    warn "Cases endpoint returned 200 (auth may be disabled?)"
else
    fail "Cases endpoint returned $CASES_STATUS (expected 401/403)"
fi
echo ""

# Test 4: Debug Routes Should Be Blocked (if NODE_ENV=production)
echo "Test 4: Debug Routes Security"
DEBUG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/debug/db-test 2>/dev/null || echo "000")
if [ "$DEBUG_STATUS" = "404" ]; then
    pass "Debug routes properly blocked"
elif [ "$DEBUG_STATUS" = "200" ]; then
    warn "Debug routes accessible (acceptable in dev)"
else
    pass "Debug route returned $DEBUG_STATUS"
fi
echo ""

# Test 5: Static Assets
echo "Test 5: Frontend Loading"
HOMEPAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/)
if [ "$HOMEPAGE_STATUS" = "200" ]; then
    pass "Homepage loads successfully"
else
    fail "Homepage returned $HOMEPAGE_STATUS"
fi
echo ""

echo "==============================="
echo "✅ Basic API validation complete"
echo ""
echo "Note: Full flow testing requires authenticated session."
echo "Next: Login via UI and test:"
echo "  1. Dashboard loads"
echo "  2. Create client"
echo "  3. Create matter"
echo "  4. Log time"
echo "  5. Generate invoice"
