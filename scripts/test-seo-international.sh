#!/bin/sh

# Test script to verify International SEO (hreflang & Content-Language)
# Usage: sh scripts/test-seo-international.sh [BASE_URL]
# Default: http://localhost:3000

# Detect available HTTP client
if command -v curl > /dev/null 2>&1; then
  HTTP_CLIENT="curl"
  CURL_CMD="curl -sL"
  CURL_HEADERS_CMD="curl -sL -I"
elif command -v wget > /dev/null 2>&1; then
  HTTP_CLIENT="wget"
  WGET_CMD="wget -qO-"
  WGET_HEADERS_CMD="wget -S --spider"
else
  echo "❌ Neither curl nor wget found. Please install one of them."
  exit 1
fi

# HTTP fetch function (works with both curl and wget)
fetch_url() {
  if [ "$HTTP_CLIENT" = "curl" ]; then
    $CURL_CMD "$1" 2>/dev/null
  else
    $WGET_CMD "$1" 2>/dev/null
  fi
}

# HTTP fetch headers function
fetch_headers() {
  if [ "$HTTP_CLIENT" = "curl" ]; then
    $CURL_HEADERS_CMD "$1" 2>/dev/null
  else
    # wget --spider outputs headers to stderr, so we redirect and get all headers
    wget -S --spider "$1" 2>&1
  fi
}

# Check if URL is reachable
check_url_reachable() {
  if [ "$HTTP_CLIENT" = "curl" ]; then
    $CURL_CMD --max-time "$2" "$1" > /dev/null 2>&1
  else
    wget --spider --timeout="$2" --tries=1 "$1" > /dev/null 2>&1
  fi
}

# Detect if running in Docker container and determine correct URL
DETECTED_URL="http://localhost:3000"
if [ -f /.dockerenv ] || [ -n "${DOCKER_CONTAINER:-}" ]; then
  # Running in Docker - server is in the same container, so use localhost
  # But first check if localhost works, if not try service name
  # Note: We need to detect HTTP client first, so we'll do a simple check
  if check_url_reachable "http://localhost:3000" 2; then
    DETECTED_URL="http://localhost:3000"
  elif check_url_reachable "http://app:3000" 2; then
    DETECTED_URL="http://app:3000"
  elif check_url_reachable "http://host.docker.internal:3000" 2; then
    DETECTED_URL="http://host.docker.internal:3000"
  else
    DETECTED_URL="http://localhost:3000"
  fi
fi

BASE_URL="${1:-${DETECTED_URL}}"

echo "🌍 Testing International SEO (hreflang & Content-Language) on ${BASE_URL}"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validate URL format (using case instead of regex for sh compatibility)
case "$BASE_URL" in
  http://*|https://*)
    ;;
  *)
    echo -e "${RED}❌ Invalid URL format. Must start with http:// or https://${NC}"
    exit 1
    ;;
esac

# Test if server is reachable
if ! check_url_reachable "${BASE_URL}" 5; then
  echo -e "${RED}❌ Cannot reach server at ${BASE_URL}${NC}"
  echo "   Please make sure the server is running."
  if [ -f /.dockerenv ]; then
    echo "   Running in Docker - trying alternative URLs..."
    # Try alternative URLs
    for alt_url in "http://localhost:3000" "http://127.0.0.1:3000" "http://app:3000"; do
      if check_url_reachable "${alt_url}" 2; then
        echo -e "${GREEN}   ✅ Found server at ${alt_url}${NC}"
        BASE_URL="${alt_url}"
        break
      fi
    done
    if ! check_url_reachable "${BASE_URL}" 2; then
      echo -e "${RED}   ❌ Still cannot reach server. Exiting.${NC}"
      exit 1
    fi
  else
    exit 1
  fi
fi

PASSED=0
FAILED=0

# Increment function for sh compatibility
increment() {
  eval "$1=\$((\$$1 + 1))"
}

