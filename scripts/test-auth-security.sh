#!/bin/bash

################################################################################
# Security Test Script - Authentication & Authorization
# 
# Mục đích: Kiểm tra toàn diện tính bảo mật của authentication và authorization
#           trước khi deploy production
#
# Usage:
#   ./scripts/test-auth-security.sh
#   BASE_URL=http://localhost:3000 ./scripts/test-auth-security.sh
#
################################################################################

set -uo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_TIMEOUT="${TEST_TIMEOUT:-10}"

# Counters
PASSED=0
FAILED=0
TOTAL=0

# Results array
FAILED_TESTS=()

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    PASSED=$((PASSED + 1))
    TOTAL=$((TOTAL + 1))
}

log_error() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    FAILED=$((FAILED + 1))
    TOTAL=$((TOTAL + 1))
    FAILED_TESTS+=("$1")
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data="${5:-}"
    local headers="${6:-}"
    
    local curl_cmd="curl -s -o /dev/null -w '%{http_code}'"
    
    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd -H '$headers'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -X $method -H 'Content-Type: application/json' -d '$data'"
    else
        curl_cmd="$curl_cmd -X $method"
    fi
    
    curl_cmd="$curl_cmd --max-time $TEST_TIMEOUT '$BASE_URL$endpoint'"
    
    local status_code
    status_code=$(eval "$curl_cmd" || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        log_success "$description (Expected: $expected_status, Got: $status_code)"
        return 0
    else
        log_error "$description (Expected: $expected_status, Got: $status_code)"
        return 1
    fi
}

test_endpoint_not() {
    local method=$1
    local endpoint=$2
    local forbidden_status=$3
    local description=$4
    local data="${5:-}"
    
    local curl_cmd="curl -s -o /dev/null -w '%{http_code}'"
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -X $method -H 'Content-Type: application/json' -d '$data'"
    else
        curl_cmd="$curl_cmd -X $method"
    fi
    
    curl_cmd="$curl_cmd --max-time $TEST_TIMEOUT '$BASE_URL$endpoint'"
    
    local status_code
    status_code=$(eval "$curl_cmd" || echo "000")
    
    if [ "$status_code" != "$forbidden_status" ]; then
        log_success "$description (Should NOT be $forbidden_status, Got: $status_code)"
        return 0
    else
        log_error "$description (Should NOT be $forbidden_status, Got: $status_code)"
        return 1
    fi
}

################################################################################
# Test Suite
################################################################################

echo ""
echo "================================================================================"
echo "🔒 SECURITY TEST - Authentication & Authorization"
echo "================================================================================"
echo ""
echo "Base URL: $BASE_URL"
echo "Timeout: ${TEST_TIMEOUT}s"
echo ""

# Check if server is accessible
log_info "Checking server accessibility..."
if ! curl -s --max-time 5 "$BASE_URL/api/health" > /dev/null 2>&1; then
    log_error "Server is not accessible at $BASE_URL"
    echo ""
    echo "Please ensure the server is running:"
    echo "  npm run dev"
    echo "  or"
    echo "  docker compose up"
    exit 1
fi
log_success "Server is accessible"

echo ""
echo "================================================================================"
echo "📋 1. ADMIN ROUTES - YÊU CẦU ROLE ADMIN"
echo "================================================================================"
echo ""

log_info "1.1. Testing admin routes WITHOUT session (should return 401)"
echo ""

# Admin translations routes
test_endpoint "GET" "/api/admin/translations" "401" "Admin route GET /api/admin/translations - No session"
test_endpoint "POST" "/api/admin/translations" "401" "Admin route POST /api/admin/translations - No session" '{"key":"test","locale":"en","value":"test"}'
test_endpoint "PUT" "/api/admin/translations" "401" "Admin route PUT /api/admin/translations - No session" '{"translations":[]}'
test_endpoint "GET" "/api/admin/translations/export" "401" "Admin route GET /api/admin/translations/export - No session"
test_endpoint "POST" "/api/admin/translations/sync" "401" "Admin route POST /api/admin/translations/sync - No session"
test_endpoint "GET" "/api/admin/translations/123" "401" "Admin route GET /api/admin/translations/[id] - No session"
test_endpoint "PATCH" "/api/admin/translations/123" "401" "Admin route PATCH /api/admin/translations/[id] - No session" '{"value":"updated"}'
test_endpoint "DELETE" "/api/admin/translations/123" "401" "Admin route DELETE /api/admin/translations/[id] - No session"

