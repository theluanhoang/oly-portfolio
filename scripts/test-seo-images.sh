#!/bin/sh

# Test script to verify Image SEO
# Usage: sh scripts/test-seo-images.sh [BASE_URL]
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

# Detect if running in Docker container and determine correct URL
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

echo "🖼️  Testing Image SEO on ${BASE_URL}"
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

echo "=== Testing Image Alt Text ==="
for url_path in "/vi" "/en" "/vi/projects" "/en/projects" "/vi/products" "/en/products"; do
  full_url="${BASE_URL}${url_path}"
  html_content=$(fetch_url "${full_url}")
  
  # Count images with alt text
  # Check for both <img> and Next.js Image components (which render as <img>)
  total_images=$(echo "$html_content" | grep -iE '<img[^>]*>' | wc -l | tr -d ' ')
  images_with_alt=$(echo "$html_content" | grep -iE '<img[^>]*alt="[^"]*"' | wc -l | tr -d ' ')
  images_with_empty_alt=$(echo "$html_content" | grep -iE '<img[^>]*alt=""' | wc -l | tr -d ' ')
  images_without_alt=$(echo "$html_content" | grep -iE '<img[^>]*>' | grep -iv 'alt=' | wc -l | tr -d ' ')
  
  if [ "$total_images" -gt 0 ]; then
    # Images should have alt text (empty alt is acceptable for decorative images)
    if [ "$images_without_alt" -eq 0 ]; then
      echo -e "${GREEN}  ✅ ${url_path}: All ${total_images} image(s) have alt attribute${NC}"
      increment PASSED
    else
      echo -e "${RED}  ❌ ${url_path}: ${images_without_alt} image(s) missing alt attribute${NC}"
      increment FAILED
    fi
  else
    echo -e "${YELLOW}  ⚠️  ${url_path}: No images found${NC}"
  fi
done

echo ""
echo "=== Testing Image Dimensions in Metadata ==="
for url_path in "/vi/projects/jladfkajlf" "/en/projects/jladfkajlf"; do
  full_url="${BASE_URL}${url_path}"
  html_content=$(fetch_url "${full_url}")
  
  # Check for og:image:width and og:image:height
  has_width=$(echo "$html_content" | grep -iE 'property="og:image:width"|property="og:image:height"' | wc -l | tr -d ' ')
  
  if [ "$has_width" -gt 0 ]; then
    echo -e "${GREEN}  ✅ ${url_path}: Image dimensions found in Open Graph metadata${NC}"
    increment PASSED
  else
    echo -e "${YELLOW}  ⚠️  ${url_path}: Image dimensions not found in Open Graph metadata${NC}"
    # Not a failure, as dimensions might be in default OG image
  fi
done

echo ""
echo "=== Testing ImageObject Structured Data ==="
for url_path in "/vi/projects/jladfkajlf" "/en/projects/jladfkajlf"; do
  full_url="${BASE_URL}${url_path}"
  html_content=$(fetch_url "${full_url}")
  
  # Extract JSON-LD
  json_ld=$(echo "$html_content" | grep -oE '<script[^>]*type="application/ld\+json"[^>]*>.*?</script>' | sed 's/<script[^>]*>//g' | sed 's/<\/script>//g' | head -1)
  
  if [ -n "$json_ld" ]; then
    # Check for ImageObject schema
    has_image_object=$(echo "$json_ld" | grep -iE '"@type"\s*:\s*"ImageObject"' | wc -l | tr -d ' ')
    
    if [ "$has_image_object" -gt 0 ]; then
      echo -e "${GREEN}  ✅ ${url_path}: ImageObject schema found${NC}"
      increment PASSED
    else
      echo -e "${YELLOW}  ⚠️  ${url_path}: ImageObject schema not found (optional)${NC}"
    fi
  else
    echo -e "${YELLOW}  ⚠️  ${url_path}: No JSON-LD found${NC}"
  fi
done

echo ""
echo "=== Testing Image Lazy Loading ==="
for url_path in "/vi/projects/jladfkajlf" "/en/projects/jladfkajlf"; do
  full_url="${BASE_URL}${url_path}"
  html_content=$(fetch_url "${full_url}")
  
  # Check for loading="lazy" attribute (except for hero/above-fold images)
  # Hero images should have loading="eager" or no loading attribute
  total_images=$(echo "$html_content" | grep -iE '<img[^>]*>' | wc -l | tr -d ' ')
  lazy_images=$(echo "$html_content" | grep -iE 'loading="lazy"' | wc -l | tr -d ' ')
  eager_images=$(echo "$html_content" | grep -iE 'loading="eager"' | wc -l | tr -d ' ')
  
  if [ "$total_images" -gt 0 ]; then
    # At least some images should have lazy loading (gallery images)
    if [ "$lazy_images" -gt 0 ] || [ "$eager_images" -gt 0 ]; then
      echo -e "${GREEN}  ✅ ${url_path}: Images have loading attributes (${lazy_images} lazy, ${eager_images} eager)${NC}"
      increment PASSED
    else
      echo -e "${YELLOW}  ⚠️  ${url_path}: No loading attributes found (may use Intersection Observer)${NC}"
    fi
  fi
done

echo ""
echo "=== Summary ==="
echo -e "${GREEN}✅ Passed: ${PASSED}${NC}"
echo -e "${RED}❌ Failed: ${FAILED}${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}✅ All Image SEO tests passed!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
  exit 1
fi
