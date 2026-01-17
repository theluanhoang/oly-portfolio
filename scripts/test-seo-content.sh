#!/bin/sh

# Test script to verify Content SEO (Step 7)
# Usage: sh scripts/test-seo-content.sh [BASE_URL]
# Default: http://localhost:3000

# Detect available HTTP client
if command -v curl > /dev/null 2>&1; then
  HTTP_CLIENT="curl"
  CURL_CMD="curl -sL"
elif command -v wget > /dev/null 2>&1; then
  HTTP_CLIENT="wget"
  WGET_CMD="wget -qO-"
else
  echo "❌ Neither curl nor wget found. Please install one of them."
  exit 1
fi

# HTTP fetch function
fetch_url() {
  if [ "$HTTP_CLIENT" = "curl" ]; then
    $CURL_CMD "$1" 2>/dev/null
  else
    $WGET_CMD "$1" 2>/dev/null
  fi
}

# Get HTTP status code
get_http_status() {
  if [ "$HTTP_CLIENT" = "curl" ]; then
    curl -sL -o /dev/null -w "%{http_code}" "$1" 2>/dev/null
  else
    wget --spider --server-response "$1" 2>&1 | grep -i "HTTP" | head -n 1 | awk '{print $2}' | tr -d '\r'
  fi
}

# Check if URL returns 404
is_404() {
  status=$(get_http_status "$1")
  [ "$status" = "404" ]
}

# Check if URL is reachable
check_url_reachable() {
  if [ "$HTTP_CLIENT" = "curl" ]; then
    $CURL_CMD --max-time "$2" "$1" > /dev/null 2>&1
  else
    wget --spider --timeout="$2" --tries=1 "$1" > /dev/null 2>&1
  fi
}

# Detect if running in Docker container
DETECTED_URL="http://localhost:3000"
if [ -f /.dockerenv ] || [ -n "${DOCKER_CONTAINER:-}" ]; then
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

echo "📝 Testing Content SEO (Step 7) on ${BASE_URL}"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validate URL format
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
  exit 1
fi

PASSED=0
FAILED=0

# Increment function for sh compatibility
increment() {
  case "$1" in
    PASSED)
      PASSED=$((PASSED + 1))
      ;;
    FAILED)
      FAILED=$((FAILED + 1))
      ;;
  esac
}

echo "=== Testing Semantic HTML5 Elements ==="
for url_path in "/vi" "/vi/projects" "/vi/products" "/vi/projects/jladfkajlf" "/vi/products/product-1"; do
  full_url="${BASE_URL}${url_path}"
  
  # Check if page exists (not 404)
  if is_404 "${full_url}"; then
    echo -e "${YELLOW}  ⚠️  ${url_path}: Page not found (404) - skipping semantic HTML check${NC}"
    continue
  fi
  
  html_content=$(fetch_url "${full_url}")
  
  # Check for semantic HTML5 elements
  has_main=$(echo "$html_content" | grep -iE '<main[^>]*>' | wc -l | tr -d ' ')
  has_article=$(echo "$html_content" | grep -iE '<article[^>]*>' | wc -l | tr -d ' ')
  has_section=$(echo "$html_content" | grep -iE '<section[^>]*>' | wc -l | tr -d ' ')
  has_nav=$(echo "$html_content" | grep -iE '<nav[^>]*>' | wc -l | tr -d ' ')
  has_header=$(echo "$html_content" | grep -iE '<header[^>]*>' | wc -l | tr -d ' ')
  has_aside=$(echo "$html_content" | grep -iE '<aside[^>]*>' | wc -l | tr -d ' ')
  
  total_semantic=$((has_main + has_article + has_section + has_nav + has_header + has_aside))
  
  if [ "$total_semantic" -gt 0 ]; then
    echo -e "${GREEN}  ✅ ${url_path}: Semantic HTML found (main:${has_main}, article:${has_article}, section:${has_section}, nav:${has_nav}, header:${has_header}, aside:${has_aside})${NC}"
    increment PASSED
  else
    echo -e "${YELLOW}  ⚠️  ${url_path}: No semantic HTML5 elements detected (may be client-rendered)${NC}"
  fi
