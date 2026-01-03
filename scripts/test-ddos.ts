#!/usr/bin/env tsx
/**
 * DDoS Test Script - Test rate limiting cho tất cả API endpoints
 * 
 * Script này sẽ test mạnh tay các API endpoints để đảm bảo rate limiting hoạt động đúng
 * 
 * Usage:
 *   npm run test:ddos
 *   hoặc
 *   tsx scripts/test-ddos.ts
 */

import { performance } from 'perf_hooks';

// Cấu hình
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CONCURRENT_REQUESTS = parseInt(process.env.CONCURRENT || '100'); // Số requests đồng thời
const TOTAL_REQUESTS = parseInt(process.env.TOTAL || '500'); // Tổng số requests
const BURST_SIZE = parseInt(process.env.BURST || '50'); // Số requests trong burst
const BURST_DELAY = parseInt(process.env.BURST_DELAY || '100'); // Delay giữa các burst (ms)

// Danh sách các API endpoints cần test
const API_ENDPOINTS = [
  // Public GET endpoints
  { path: '/api/health', method: 'GET', requiresAuth: false },
  { path: '/api/products', method: 'GET', requiresAuth: false },
  { path: '/api/projects', method: 'GET', requiresAuth: false },
  { path: '/api/products/test-slug', method: 'GET', requiresAuth: false },
  { path: '/api/projects/test-slug', method: 'GET', requiresAuth: false },
  
  // Auth endpoints (POST)
  { path: '/api/auth/[...nextauth]', method: 'POST', requiresAuth: false, isAuth: true },
  { path: '/api/auth/forgot-password', method: 'POST', requiresAuth: false, isAuth: true },
  { path: '/api/auth/reset-password', method: 'POST', requiresAuth: false, isAuth: true },
  
  // Contact endpoint
  { path: '/api/contact', method: 'POST', requiresAuth: false },
  
  // Admin endpoints (cần auth - sẽ fail nhưng vẫn test rate limit)
  { path: '/api/admin/change-password', method: 'POST', requiresAuth: true },
  { path: '/api/admin/translations', method: 'GET', requiresAuth: true },
  { path: '/api/admin/translations', method: 'POST', requiresAuth: true },
  { path: '/api/admin/translations/export', method: 'GET', requiresAuth: true },
  { path: '/api/admin/translations/import', method: 'POST', requiresAuth: true },
  { path: '/api/admin/translations/sync', method: 'POST', requiresAuth: true },
  
  // Products endpoints
  { path: '/api/products/save', method: 'POST', requiresAuth: true },
  
  // Projects endpoints
  { path: '/api/projects/save', method: 'POST', requiresAuth: true },
  { path: '/api/projects/reorder', method: 'POST', requiresAuth: true },
];

interface TestResult {
  endpoint: string;
  method: string;
  totalRequests: number;
  successCount: number;
  rateLimitedCount: number;
  errorCount: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  rateLimitHeaders: {
    limit?: string;
    remaining?: string;
    reset?: string;
  };
}

interface RequestResult {
  status: number;
  responseTime: number;
  rateLimited: boolean;
  headers: Record<string, string>;
  error?: string;
}

// Colors cho console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Tạo IP để test
// Để test rate limiting hiệu quả, sử dụng ít IPs hơn (hoặc cùng một IP)
// để tích lũy requests và trigger rate limit
let ipCounter = 0;
const TEST_IP_COUNT = parseInt(process.env.TEST_IP_COUNT || '5'); // Số IPs khác nhau để test

function getTestIP(): string {
  // Sử dụng một số IPs cố định để test rate limiting
  // Mỗi IP sẽ tích lũy requests và trigger rate limit
  const ipIndex = ipCounter % TEST_IP_COUNT;
  ipCounter++;
  return `192.168.1.${100 + ipIndex}`;
}

// Tạo request body cho POST requests
function getRequestBody(endpoint: string): string | undefined {
  if (endpoint.includes('contact')) {
    return JSON.stringify({
      customerName: 'Test User',
      email: 'test@example.com',
      phone: '0123456789',
      category: 'residential',
    });
  }
  
  if (endpoint.includes('auth') || endpoint.includes('login')) {
    return JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword123',
    });
  }
  
  if (endpoint.includes('forgot-password')) {
    return JSON.stringify({
      email: 'test@example.com',
    });
  }
  
  if (endpoint.includes('reset-password')) {
    return JSON.stringify({
      token: 'test-token',
      password: 'newpassword123',
    });
  }
  
  // Default body cho POST requests
  return JSON.stringify({});
}

