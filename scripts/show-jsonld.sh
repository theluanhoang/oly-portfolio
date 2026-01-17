#!/bin/bash

# Script to extract and display JSON-LD structured data from a URL
# Usage: bash scripts/show-jsonld.sh [URL]
# Default: http://localhost:3000/vi

URL="${1:-http://localhost:3000/vi}"

echo "🔍 Extracting JSON-LD from: ${URL}"
echo ""

# Fetch HTML
html=$(curl -sL "${URL}" 2>/dev/null)

if [ -z "$html" ]; then
  echo "❌ Failed to fetch page"
  exit 1
fi

# Extract JSON-LD content (handle both single object and array)
jsonld=$(echo "$html" | grep -o '<script type="application/ld+json">[^<]*</script>' | sed 's/<script type="application\/ld+json">//' | sed 's/<\/script>//')

if [ -z "$jsonld" ]; then
  echo "❌ No JSON-LD found"
  exit 1
fi

# Format and display JSON
if command -v jq &> /dev/null; then
  echo "📋 JSON-LD Structured Data:"
  echo ""
  echo "$jsonld" | jq .
else
  echo "📋 JSON-LD Structured Data (raw):"
  echo ""
  echo "$jsonld"
  echo ""
  echo "💡 Tip: Install 'jq' for better formatting: brew install jq"
fi
