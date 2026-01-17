#!/bin/sh

# Test script to verify JSON-LD structured data on live URLs
# Usage: sh scripts/test-seo-structured-data.sh [BASE_URL]
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

BASE_URL="${1:-http://localhost:3000}"

echo "🔍 Testing Structured Data (JSON-LD) on ${BASE_URL}"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check JSON-LD
check_jsonld() {
  local url=$1
  local schema_type=$2
  local show_content=${3:-false}
  
  echo "📄 Testing: ${url}"
  
  # Fetch HTML
  html=$(fetch_url "${url}")
  
  if [ -z "$html" ]; then
    echo -e "${RED}  ❌ Failed to fetch page${NC}"
    return 1
  fi
  
  # Extract JSON-LD scripts
  jsonld_count=$(echo "$html" | grep -o '<script type="application/ld+json">' | wc -l | tr -d ' ')
  
  if [ "$jsonld_count" -eq 0 ]; then
    echo -e "${RED}  ❌ No JSON-LD found${NC}"
    return 1
  fi
  
  echo -e "${GREEN}  ✅ Found ${jsonld_count} JSON-LD script(s)${NC}"
  
  # Extract all JSON-LD content blocks
  jsonld_blocks=$(echo "$html" | sed -n '/<script type="application\/ld+json">/,/<\/script>/p' | sed 's/<script type="application\/ld+json">//' | sed 's/<\/script>//' | sed '/^$/d')
  
  if [ -z "$jsonld_blocks" ]; then
    echo -e "${RED}  ❌ JSON-LD content is empty${NC}"
    return 1
  fi
  
  # Check for @context
  if echo "$jsonld_blocks" | grep -q '"@context"'; then
    echo -e "${GREEN}  ✅ Contains @context${NC}"
  else
    echo -e "${RED}  ❌ Missing @context${NC}"
    return 1
  fi
  
  # Check for @type
  if echo "$jsonld_blocks" | grep -q '"@type"'; then
    echo -e "${GREEN}  ✅ Contains @type${NC}"
  else
    echo -e "${RED}  ❌ Missing @type${NC}"
    return 1
  fi
  
  # Check for specific schema type if provided
  if [ -n "$schema_type" ]; then
    if echo "$jsonld_blocks" | grep -q "\"@type\":\"${schema_type}\"" || echo "$jsonld_blocks" | grep -q "\"@type\": \"${schema_type}\""; then
      echo -e "${GREEN}  ✅ Contains ${schema_type} schema${NC}"
    else
      echo -e "${YELLOW}  ⚠️  ${schema_type} schema not found (may be in array)${NC}"
    fi
  fi
  
  # Show JSON-LD content if requested
  if [ "$show_content" = "true" ]; then
    echo ""
    echo -e "${YELLOW}  📋 JSON-LD Content:${NC}"
    
    # Extract each JSON-LD block separately
    jsonld_extracted=$(echo "$html" | sed -n '/<script type="application\/ld+json">/,/<\/script>/p' | sed 's/<script type="application\/ld+json">//' | sed 's/<\/script>//' | sed '/^$/d' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
    
    # Try to parse as JSON array or single object
    if command -v jq &> /dev/null; then
      # Try to format as JSON
      formatted=$(echo "$jsonld_extracted" | jq . 2>/dev/null)
      if [ $? -eq 0 ]; then
        echo "$formatted" | jq -C . 2>/dev/null || echo "$formatted"
      else
        # If not valid JSON, try to extract each block
        echo "$jsonld_extracted" | while IFS= read -r block; do
          if [ -n "$block" ]; then
            echo "$block" | jq -C . 2>/dev/null || echo "    $block"
          fi
        done
      fi
    else
      # Fallback: just show the content
      echo "$jsonld_extracted" | head -20
    fi
    echo ""
  fi
  
  return 0
}

# Test Organization and WebSite schemas (on all pages via layout)
echo "=== Testing Organization & WebSite Schemas ==="
check_jsonld "${BASE_URL}/vi" "Organization" "true"
check_jsonld "${BASE_URL}/en" "WebSite" "true"
echo ""

# Test CollectionPage and BreadcrumbList on listing pages
echo "=== Testing CollectionPage & BreadcrumbList on Listing Pages ==="
check_jsonld "${BASE_URL}/vi/projects" "CollectionPage" "true"
check_jsonld "${BASE_URL}/vi/products" "CollectionPage" "true"
echo ""

# Test Article, CreativeWork, and BreadcrumbList on detail pages
echo "=== Testing Article, CreativeWork & BreadcrumbList on Detail Pages ==="
# Get first project slug (if available)
first_project=$(fetch_url "${BASE_URL}/api/projects?page=1&pageSize=1" | grep -o '"slug":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$first_project" ]; then
  check_jsonld "${BASE_URL}/vi/projects/${first_project}" "Article" "true"
fi

# Get first product slug (if available)
first_product=$(fetch_url "${BASE_URL}/api/products?page=1&pageSize=1" | grep -o '"slug":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$first_product" ]; then
  check_jsonld "${BASE_URL}/vi/products/${first_product}" "Product" "true"
fi
echo ""

echo "✅ Structured data testing completed!"
echo ""
echo "💡 Tip: Use Google's Rich Results Test to validate:"
echo "   https://search.google.com/test/rich-results"
