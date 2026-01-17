#!/bin/sh

# Test script to verify robots.txt and sitemap.xml
# Usage: sh scripts/test-sitemap-robots.sh [BASE_URL]
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

# Check if URL is reachable
check_url_reachable() {
  if [ "$HTTP_CLIENT" = "curl" ]; then
    $CURL_CMD --max-time "$2" "$1" > /dev/null 2>&1
  else
    wget --spider --timeout="$2" --tries=1 "$1" > /dev/null 2>&1
  fi
}

BASE_URL="${1:-http://localhost:3000}"

echo "🔍 Testing Technical SEO (robots.txt & sitemap.xml) on ${BASE_URL}"
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
    echo "   Example: http://localhost:3000"
    exit 1
    ;;
esac

# Test if server is reachable
if ! check_url_reachable "${BASE_URL}" 5; then
  echo -e "${RED}❌ Cannot reach server at ${BASE_URL}${NC}"
  echo "   Please make sure the server is running."
  echo "   For local development: npm run dev"
  exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test robots.txt
echo "=== Testing robots.txt ==="
robots_content=$(fetch_url "${BASE_URL}/robots.txt")

if [ -z "$robots_content" ]; then
  echo -e "${RED}  ❌ robots.txt not found or empty${NC}"
  echo -e "${YELLOW}  💡 Tip: Make sure the server is running and URL is correct${NC}"
  echo -e "${YELLOW}  💡 For Next.js, robots.txt should be at /robots.txt${NC}"
else
  echo -e "${GREEN}  ✅ robots.txt found${NC}"
  echo ""
  echo "📋 Content:"
  echo "$robots_content" | sed 's/^/  /'
  echo ""
  
  # Check for sitemap reference
  if echo "$robots_content" | grep -qi "sitemap"; then
    echo -e "${GREEN}  ✅ Contains sitemap reference${NC}"
  else
    echo -e "${YELLOW}  ⚠️  No sitemap reference found${NC}"
  fi
  
  # Check for disallow rules
  if echo "$robots_content" | grep -qi "disallow"; then
    echo -e "${GREEN}  ✅ Contains disallow rules${NC}"
  else
    echo -e "${YELLOW}  ⚠️  No disallow rules found${NC}"
  fi
fi
echo ""

# Test sitemap.xml
echo "=== Testing sitemap.xml ==="
sitemap_content=$(fetch_url "${BASE_URL}/sitemap.xml")

if [ -z "$sitemap_content" ]; then
  echo -e "${RED}  ❌ sitemap.xml not found or empty${NC}"
  echo -e "${YELLOW}  💡 Tip: Make sure the server is running and URL is correct${NC}"
  echo -e "${YELLOW}  💡 For Next.js, sitemap.xml should be at /sitemap.xml${NC}"
else
  echo -e "${GREEN}  ✅ sitemap.xml found${NC}"
  
  # Count URLs
  url_count=$(echo "$sitemap_content" | grep -o '<url>' | wc -l | tr -d ' ')
  echo -e "${GREEN}  ✅ Contains ${url_count} URL(s)${NC}"
  
  # Check for required elements
  if echo "$sitemap_content" | grep -q '<loc>'; then
    echo -e "${GREEN}  ✅ Contains <loc> tags${NC}"
  else
    echo -e "${RED}  ❌ Missing <loc> tags${NC}"
  fi
  
  if echo "$sitemap_content" | grep -q '<lastmod>'; then
    echo -e "${GREEN}  ✅ Contains <lastmod> dates${NC}"
  else
    echo -e "${YELLOW}  ⚠️  No <lastmod> dates found${NC}"
  fi
  
  if echo "$sitemap_content" | grep -q '<priority>'; then
    echo -e "${GREEN}  ✅ Contains <priority> settings${NC}"
  else
    echo -e "${YELLOW}  ⚠️  No <priority> settings found${NC}"
  fi
  
  if echo "$sitemap_content" | grep -q '<changefreq>'; then
    echo -e "${GREEN}  ✅ Contains <changefreq> settings${NC}"
  else
    echo -e "${YELLOW}  ⚠️  No <changefreq> settings found${NC}"
  fi
  
  # Check for locales
  if echo "$sitemap_content" | grep -q '/vi/' || echo "$sitemap_content" | grep -q '/en/'; then
    echo -e "${GREEN}  ✅ Contains locale-specific URLs${NC}"
  else
    echo -e "${YELLOW}  ⚠️  No locale-specific URLs found${NC}"
  fi
  
  # Check for projects
  if echo "$sitemap_content" | grep -q '/projects/'; then
    project_count=$(echo "$sitemap_content" | grep -o '/projects/' | wc -l | tr -d ' ')
    echo -e "${GREEN}  ✅ Contains ${project_count} project URL(s)${NC}"
  else
    echo -e "${YELLOW}  ⚠️  No project URLs found${NC}"
  fi
  
  # Check for products (excluding /products listing page)
  product_detail_urls=$(echo "$sitemap_content" | grep -o '/products/[^<]*</loc>' | grep -v '/products</loc>' | wc -l | tr -d ' ')
  if [ "$product_detail_urls" -gt 0 ]; then
    echo -e "${GREEN}  ✅ Contains ${product_detail_urls} product detail URL(s)${NC}"
  else
    echo -e "${YELLOW}  ⚠️  No product detail URLs found (có thể do database chưa có products)${NC}"
  fi
  
  echo ""
  echo "📋 Sample URLs (first 10):"
  echo "$sitemap_content" | grep -o '<loc>[^<]*</loc>' | head -10 | sed 's/<loc>//' | sed 's/<\/loc>//' | sed 's/^/  - /'
fi
echo ""

echo "✅ Technical SEO testing completed!"
echo ""
echo "💡 Tips:"
echo "   - Submit sitemap to Google Search Console: https://search.google.com/search-console"
echo "   - Validate sitemap: https://www.xml-sitemaps.com/validate-xml-sitemap.html"
