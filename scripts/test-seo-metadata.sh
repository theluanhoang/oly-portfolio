#!/bin/sh

# Script to test SEO metadata on all pages using curl or wget
# Usage: ./scripts/test-seo-metadata.sh [base_url]
# Default: http://localhost:3000

# Detect available HTTP client
if command -v curl > /dev/null 2>&1; then
  HTTP_CLIENT="curl"
  CURL_CMD="curl -s"
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
LOCALES="vi en"

echo "🔍 Testing SEO Metadata on ${BASE_URL}"
echo "=========================================="
echo ""

# Function to check metadata in HTML
check_metadata() {
    local url=$1
    local html=$(fetch_url "${url}")
    
    echo "📄 Testing: ${url}"
    
    # Check title - handle both <title>content</title> and minified HTML
    if echo "$html" | grep -q '<title'; then
        # Try to extract title - handle minified HTML where title might be on same line
        title=$(echo "$html" | sed -n 's/.*<title[^>]*>\([^<]*\)<\/title>.*/\1/p' | head -1 | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        if [ -n "$title" ]; then
            echo "  ✅ Title: ${title:0:80}..."
        else
            echo "  ⚠️  Title: Found but could not parse"
        fi
    else
        echo "  ❌ Title: MISSING"
    fi
    
    # Check meta description
    if echo "$html" | grep -qi 'name="description"'; then
        desc=$(echo "$html" | grep -i 'name="description"' | sed -n 's/.*name="description"[^>]*content="\([^"]*\)".*/\1/p' | head -1)
        if [ -n "$desc" ]; then
            echo "  ✅ Description: ${desc:0:80}..."
        else
            echo "  ⚠️  Description: Found but could not parse"
        fi
    else
        echo "  ❌ Description: MISSING"
    fi
    
    # Check canonical
    if echo "$html" | grep -qi 'rel="canonical"'; then
        # Extract canonical URL - handle minified HTML
        canonical=$(echo "$html" | grep -i 'rel="canonical"' | sed -n 's/.*rel="canonical"[^>]*href="\([^"]*\)".*/\1/p' | head -1)
        if [ -n "$canonical" ]; then
            echo "  ✅ Canonical: ${canonical}"
        else
            echo "  ⚠️  Canonical: Found but could not parse"
        fi
    else
        echo "  ❌ Canonical: MISSING"
    fi
    
    # Check Open Graph
    if echo "$html" | grep -qi 'property="og:title"'; then
        og_title=$(echo "$html" | grep -i 'property="og:title"' | sed -n 's/.*property="og:title"[^>]*content="\([^"]*\)".*/\1/p' | head -1)
        if [ -n "$og_title" ]; then
            echo "  ✅ OG Title: ${og_title:0:80}..."
        else
            echo "  ⚠️  OG Title: Found but could not parse"
        fi
    else
        echo "  ❌ OG Title: MISSING"
    fi
    
    if echo "$html" | grep -qi 'property="og:description"'; then
        og_desc=$(echo "$html" | grep -i 'property="og:description"' | sed -n 's/.*property="og:description"[^>]*content="\([^"]*\)".*/\1/p' | head -1)
        if [ -n "$og_desc" ]; then
            echo "  ✅ OG Description: ${og_desc:0:80}..."
        else
            echo "  ⚠️  OG Description: Found but could not parse"
        fi
    else
        echo "  ❌ OG Description: MISSING"
    fi
    
    if echo "$html" | grep -qi 'property="og:image"'; then
        og_image=$(echo "$html" | grep -i 'property="og:image"' | sed -n 's/.*property="og:image"[^>]*content="\([^"]*\)".*/\1/p' | head -1)
        if [ -n "$og_image" ]; then
            echo "  ✅ OG Image: ${og_image}"
        else
            echo "  ⚠️  OG Image: Found but could not parse"
        fi
    else
        echo "  ❌ OG Image: MISSING"
    fi
    
    if echo "$html" | grep -qi 'property="og:url"'; then
        og_url=$(echo "$html" | grep -i 'property="og:url"' | sed -n 's/.*property="og:url"[^>]*content="\([^"]*\)".*/\1/p' | head -1)
        if [ -n "$og_url" ]; then
            echo "  ✅ OG URL: ${og_url}"
        else
            echo "  ⚠️  OG URL: Found but could not parse"
        fi
    else
        echo "  ❌ OG URL: MISSING"
    fi
    
    # Check hreflang
    if echo "$html" | grep -qi 'rel="alternate".*hreflang'; then
        hreflang_count=$(echo "$html" | grep -oi 'rel="alternate".*hreflang' | wc -l)
        echo "  ✅ Hreflang: Found ${hreflang_count} alternate(s)"
    else
        echo "  ⚠️  Hreflang: Not found (may be optional)"
    fi
    
    echo ""
}

# Test Home pages
echo "🏠 Testing Home Pages"
echo "-------------------"
for locale in $LOCALES; do
    if [ "$locale" = "vi" ]; then
        # Default locale - test /vi (without trailing slash, as /vi/ redirects to /vi)
        check_metadata "${BASE_URL}/vi"
    else
        check_metadata "${BASE_URL}/${locale}"
    fi
done

# Test Projects listing
echo "📁 Testing Projects Listing"
echo "-------------------------"
for locale in $LOCALES; do
    if [ "$locale" = "vi" ]; then
        # Default locale - check /vi/projects (next-intl redirects /projects to /vi/projects)
        check_metadata "${BASE_URL}/vi/projects"
    else
        check_metadata "${BASE_URL}/${locale}/projects"
    fi
done

# Test Products listing
echo "🛍️  Testing Products Listing"
echo "-------------------------"
for locale in $LOCALES; do
    if [ "$locale" = "vi" ]; then
        check_metadata "${BASE_URL}/vi/products"
    else
        check_metadata "${BASE_URL}/${locale}/products"
    fi
done

# Test About page
echo "ℹ️  Testing About Page"
echo "-------------------"
for locale in $LOCALES; do
    if [ "$locale" = "vi" ]; then
        check_metadata "${BASE_URL}/vi/about"
    else
        check_metadata "${BASE_URL}/${locale}/about"
    fi
done

# Test Contact page
echo "📧 Testing Contact Page"
echo "-------------------"
for locale in $LOCALES; do
    if [ "$locale" = "vi" ]; then
        check_metadata "${BASE_URL}/vi/contact"
    else
        check_metadata "${BASE_URL}/${locale}/contact"
    fi
done

# Try to get a project slug from API and test
echo "🏗️  Testing Project Detail (if available)"
echo "----------------------------------------"
PROJECT_SLUG=$(fetch_url "${BASE_URL}/api/projects?pageSize=1" | grep -o '"slug"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -n 's/.*"slug"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
if [ -n "$PROJECT_SLUG" ]; then
    for locale in $LOCALES; do
        if [ "$locale" = "vi" ]; then
            check_metadata "${BASE_URL}/vi/projects/${PROJECT_SLUG}"
        else
            check_metadata "${BASE_URL}/${locale}/projects/${PROJECT_SLUG}"
        fi
    done
else
    echo "  ⚠️  No projects found to test"
    echo ""
fi

# Try to get a product slug from API and test
echo "📦 Testing Product Detail (if available)"
echo "----------------------------------------"
PRODUCT_SLUG=$(fetch_url "${BASE_URL}/api/products?pageSize=1" | grep -o '"slug"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -n 's/.*"slug"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
if [ -n "$PRODUCT_SLUG" ]; then
    for locale in $LOCALES; do
        if [ "$locale" = "vi" ]; then
            check_metadata "${BASE_URL}/vi/products/${PRODUCT_SLUG}"
        else
            check_metadata "${BASE_URL}/${locale}/products/${PRODUCT_SLUG}"
        fi
    done
else
    echo "  ⚠️  No products found to test"
    echo ""
fi

echo "✅ Metadata check complete!"
echo ""
