#!/bin/bash

# Quick DDoS Test Script - Sử dụng curl và parallel requests
# Test nhanh rate limiting với các endpoints quan trọng

BASE_URL="${BASE_URL:-http://localhost:3000}"
CONCURRENT="${CONCURRENT:-50}"
TOTAL="${TOTAL:-200}"

echo "🚀 Quick DDoS Test"
echo "Base URL: $BASE_URL"
echo "Concurrent: $CONCURRENT"
echo "Total requests: $TOTAL"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local endpoint=$1
    local method=$2
    local url="${BASE_URL}${endpoint}"
    
    echo -e "${BLUE}Testing: ${method} ${endpoint}${NC}"
    
    local success=0
    local rate_limited=0
    local errors=0
    
    for i in $(seq 1 $TOTAL); do
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "\n%{http_code}" -X GET "$url" \
                -H "X-Forwarded-For: 192.168.$((RANDOM % 255)).$((RANDOM % 255))" \
                -H "User-Agent: DDoS-Test-$i" \
                --max-time 5)
        else
            response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
                -H "Content-Type: application/json" \
                -H "X-Forwarded-For: 192.168.$((RANDOM % 255)).$((RANDOM % 255))" \
                -H "User-Agent: DDoS-Test-$i" \
                -d '{"test":"data"}' \
                --max-time 5)
        fi
        
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
            ((success++))
        elif [ "$http_code" = "429" ]; then
            ((rate_limited++))
        else
            ((errors++))
        fi
        
        # Progress indicator
        if [ $((i % 20)) -eq 0 ]; then
            echo -e "  Progress: $i/$TOTAL (Success: $success, Rate Limited: $rate_limited, Errors: $errors)"
        fi
    done
    
    local total=$((success + rate_limited + errors))
    local success_pct=$((success * 100 / total))
    local rate_limit_pct=$((rate_limited * 100 / total))
    local error_pct=$((errors * 100 / total))
    
    echo -e "${GREEN}Results:${NC}"
    echo -e "  Success: $success ($success_pct%)"
    echo -e "  Rate Limited: $rate_limited ($rate_limit_pct%)"
    echo -e "  Errors: $errors ($error_pct%)"
    
    if [ $rate_limited -gt $((total / 2)) ]; then
        echo -e "${GREEN}✅ Rate limiting is working!${NC}"
    elif [ $rate_limited -gt $((total / 5)) ]; then
        echo -e "${YELLOW}⚠️  Rate limiting is partially working${NC}"
    else
        echo -e "${RED}❌ Rate limiting may not be working properly${NC}"
    fi
    echo ""
}

# Test các endpoints quan trọng
echo -e "${YELLOW}=== PHASE 1: Testing Public GET Endpoints ===${NC}"
test_endpoint "/api/health" "GET"
test_endpoint "/api/products" "GET"
test_endpoint "/api/projects" "GET"

echo -e "${YELLOW}=== PHASE 2: Testing Auth Endpoints ===${NC}"
test_endpoint "/api/auth/[...nextauth]" "POST"
test_endpoint "/api/auth/forgot-password" "POST"

echo -e "${YELLOW}=== PHASE 3: Testing Contact Endpoint ===${NC}"
test_endpoint "/api/contact" "POST"

echo -e "${GREEN}✅ Quick DDoS Test completed!${NC}"