// Thực hiện một request
async function makeRequest(
  endpoint: string,
  method: string,
  requestId: number
): Promise<RequestResult> {
  const startTime = performance.now();
  const url = `${BASE_URL}${endpoint}`;
  const testIP = getTestIP();
  
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': testIP,
        'X-Real-IP': testIP,
        'User-Agent': `DDoS-Test-${requestId}`,
      },
    };
    
    if (method !== 'GET' && method !== 'HEAD') {
      options.body = getRequestBody(endpoint);
    }
    
    const response = await fetch(url, options);
    const responseTime = performance.now() - startTime;
    
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    
    const rateLimited = response.status === 429;
    
    return {
      status: response.status,
      responseTime,
      rateLimited,
      headers,
    };
  } catch (error) {
    const responseTime = performance.now() - startTime;
    return {
      status: 0,
      responseTime,
      rateLimited: false,
      headers: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Test một endpoint với concurrent requests
async function testEndpoint(
  endpoint: string,
  method: string,
  totalRequests: number,
  concurrent: number
): Promise<TestResult> {
  const results: RequestResult[] = [];
  const batches = Math.ceil(totalRequests / concurrent);
  
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`Testing: ${method} ${endpoint}`, 'yellow');
  log(`Total requests: ${totalRequests}, Concurrent: ${concurrent}, Batches: ${batches}`, 'blue');
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrent, totalRequests - results.length);
    const batchPromises: Promise<RequestResult>[] = [];
    
    for (let i = 0; i < batchSize; i++) {
      const requestId = batch * concurrent + i;
      batchPromises.push(makeRequest(endpoint, method, requestId));
    }
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Log progress
    const rateLimited = batchResults.filter(r => r.rateLimited).length;
    const errors = batchResults.filter(r => r.status === 0).length;
    log(
      `Batch ${batch + 1}/${batches}: ${batchResults.length} requests, ` +
      `${rateLimited} rate limited, ${errors} errors`,
      rateLimited > 0 ? 'yellow' : 'reset'
    );
    
    // Delay giữa các batches để không quá aggressive
    if (batch < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Tính toán statistics
  const successCount = results.filter(r => r.status >= 200 && r.status < 300 && !r.rateLimited).length;
  const rateLimitedCount = results.filter(r => r.rateLimited).length;
  const errorCount = results.filter(r => r.status === 0 || (r.status >= 400 && r.status !== 429)).length;
  
  const responseTimes = results.map(r => r.responseTime).filter(t => t > 0);
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;
  const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
  
  // Lấy rate limit headers từ response đầu tiên có headers
  const rateLimitHeaders: TestResult['rateLimitHeaders'] = {};
  const firstResponseWithHeaders = results.find(r => Object.keys(r.headers).length > 0);
  if (firstResponseWithHeaders) {
    rateLimitHeaders.limit = firstResponseWithHeaders.headers['x-ratelimit-limit'];
    rateLimitHeaders.remaining = firstResponseWithHeaders.headers['x-ratelimit-remaining'];
    rateLimitHeaders.reset = firstResponseWithHeaders.headers['x-ratelimit-reset'];
  }
  
  return {
    endpoint,
    method,
    totalRequests: results.length,
    successCount,
    rateLimitedCount,
    errorCount,
    avgResponseTime,
    minResponseTime,
    maxResponseTime,
    rateLimitHeaders,
  };
}

// Test burst attack
async function testBurstAttack(
  endpoint: string,
  method: string,
  burstSize: number
): Promise<TestResult> {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`BURST ATTACK: ${method} ${endpoint}`, 'red');
  log(`Sending ${burstSize} requests simultaneously...`, 'yellow');
  
  const startTime = performance.now();
  const promises: Promise<RequestResult>[] = [];
  
  for (let i = 0; i < burstSize; i++) {
    promises.push(makeRequest(endpoint, method, i));
  }
  
  const results = await Promise.all(promises);
  const totalTime = performance.now() - startTime;
  
  const rateLimitedCount = results.filter(r => r.rateLimited).length;
  const successCount = results.filter(r => r.status >= 200 && r.status < 300 && !r.rateLimited).length;
  const errorCount = results.filter(r => r.status === 0 || (r.status >= 400 && r.status !== 429)).length;
  
  log(`Burst completed in ${totalTime.toFixed(2)}ms`, 'blue');
  log(`Results: ${successCount} success, ${rateLimitedCount} rate limited, ${errorCount} errors`, 
    rateLimitedCount > 0 ? 'green' : 'yellow');
  
  const responseTimes = results.map(r => r.responseTime).filter(t => t > 0);
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;
  
  return {
    endpoint,
    method,
    totalRequests: results.length,
    successCount,
    rateLimitedCount,
    errorCount,
    avgResponseTime,
    minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
    maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
    rateLimitHeaders: {},
  };
}

