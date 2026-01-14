#!/bin/bash

echo "Testing olystudio.vn with Microsoft Edge user agents..."
echo ""

# Microsoft Edge on Windows
echo "1. Testing Edge on Windows:"
curl -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0" https://olystudio.vn/
echo ""

# Microsoft Edge on macOS
echo "2. Testing Edge on macOS:"
curl -I -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0" https://olystudio.vn/
echo ""

# Microsoft Edge on Android
echo "3. Testing Edge on Android:"
curl -I -A "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 EdgA/120.0.0.0" https://olystudio.vn/
echo ""

# Microsoft Edge on iOS
echo "4. Testing Edge on iOS:"
curl -I -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/120.0.0.0 Mobile/15E148 Safari/604.1" https://olystudio.vn/
echo ""

# Test /vi path
echo "5. Testing /vi path with Edge:"
curl -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0" https://olystudio.vn/vi
echo ""

# Test /en path
echo "6. Testing /en path with Edge:"
curl -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0" https://olystudio.vn/en
echo ""

# Test non-existent path
echo "7. Testing non-existent path with Edge:"
curl -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0" https://olystudio.vn/nonexistent
echo ""

echo "Test completed!"