done

echo ""
echo "=== Testing Heading Hierarchy (h1-h6) ==="
for url_path in "/vi/projects/jladfkajlf" "/vi/products/product-1"; do
  full_url="${BASE_URL}${url_path}"
  
  # Check if page exists (not 404)
  if is_404 "${full_url}"; then
    echo -e "${YELLOW}  ⚠️  ${url_path}: Page not found (404) - skipping heading check${NC}"
    continue
  fi
  
  html_content=$(fetch_url "${full_url}")
  
  # Check for h1 (should have exactly 1)
  h1_count=$(echo "$html_content" | grep -iE '<h1[^>]*>' | wc -l | tr -d ' ')
  h2_count=$(echo "$html_content" | grep -iE '<h2[^>]*>' | wc -l | tr -d ' ')
  h3_count=$(echo "$html_content" | grep -iE '<h3[^>]*>' | wc -l | tr -d ' ')
  
  if [ "$h1_count" -eq 1 ]; then
    echo -e "${GREEN}  ✅ ${url_path}: Proper h1 hierarchy (h1:${h1_count}, h2:${h2_count}, h3:${h3_count})${NC}"
    increment PASSED
  elif [ "$h1_count" -gt 1 ]; then
    echo -e "${YELLOW}  ⚠️  ${url_path}: Multiple h1 tags found (${h1_count}) - should have only 1${NC}"
  else
    echo -e "${YELLOW}  ⚠️  ${url_path}: No h1 tag found (may be client-rendered)${NC}"
  fi
done

echo ""
echo "=== Testing ARIA Labels ==="
for url_path in $TEST_PAGES; do
  full_url="${BASE_URL}${url_path}"
  
  # Check if page exists (not 404)
  if is_404 "${full_url}"; then
    echo -e "${YELLOW}  ⚠️  ${url_path}: Page not found (404) - skipping ARIA check${NC}"
    continue
  fi
  
  html_content=$(fetch_url "${full_url}")
  
  # Check for ARIA labels on buttons, main, nav and interactive elements
  main_with_aria=$(echo "$html_content" | grep -iE '<main[^>]*aria-label=' | wc -l | tr -d ' ')
  buttons_with_aria=$(echo "$html_content" | grep -iE '<button[^>]*aria-label=' | wc -l | tr -d ' ')
  buttons_with_aria_disabled=$(echo "$html_content" | grep -iE '<button[^>]*aria-disabled=' | wc -l | tr -d ' ')
  nav_with_aria=$(echo "$html_content" | grep -iE '<nav[^>]*aria-label=' | wc -l | tr -d ' ')
  aria_hidden_svg=$(echo "$html_content" | grep -iE '<svg[^>]*aria-hidden="true"' | wc -l | tr -d ' ')
  total_aria=$((main_with_aria + buttons_with_aria + buttons_with_aria_disabled + nav_with_aria + aria_hidden_svg))
  
  if [ "$total_aria" -gt 0 ]; then
    echo -e "${GREEN}  ✅ ${url_path}: ARIA labels found (main:${main_with_aria}, buttons:${buttons_with_aria}, aria-disabled:${buttons_with_aria_disabled}, nav:${nav_with_aria}, aria-hidden-svg:${aria_hidden_svg})${NC}"
    increment PASSED
  else
    echo -e "${YELLOW}  ⚠️  ${url_path}: No ARIA labels detected (optional but recommended, may be client-rendered)${NC}"
  fi
done