# Products/Projects admin routes
test_endpoint "POST" "/api/products/save" "401" "Admin route POST /api/products/save - No session" '{"slug":"test","title":"Test","category":"test","material":"test","year":"2024","thumbnail":"test.jpg"}'
test_endpoint "POST" "/api/projects/save" "401" "Admin route POST /api/projects/save - No session" '{"slug":"test","title":"Test","category":"test","location":"test","area":"test","year":"2024","heroImage":"test.jpg"}'
test_endpoint "POST" "/api/projects/reorder" "401" "Admin route POST /api/projects/reorder - No session" '{"updates":[{"slug":"test","displayOrder":1}]}'
test_endpoint "POST" "/api/upload" "401" "Admin route POST /api/upload - No session"

# Update/Delete routes
test_endpoint "PUT" "/api/products/test-slug" "401" "Admin route PUT /api/products/[slug] - No session" '{"title":"Updated"}'
test_endpoint "DELETE" "/api/products/test-slug" "401" "Admin route DELETE /api/products/[slug] - No session"
test_endpoint "PUT" "/api/projects/test-slug" "401" "Admin route PUT /api/projects/[slug] - No session" '{"title":"Updated"}'
test_endpoint "PATCH" "/api/projects/test-slug" "401" "Admin route PATCH /api/projects/[slug] - No session" '{"displayOrder":1}'
test_endpoint "DELETE" "/api/projects/test-slug" "401" "Admin route DELETE /api/projects/[slug] - No session"

echo ""
log_info "1.2. Testing admin routes with invalid session cookie (should return 401)"
echo ""

test_endpoint "GET" "/api/admin/translations" "401" "Admin route with invalid session" "" "Cookie: next-auth.session-token=invalid-token-12345"
test_endpoint "GET" "/api/admin/translations" "401" "Admin route with empty session" "" "Cookie: next-auth.session-token="
test_endpoint "GET" "/api/admin/translations" "401" "Admin route with malformed cookie" "" "Cookie: invalid-cookie-format"

echo ""
echo "================================================================================"
echo "📋 2. CHANGE PASSWORD ROUTE - CHỈ CẦN SESSION"
echo "================================================================================"
echo ""

log_info "2.1. Testing change password WITHOUT session (should return 401)"
echo ""

test_endpoint "POST" "/api/admin/change-password" "401" "Change password - No session" '{"currentPassword":"old","newPassword":"new123"}'

echo ""
echo "================================================================================"
echo "📋 3. PUBLIC ROUTES - KHÔNG CẦN AUTH"
echo "================================================================================"
echo ""

log_info "3.1. Testing public routes WITHOUT session (should succeed)"
echo ""

test_endpoint_not "GET" "/api/products" "401" "Public route GET /api/products - No session"
test_endpoint_not "GET" "/api/projects" "401" "Public route GET /api/projects - No session"
test_endpoint_not "GET" "/api/products/test-slug" "401" "Public route GET /api/products/[slug] - No session"
test_endpoint_not "GET" "/api/projects/test-slug" "401" "Public route GET /api/projects/[slug] - No session"
test_endpoint_not "GET" "/api/health" "401" "Public route GET /api/health - No session"
test_endpoint_not "POST" "/api/contact" "401" "Public route POST /api/contact - No session" '{"customerName":"Test","email":"test@test.com","phone":"123456789","category":"residential"}'

echo ""
echo "================================================================================"
echo "📋 4. AUTHENTICATION ENDPOINTS - PUBLIC"
echo "================================================================================"
echo ""

log_info "4.1. Testing authentication endpoints WITHOUT session (should succeed)"
echo ""

test_endpoint_not "POST" "/api/auth/forgot-password" "401" "Auth route POST /api/auth/forgot-password - No session" '{"email":"test@test.com"}'
test_endpoint_not "POST" "/api/auth/reset-password" "401" "Auth route POST /api/auth/reset-password - No session" '{"token":"test","newPassword":"new123","confirmPassword":"new123"}'