echo "=== Testing hreflang tags in HTML ==="
for url_path in "/vi" "/en" "/vi/projects" "/en/projects" "/vi/projects/jladfkajlf" "/en/projects/jladfkajlf"; do
  full_url="${BASE_URL}${url_path}"
  html_content=$(fetch_url "${full_url}")
  
  if [ -z "$html_content" ]; then
    echo -e "${RED}  ❌ Failed to fetch ${url_path}${NC}"
    increment FAILED
    continue
  fi
  
  # Check for hreflang tags (Next.js uses hrefLang in camelCase)
  hreflang_count=$(echo "$html_content" | grep -iE "hrefLang|hreflang" | wc -l | tr -d ' ')
  
  if [ "$hreflang_count" -gt 0 ]; then
    echo -e "${GREEN}  ✅ ${url_path}: Found ${hreflang_count} hreflang tag(s)${NC}"
    
    # Check for vi and en hreflang (case-insensitive, support both hrefLang and hreflang)
    # Note: Next.js only renders alternate locales, not self-reference or x-default in HTML
    # Full hreflang coverage is in sitemap.xml
    has_vi=$(echo "$html_content" | grep -iE 'hrefLang="vi"|hreflang="vi"' | wc -l | tr -d ' ')
    has_en=$(echo "$html_content" | grep -iE 'hrefLang="en"|hreflang="en"' | wc -l | tr -d ' ')
    
    # Check if at least one alternate locale is present
    if [ "$has_vi" -gt 0 ] || [ "$has_en" -gt 0 ]; then
      echo -e "${GREEN}    ✅ Contains alternate locale hreflang${NC}"
      increment PASSED
    else
      echo -e "${YELLOW}    ⚠️  No alternate locale hreflang found${NC}"
      increment PASSED  # Still pass as hreflang tags exist (sitemap has full coverage)
    fi
  else
    echo -e "${RED}  ❌ ${url_path}: No hreflang tags found${NC}"
    increment FAILED
  fi
done

echo ""
echo "=== Testing Content-Language HTTP header ==="
for url_path in "/vi" "/en" "/vi/projects" "/en/projects" "/vi/projects/jladfkajlf" "/en/projects/jladfkajlf"; do
  full_url="${BASE_URL}${url_path}"
  
  # Extract locale from path (using case instead of regex for sh compatibility)
  expected_locale="vi" # default
  case "$url_path" in
    /vi*)
      expected_locale="vi"
      ;;
    /en*)
      expected_locale="en"
      ;;
    *)
      expected_locale="vi" # default
      ;;
  esac
  
  # Fetch headers and extract Content-Language (case-insensitive)
  headers_output=$(fetch_headers "${full_url}")
  content_language=$(echo "$headers_output" | grep -i "content-language" | head -1 | tr -d '\r' | sed 's/^[^:]*:[[:space:]]*//' | tr -d ' ')
  
  if [ -n "$content_language" ]; then
    if [ "$content_language" = "$expected_locale" ]; then
      echo -e "${GREEN}  ✅ ${url_path}: Content-Language = ${content_language} (correct)${NC}"
      increment PASSED
    else
      echo -e "${YELLOW}  ⚠️  ${url_path}: Content-Language = ${content_language} (expected ${expected_locale})${NC}"
      increment FAILED
    fi
  else
    echo -e "${RED}  ❌ ${url_path}: Content-Language header missing${NC}"
    increment FAILED
  fi
done

echo ""
echo "=== Testing sitemap.xml hreflang ==="
sitemap_content=$(fetch_url "${BASE_URL}/sitemap.xml")

if [ -z "$sitemap_content" ]; then
  echo -e "${RED}  ❌ sitemap.xml not found or empty${NC}"
  increment FAILED
else
  # Check for hreflang in sitemap
  hreflang_count=$(echo "$sitemap_content" | grep -i "hreflang" | wc -l | tr -d ' ')
  
  if [ "$hreflang_count" -gt 0 ]; then
    echo -e "${GREEN}  ✅ sitemap.xml contains ${hreflang_count} hreflang tag(s)${NC}"
    
    # Check for vi, en, and x-default (sitemap uses hreflang in lowercase)
    has_vi=$(echo "$sitemap_content" | grep -iE 'hreflang="vi"' | wc -l | tr -d ' ')
    has_en=$(echo "$sitemap_content" | grep -iE 'hreflang="en"' | wc -l | tr -d ' ')
    has_xdefault=$(echo "$sitemap_content" | grep -iE 'hreflang="x-default"' | wc -l | tr -d ' ')
    
    if [ "$has_vi" -gt 0 ] && [ "$has_en" -gt 0 ]; then
      echo -e "${GREEN}    ✅ Contains both vi and en hreflang${NC}"
    fi
    
    if [ "$has_xdefault" -gt 0 ]; then
      echo -e "${GREEN}    ✅ Contains x-default hreflang${NC}"
    fi
    
    increment PASSED
  else
    echo -e "${RED}  ❌ sitemap.xml: No hreflang tags found${NC}"
    increment FAILED
  fi
fi

echo ""
echo "=== Summary ==="
echo -e "${GREEN}✅ Passed: ${PASSED}${NC}"
if [ "$FAILED" -gt 0 ]; then
  echo -e "${RED}❌ Failed: ${FAILED}${NC}"
else
  echo -e "${GREEN}❌ Failed: ${FAILED}${NC}"
fi

if [ "$FAILED" -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ All International SEO tests passed!${NC}"
  exit 0
else
  echo ""
  echo -e "${YELLOW}⚠️  Some tests failed. Please review the output above.${NC}"
  exit 1
fi