// In kết quả
function printResults(results: TestResult[]) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log('TEST RESULTS SUMMARY', 'magenta');
  log(`${'='.repeat(80)}`, 'cyan');
  
  let totalRequests = 0;
  let totalRateLimited = 0;
  let totalSuccess = 0;
  let totalErrors = 0;
  
  results.forEach((result, index) => {
    totalRequests += result.totalRequests;
    totalRateLimited += result.rateLimitedCount;
    totalSuccess += result.successCount;
    totalErrors += result.errorCount;
    
    log(`\n[${index + 1}] ${result.method} ${result.endpoint}`, 'yellow');
    log(`  Total Requests: ${result.totalRequests}`, 'blue');
    log(`  Success: ${result.successCount} (${((result.successCount / result.totalRequests) * 100).toFixed(1)}%)`, 
      result.successCount > 0 ? 'green' : 'red');
    log(`  Rate Limited: ${result.rateLimitedCount} (${((result.rateLimitedCount / result.totalRequests) * 100).toFixed(1)}%)`, 
      result.rateLimitedCount > 0 ? 'green' : 'yellow');
    log(`  Errors: ${result.errorCount} (${((result.errorCount / result.totalRequests) * 100).toFixed(1)}%)`, 
      result.errorCount === 0 ? 'green' : 'red');
    log(`  Avg Response Time: ${result.avgResponseTime.toFixed(2)}ms`);
    log(`  Min/Max Response Time: ${result.minResponseTime.toFixed(2)}ms / ${result.maxResponseTime.toFixed(2)}ms`);
    
    if (result.rateLimitHeaders.limit) {
      log(`  Rate Limit Headers:`, 'cyan');
      log(`    Limit: ${result.rateLimitHeaders.limit}`);
      log(`    Remaining: ${result.rateLimitHeaders.remaining || 'N/A'}`);
      log(`    Reset: ${result.rateLimitHeaders.reset || 'N/A'}`);
    }
  });
  
  log(`\n${'='.repeat(80)}`, 'cyan');
  log('OVERALL STATISTICS', 'magenta');
  log(`${'='.repeat(80)}`, 'cyan');
  log(`Total Requests: ${totalRequests}`, 'blue');
  log(`Total Success: ${totalSuccess} (${((totalSuccess / totalRequests) * 100).toFixed(1)}%)`, 
    totalSuccess > 0 ? 'green' : 'red');
  log(`Total Rate Limited: ${totalRateLimited} (${((totalRateLimited / totalRequests) * 100).toFixed(1)}%)`, 
    totalRateLimited > 0 ? 'green' : 'yellow');
  log(`Total Errors: ${totalErrors} (${((totalErrors / totalRequests) * 100).toFixed(1)}%)`, 
    totalErrors === 0 ? 'green' : 'red');
  
  // Đánh giá
  log(`\n${'='.repeat(80)}`, 'cyan');
  log('SECURITY ASSESSMENT', 'magenta');
  log(`${'='.repeat(80)}`, 'cyan');
  
  const rateLimitEffectiveness = (totalRateLimited / totalRequests) * 100;
  
  if (rateLimitEffectiveness > 50) {
    log('✅ Rate limiting is WORKING EFFECTIVELY', 'green');
    log(`   ${rateLimitEffectiveness.toFixed(1)}% of requests were rate limited`, 'green');
  } else if (rateLimitEffectiveness > 20) {
    log('⚠️  Rate limiting is PARTIALLY WORKING', 'yellow');
    log(`   ${rateLimitEffectiveness.toFixed(1)}% of requests were rate limited`, 'yellow');
    log('   Consider tightening rate limits for production', 'yellow');
  } else {
    log('❌ Rate limiting may NOT be working properly', 'red');
    log(`   Only ${rateLimitEffectiveness.toFixed(1)}% of requests were rate limited`, 'red');
    log('   Review rate limiting configuration immediately!', 'red');
  }
  
  if (totalErrors / totalRequests > 0.1) {
    log('⚠️  High error rate detected - check server logs', 'yellow');
  }
}

