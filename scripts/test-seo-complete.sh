#!/bin/sh

# Comprehensive SEO Test Suite
# Tests all SEO steps before production deployment
# Usage: sh scripts/test-seo-complete.sh [BASE_URL]
# Default: http://localhost:3000

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Detect if running in Docker container
DETECTED_URL="http://localhost:3000"
if [ -f /.dockerenv ] || [ -n "${DOCKER_CONTAINER:-}" ]; then
  if command -v curl > /dev/null 2>&1; then
    if curl -sL --max-time 2 "http://localhost:3000" > /dev/null 2>&1; then
      DETECTED_URL="http://localhost:3000"
    elif curl -sL --max-time 2 "http://app:3000" > /dev/null 2>&1; then
      DETECTED_URL="http://app:3000"
    elif curl -sL --max-time 2 "http://host.docker.internal:3000" > /dev/null 2>&1; then
      DETECTED_URL="http://host.docker.internal:3000"
    fi
  fi
fi

BASE_URL="${1:-${DETECTED_URL}}"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Comprehensive SEO Test Suite - Pre-Production Check    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Testing on: ${BASE_URL}${NC}"
echo ""

# Validate URL format
case "$BASE_URL" in
  http://*|https://*)
    ;;
  *)
    echo -e "${RED}❌ Invalid URL format. Must start with http:// or https://${NC}"
    exit 1
    ;;
esac

# Check if server is reachable
echo -e "${YELLOW}Checking server availability...${NC}"
if command -v curl > /dev/null 2>&1; then
  if ! curl -sL --max-time 5 "${BASE_URL}" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot reach server at ${BASE_URL}${NC}"
    echo "   Please make sure the server is running:"
    echo "   - Development: npm run dev"
    echo "   - Production: npm run build && npm start"
    exit 1
  fi
elif command -v wget > /dev/null 2>&1; then
  if ! wget --spider --timeout=5 --tries=1 "${BASE_URL}" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot reach server at ${BASE_URL}${NC}"
    echo "   Please make sure the server is running."
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  Neither curl nor wget found. Skipping server check.${NC}"
fi

echo -e "${GREEN}✅ Server is reachable${NC}"
echo ""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Function to run a test and track results
run_test() {
  local test_name="$1"
  local test_command="$2"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}[${TOTAL_TESTS}] Testing: ${test_name}${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if eval "$test_command"; then
    echo -e "${GREEN}✅ ${test_name}: PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo ""
    return 0
  else
    local exit_code=$?
    if [ $exit_code -eq 2 ]; then
      # Exit code 2 means skipped (some tests use this)
      echo -e "${YELLOW}⚠️  ${test_name}: SKIPPED${NC}"
      SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    else
      echo -e "${RED}❌ ${test_name}: FAILED${NC}"
      FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
    return $exit_code
  fi
}

# Start testing
START_TIME=$(date +%s)

# Step 1: Metadata & Open Graph
run_test "Step 1: Metadata & Open Graph (Unit Tests)" \
  "npm run test:seo"

run_test "Step 1: Metadata & Open Graph (Live Tests)" \
  "npm run test:seo:metadata"

# Step 2: Structured Data
run_test "Step 2: Structured Data (Unit Tests)" \
  "npm run test:seo:structured"

run_test "Step 2: Structured Data (Live Tests)" \
  "npm run test:seo:structured:live"

# Step 3: Technical SEO
run_test "Step 3: Technical SEO (robots.txt & sitemap.xml)" \
  "npm run test:seo:technical"

# Step 4: International SEO
run_test "Step 4: International SEO (hreflang & Content-Language)" \
  "npm run test:seo:international"

# Step 5: Image SEO
run_test "Step 5: Image SEO (alt text, dimensions, filenames)" \
  "npm run test:seo:images"

# Step 6: Performance & Core Web Vitals
run_test "Step 6: Performance & Core Web Vitals" \
  "npm run test:performance"

# Step 7: Content SEO
run_test "Step 7: Content SEO (Semantic HTML, Headings, ARIA)" \
  "npm run test:seo:content"

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# Final summary
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                      Test Summary                            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Total Tests: ${TOTAL_TESTS}${NC}"
echo -e "${GREEN}✅ Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}❌ Failed: ${FAILED_TESTS}${NC}"
if [ "$SKIPPED_TESTS" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Skipped: ${SKIPPED_TESTS}${NC}"
fi
echo ""
echo -e "${BLUE}Duration: ${MINUTES}m ${SECONDS}s${NC}"
echo ""

# Calculate success rate
if [ "$TOTAL_TESTS" -gt 0 ]; then
  SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
  echo -e "${BLUE}Success Rate: ${SUCCESS_RATE}%${NC}"
  echo ""
fi

# Final verdict
if [ "$FAILED_TESTS" -eq 0 ]; then
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✅ ALL SEO TESTS PASSED - READY FOR PRODUCTION!            ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ SOME TESTS FAILED - PLEASE FIX ISSUES BEFORE DEPLOY     ║${NC}"
  echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${YELLOW}Please review the failed tests above and fix the issues.${NC}"
  echo ""
  exit 1
fi