echo ""
echo "================================================================================"
echo "📋 5. SECURITY HEADERS & RATE LIMITING"
echo "================================================================================"
echo ""

log_info "5.1. Testing security headers"
echo ""

SECURITY_HEADERS=$(curl -s -I --max-time "$TEST_TIMEOUT" "$BASE_URL/api/health" | grep -iE "(x-frame-options|x-content-type-options|x-xss-protection|strict-transport-security)" || true)

if [ -n "$SECURITY_HEADERS" ]; then
    log_success "Security headers present"
else
    log_warning "Security headers not detected (may be set by reverse proxy)"
fi

log_info "5.2. Testing rate limiting (multiple rapid requests)"
echo ""

RATE_LIMIT_DETECTED=false
for i in {1..10}; do
    STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time "$TEST_TIMEOUT" -X POST "$BASE_URL/api/auth/callback/credentials" \
        -H "Content-Type: application/json" \
        -d '{"username":"invalid","password":"invalid"}' 2>/dev/null || echo "000")
    
    if [ "$STATUS" = "429" ] || [ "$STATUS" = "403" ]; then
        RATE_LIMIT_DETECTED=true
        break
    fi
    sleep 0.1
done

if [ "$RATE_LIMIT_DETECTED" = true ]; then
    log_success "Rate limiting is active"
else
    log_warning "Rate limiting not detected after 10 requests (may need more requests or different endpoint)"
fi

echo ""
echo "================================================================================"
echo "📋 6. SQL INJECTION & XSS PROTECTION"
echo "================================================================================"
echo ""

log_info "6.1. Testing SQL injection protection"
echo ""

# Test SQL injection attempts in login
SQL_PAYLOADS=("' OR '1'='1" "admin'--" "admin'; DROP TABLE users;--" "' OR 1=1--")

for payload in "${SQL_PAYLOADS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time "$TEST_TIMEOUT" -X POST "$BASE_URL/api/auth/callback/credentials" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$payload\",\"password\":\"test\"}" 2>/dev/null || echo "000")
    
    if [ "$STATUS" != "200" ] && [ "$STATUS" != "000" ]; then
        log_success "SQL injection protection: '$payload' rejected (Status: $STATUS)"
    else
        log_warning "SQL injection test: '$payload' (Status: $STATUS - may need manual review)"
    fi
done

echo ""
log_info "6.2. Testing XSS protection"
echo ""

XSS_PAYLOADS=("<script>alert('XSS')</script>" "<img src=x onerror=alert(1)>" "javascript:alert(1)")

for payload in "${XSS_PAYLOADS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time "$TEST_TIMEOUT" -X POST "$BASE_URL/api/auth/callback/credentials" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$payload\",\"password\":\"test\"}" 2>/dev/null || echo "000")
    
    if [ "$STATUS" != "200" ] && [ "$STATUS" != "000" ]; then
        log_success "XSS protection: payload rejected (Status: $STATUS)"
    else
        log_warning "XSS test: payload (Status: $STATUS - may need manual review)"
    fi
done

echo ""
echo "================================================================================"
echo "📊 TEST SUMMARY"
echo "================================================================================"
echo ""
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "📊 Total:  $TOTAL"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "❌ Failed Tests:"
    for test in "${FAILED_TESTS[@]}"; do
        echo "   - $test"
    done
    echo ""
    echo "================================================================================"
    echo -e "${RED}⚠️  SECURITY WARNING: Some tests failed!${NC}"
    echo "================================================================================"
    echo ""
    echo "DO NOT deploy to production until all security tests pass!"
    echo ""
    exit 1
else
    echo "================================================================================"
    echo -e "${GREEN}✅ ALL SECURITY TESTS PASSED!${NC}"
    echo "================================================================================"
    echo ""
    echo "The application appears to have proper authentication and authorization."
    echo "However, this is not a complete security audit. Consider:"
    echo "  - Manual penetration testing"
    echo "  - Code review by security experts"
    echo "  - Regular security updates"
    echo ""
    exit 0
fi