// Main function
async function main() {
  log('\n🚀 Starting DDoS Test Suite', 'cyan');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log(`Configuration:`, 'blue');
  log(`  - Concurrent requests: ${CONCURRENT_REQUESTS}`, 'blue');
  log(`  - Total requests per endpoint: ${TOTAL_REQUESTS}`, 'blue');
  log(`  - Burst size: ${BURST_SIZE}`, 'blue');
  log(`  - Total endpoints to test: ${API_ENDPOINTS.length}`, 'blue');
  
  const allResults: TestResult[] = [];
  
  // Test 1: Normal load test cho tất cả endpoints
  log(`\n${'='.repeat(80)}`, 'cyan');
  log('PHASE 1: NORMAL LOAD TEST', 'magenta');
  log(`${'='.repeat(80)}`, 'cyan');
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      const result = await testEndpoint(
        endpoint.path,
        endpoint.method,
        TOTAL_REQUESTS,
        CONCURRENT_REQUESTS
      );
      allResults.push(result);
    } catch (error) {
      log(`Error testing ${endpoint.path}: ${error}`, 'red');
    }
  }
  
  // Test 2: Burst attacks cho các endpoints quan trọng
  log(`\n${'='.repeat(80)}`, 'cyan');
  log('PHASE 2: BURST ATTACK TEST', 'magenta');
  log(`${'='.repeat(80)}`, 'cyan');
  
  const criticalEndpoints = API_ENDPOINTS.filter(
    e => e.isAuth || e.path.includes('contact') || e.path.includes('admin')
  );
  
  for (const endpoint of criticalEndpoints) {
    try {
      const result = await testBurstAttack(endpoint.path, endpoint.method, BURST_SIZE);
      allResults.push(result);
      
      // Delay giữa các burst attacks
      await new Promise(resolve => setTimeout(resolve, BURST_DELAY));
    } catch (error) {
      log(`Error in burst test for ${endpoint.path}: ${error}`, 'red');
    }
  }
  
  // Test 3: Sustained attack (nhiều requests liên tục)
  log(`\n${'='.repeat(80)}`, 'cyan');
  log('PHASE 3: SUSTAINED ATTACK TEST', 'magenta');
  log(`${'='.repeat(80)}`, 'cyan');
  
  const sustainedEndpoints = API_ENDPOINTS.filter(e => e.isAuth || e.path.includes('contact'));
  
  for (const endpoint of sustainedEndpoints) {
    log(`\nSustained attack on ${endpoint.method} ${endpoint.path}`, 'yellow');
    const sustainedResults: RequestResult[] = [];
    
    for (let i = 0; i < 200; i++) {
      const result = await makeRequest(endpoint.path, endpoint.method, i);
      sustainedResults.push(result);
      
      if (i % 50 === 0) {
        const rateLimited = sustainedResults.filter(r => r.rateLimited).length;
        log(`  Progress: ${i}/200 requests, ${rateLimited} rate limited`, 'blue');
      }
      
      // Small delay để simulate real traffic
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const rateLimitedCount = sustainedResults.filter(r => r.rateLimited).length;
    log(`Sustained attack completed: ${rateLimitedCount}/${sustainedResults.length} rate limited`, 
      rateLimitedCount > 50 ? 'green' : 'yellow');
  }
  
  // Print final results
  printResults(allResults);
  
  log(`\n✅ DDoS Test Suite completed!`, 'green');
}

// Run tests
main().catch(error => {
  log(`\n❌ Fatal error: ${error}`, 'red');
  process.exit(1);
});

