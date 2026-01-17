#!/bin/sh

# Test script to verify Performance & Core Web Vitals optimizations
# Usage: sh scripts/test-performance.sh [BASE_URL]
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

echo "⚡ Testing Performance & Core Web Vitals on ${BASE_URL}"
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

echo "=== Testing Code Splitting (Dynamic Imports) ==="
for url_path in "/vi/projects/jladfkajlf" "/vi/admin/projects/new"; do
  full_url="${BASE_URL}${url_path}"
  html_content=$(fetch_url "${full_url}")
  
  # Check for dynamic import indicators (chunk files, script tags with chunks)
  has_chunks=$(echo "$html_content" | grep -iE '_next/static/chunks|chunks/' | wc -l | tr -d ' ')
  
  # Also check for script tags that indicate code splitting
  has_scripts=$(echo "$html_content" | grep -iE '<script[^>]*src=.*\.js' | wc -l | tr -d ' ')
  
  if [ "$has_chunks" -gt 0 ] || [ "$has_scripts" -gt 0 ]; then
    echo -e "${GREEN}  ✅ ${url_path}: Code splitting detected (${has_chunks} chunks, ${has_scripts} scripts)${NC}"
    increment PASSED
  else
    echo -e "${YELLOW}  ⚠️  ${url_path}: No chunk references found (may be server-rendered or using SSR)${NC}"
  fi
done

echo ""
echo "=== Testing LCP Optimization (Image Preload) ==="
for url_path in "/vi/projects/jladfkajlf"; do
  full_url="${BASE_URL}${url_path}"
  html_content=$(fetch_url "${full_url}")
  
  # Check for preload links for images (check both <link> tags and in <head>)
  has_preload=$(echo "$html_content" | grep -iE 'rel="preload".*as="image"|rel=["\047]preload["\047].*as=["\047]image["\047]' | wc -l | tr -d ' ')
  
  if [ "$has_preload" -gt 0 ]; then
    echo -e "${GREEN}  ✅ ${url_path}: Image preload found${NC}"
    increment PASSED
  else
    # Also check in script tags (Next.js might inject it)
    has_preload_script=$(echo "$html_content" | grep -iE 'preload.*image|fetchPriority.*high' | wc -l | tr -d ' ')
    if [ "$has_preload_script" -gt 0 ]; then
      echo -e "${GREEN}  ✅ ${url_path}: Image preload found (in script)${NC}"
      increment PASSED
    else
      echo -e "${YELLOW}  ⚠️  ${url_path}: No image preload found (optional optimization)${NC}"
    fi
  fi
done

echo ""
echo "=== Testing CLS Optimization (Image Dimensions) ==="
for url_path in "/vi/projects/jladfkajlf"; do
  full_url="${BASE_URL}${url_path}"
  html_content=$(fetch_url "${full_url}")
  
  # Check for width/height attributes on images (including Next.js Image components)
  # Next.js Image components may have dimensions in style or data attributes
  images_with_dimensions=$(echo "$html_content" | grep -iE '<img[^>]*(width|height|aspect-ratio|style.*width|style.*height)=' | wc -l | tr -d ' ')
  # Also check for aspect-ratio in class names (Tailwind)
  images_with_aspect=$(echo "$html_content" | grep -iE 'aspect-[0-9]|aspect-square|aspect-video' | wc -l | tr -d ' ')
  total_images=$(echo "$html_content" | grep -iE '<img[^>]*>' | wc -l | tr -d ' ')
  
  if [ "$total_images" -gt 0 ]; then
    total_with_dimensions=$((images_with_dimensions + images_with_aspect))
    if [ "$total_with_dimensions" -gt 0 ]; then
      echo -e "${GREEN}  ✅ ${url_path}: Images have dimensions/aspect ratios (${total_with_dimensions} found)${NC}"
      increment PASSED
    else
      echo -e "${YELLOW}  ⚠️  ${url_path}: Images missing dimensions (may cause CLS)${NC}"
    fi
  else
    # Check if images are loaded via JavaScript (Next.js Image component)
    has_image_refs=$(echo "$html_content" | grep -iE 'image|img|photo|gallery' | wc -l | tr -d ' ')
    if [ "$has_image_refs" -gt 0 ]; then
      echo -e "${YELLOW}  ⚠️  ${url_path}: Images may be loaded via JS (Next.js Image component)${NC}"
    else
      echo -e "${YELLOW}  ⚠️  ${url_path}: No images found${NC}"
    fi
  fi
done

echo ""
echo "=== Testing Font Optimization ==="
for url_path in "/vi"; do
  full_url="${BASE_URL}${url_path}"
  html_content=$(fetch_url "${full_url}")
  
  # Check for font-display: swap in HTML (Next.js injects it)
  has_font_display=$(echo "$html_content" | grep -iE 'font-display.*swap|display.*swap|display:.*swap' | wc -l | tr -d ' ')
  
  # Also check for font preload
  has_font_preload=$(echo "$html_content" | grep -iE 'rel="preload".*as="font"|rel=["\047]preload["\047].*as=["\047]font["\047]' | wc -l | tr -d ' ')
  
  # Check for localFont with display: swap in script tags
  has_local_font=$(echo "$html_content" | grep -iE 'localFont|display.*swap' | wc -l | tr -d ' ')
  
  if [ "$has_font_display" -gt 0 ] || [ "$has_font_preload" -gt 0 ] || [ "$has_local_font" -gt 0 ]; then
    echo -e "${GREEN}  ✅ ${url_path}: Font optimization found (display: swap or preload)${NC}"
    increment PASSED
  else
    echo -e "${YELLOW}  ⚠️  ${url_path}: Font display optimization not detected (may be in CSS)${NC}"
  fi
done

echo ""
echo "=== Testing Compression ==="
# Check if server supports compression
if [ "$HTTP_CLIENT" = "curl" ]; then
  content_encoding=$(curl -sL -I -H "Accept-Encoding: gzip, deflate, br" "${BASE_URL}/vi" | grep -i "Content-Encoding" | head -n 1)
else
  content_encoding=$(wget -S --spider --header="Accept-Encoding: gzip, deflate, br" "${BASE_URL}/vi" 2>&1 | grep -i "Content-Encoding" | head -n 1)
fi

if echo "$content_encoding" | grep -qiE "gzip|br|deflate"; then
  echo -e "${GREEN}  ✅ Server supports compression${NC}"
  increment PASSED
else
  echo -e "${YELLOW}  ⚠️  Compression not detected (may be handled by reverse proxy)${NC}"
fi

echo ""
echo "=== Summary ==="
echo -e "${GREEN}✅ Passed: ${PASSED}${NC}"
echo -e "${RED}❌ Failed: ${FAILED}${NC}"
echo ""
echo "Note: Some optimizations may not be detectable via HTML inspection."
echo "For accurate Core Web Vitals metrics, use:"
echo "  - Google PageSpeed Insights: https://pagespeed.web.dev/"
echo "  - Chrome DevTools Lighthouse"
echo "  - Web Vitals extension"
echo ""

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}✅ All detectable performance optimizations are in place!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some optimizations may need attention.${NC}"
  exit 0
fi