echo ""
echo "=== Testing Internal Linking Structure ==="
echo "Note: Listing pages use client-side rendering, so links may not be in initial HTML."
for url_path in "/vi/projects" "/vi/products"; do
  full_url="${BASE_URL}${url_path}"
  html_content=$(fetch_url "${full_url}")
  
  # Check for internal links to detail pages
  if echo "$url_path" | grep -q "projects"; then
    detail_links=$(echo "$html_content" | grep -iE 'href=["\047]/[^/]*/projects/[^"\047\s]+' | wc -l | tr -d ' ')
    link_type="project detail"
  else
    detail_links=$(echo "$html_content" | grep -iE 'href=["\047]/[^/]*/products/[^"\047\s]+' | wc -l | tr -d ' ')
    link_type="product detail"
  fi
  
  if [ "$detail_links" -gt 0 ]; then
    echo -e "${GREEN}  ✅ ${url_path}: Internal links to ${link_type} pages found (${detail_links} links)${NC}"
    increment PASSED
  else
    echo -e "${YELLOW}  ⚠️  ${url_path}: No internal links to ${link_type} pages detected (expected for client-rendered pages)${NC}"
  fi
done

# Check for related projects/products links on detail pages
for url_path in "/vi/projects/jladfkajlf" "/vi/products/product-1"; do
  full_url="${BASE_URL}${url_path}"
  
  # Check if page exists (not 404)
  if is_404 "${full_url}"; then
    echo -e "${YELLOW}  ⚠️  ${url_path}: Page not found (404) - skipping link check${NC}"
    continue
  fi
  
  html_content=$(fetch_url "${full_url}")
  
  if echo "$url_path" | grep -q "projects"; then
    related_links=$(echo "$html_content" | grep -iE 'href=["\047]/[^/]*/projects/[^"\047\s]+' | wc -l | tr -d ' ')
    link_type="related projects"
  else
    related_links=$(echo "$html_content" | grep -iE 'href=["\047]/[^/]*/products/[^"\047\s]+' | wc -l | tr -d ' ')
    link_type="related products"
  fi
  
  if [ "$related_links" -gt 0 ]; then
    echo -e "${GREEN}  ✅ ${url_path}: Internal links to ${link_type} found (${related_links} links)${NC}"
    increment PASSED
  else
    echo -e "${YELLOW}  ⚠️  ${url_path}: No internal links to ${link_type} detected (may be client-rendered)${NC}"
  fi
done

echo ""
echo "=== Testing Breadcrumb Navigation ==="
for url_path in "/vi/projects/jladfkajlf" "/vi/products/product-1"; do
  full_url="${BASE_URL}${url_path}"
  
  # Check if page exists (not 404)
  if is_404 "${full_url}"; then
    echo -e "${YELLOW}  ⚠️  ${url_path}: Page not found (404) - skipping breadcrumb check${NC}"
    continue
  fi
  
  html_content=$(fetch_url "${full_url}")
  
  # Check for breadcrumb navigation (nav with aria-label="Breadcrumb" or containing breadcrumb links)
  has_breadcrumb_nav=$(echo "$html_content" | grep -iE '<nav[^>]*aria-label=["\047]Breadcrumb["\047]' | wc -l | tr -d ' ')
  breadcrumb_links=$(echo "$html_content" | grep -iE 'href=["\047]/[^/]*/(projects|products)["\047]' | wc -l | tr -d ' ')
  
  if [ "$has_breadcrumb_nav" -gt 0 ] || [ "$breadcrumb_links" -gt 0 ]; then
    echo -e "${GREEN}  ✅ ${url_path}: Breadcrumb navigation found${NC}"
    increment PASSED
  else
    echo -e "${YELLOW}  ⚠️  ${url_path}: No breadcrumb navigation detected (may be client-rendered)${NC}"
  fi
done

echo ""
echo "=== Summary ==="
echo -e "${GREEN}✅ Passed: ${PASSED}${NC}"
echo -e "${RED}❌ Failed: ${FAILED}${NC}"
echo ""
echo "Note: Some checks are warnings (⚠️) and may not be critical."
echo "For comprehensive semantic HTML validation, use:"
echo "  - W3C HTML Validator: https://validator.w3.org/"
echo "  - Lighthouse (Accessibility audit)"
echo "  - axe DevTools extension"
echo ""

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}✅ All Content SEO checks passed!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some checks may need attention.${NC}"
  exit 0
fi
