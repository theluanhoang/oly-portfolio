/**
 * Image Upload Load Test
 * 
 * Simulates concurrent image uploads to test API performance under load.
 * Tests:
 * - Concurrent request handling
 * - Response time under load
 - Error rate
 * - Throughput
 * - Server stability
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

interface LoadTestConfig {
  baseUrl: string;
  concurrent: number;
  total: number;
  imagePath: string;
  authToken?: string;
}

interface RequestResult {
  success: boolean;
  statusCode: number;
  responseTime: number;
  size?: number;
  error?: string;
}

interface LoadTestResult {
  total: number;
  successful: number;
  failed: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number; // requests per second
  errorRate: number;
  results: RequestResult[];
}

/**
 * Upload single image
 */
async function uploadImage(
  imagePath: string,
  baseUrl: string,
  authToken?: string
): Promise<RequestResult> {
  const startTime = Date.now();
  
  try {
    if (!existsSync(imagePath)) {
      return {
        success: false,
        statusCode: 0,
        responseTime: Date.now() - startTime,
        error: 'Image file not found',
      };
    }
    
    const imageBuffer = readFileSync(imagePath);
    const filename = imagePath.split('/').pop() || 'image.jpg';
    
    // Create FormData using native FormData (Node.js 18+)
    const formData = new FormData();
    const blob = new Blob([imageBuffer]);
    const file = new File([blob], filename, { type: 'image/jpeg' });
    formData.append('file', file);
    
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
      headers,
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    return {
      success: response.ok,
      statusCode: response.status,
      responseTime,
      size: data.size,
      error: response.ok ? undefined : data.error || 'Unknown error',
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 0,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run load test
 */
async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  const { baseUrl, concurrent, total, imagePath, authToken } = config;
  const results: RequestResult[] = [];
  const startTime = Date.now();
  
  // Create batches
  const batches: number[][] = [];
  for (let i = 0; i < total; i += concurrent) {
    const batch = Array.from(
      { length: Math.min(concurrent, total - i) },
      (_, j) => i + j
    );
    batches.push(batch);
  }
  
  // Process batches sequentially, but requests in each batch concurrently
  for (const batch of batches) {
    const batchPromises = batch.map(() =>
      uploadImage(imagePath, baseUrl, authToken)
    );
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  const totalTime = Date.now() - startTime;
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  
  const responseTimes = results.map((r) => r.responseTime).sort((a, b) => a - b);
  
  const calculatePercentile = (arr: number[], percentile: number): number => {
    const index = Math.ceil((percentile / 100) * arr.length) - 1;
    return arr[Math.max(0, index)] || 0;
  };
  
  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    avgResponseTime:
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0,
    minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
    maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
    p50: calculatePercentile(responseTimes, 50),
    p95: calculatePercentile(responseTimes, 95),
    p99: calculatePercentile(responseTimes, 99),
    throughput: results.length / (totalTime / 1000),
    errorRate: (failed.length / results.length) * 100,
    results,
  };
}

/**
 * Print load test results
 */
function printLoadTestResults(result: LoadTestResult) {
  console.log('\n' + '='.repeat(80));
  console.log('IMAGE UPLOAD LOAD TEST RESULTS');
  console.log('='.repeat(80));
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total Requests: ${result.total}`);
  console.log(`   Successful: ${result.successful} ✅`);
  console.log(`   Failed: ${result.failed} ${result.failed > 0 ? '❌' : ''}`);
  console.log(`   Error Rate: ${result.errorRate.toFixed(2)}%`);
  
  console.log(`\n⏱️  Response Times:`);
  console.log(`   Average: ${result.avgResponseTime.toFixed(2)}ms`);
  console.log(`   Min: ${result.minResponseTime}ms`);
  console.log(`   Max: ${result.maxResponseTime}ms`);
  console.log(`   P50 (Median): ${result.p50}ms`);
  console.log(`   P95: ${result.p95}ms`);
  console.log(`   P99: ${result.p99}ms`);
  
  console.log(`\n🚀 Throughput:`);
  console.log(`   Requests/Second: ${result.throughput.toFixed(2)}`);
  
  // Production readiness benchmarks
  console.log(`\n🎯 Production Readiness:`);
  const avgTime = result.avgResponseTime;
  const p95Time = result.p95;
  const errorRate = result.errorRate;
  const throughput = result.throughput;
  
  console.log(
    `   Average Response Time: ${
      avgTime < 1000
        ? '✅ Excellent'
        : avgTime < 2000
        ? '✅ Good'
        : '⚠️  Needs Improvement'
    } (< 1000ms ideal)`
  );
  console.log(
    `   P95 Response Time: ${
      p95Time < 2000
        ? '✅ Excellent'
        : p95Time < 3000
        ? '✅ Good'
        : '⚠️  Needs Improvement'
    } (< 2000ms ideal)`
  );
  console.log(
    `   Error Rate: ${
      errorRate < 1
        ? '✅ Excellent'
        : errorRate < 5
        ? '✅ Good'
        : '❌ Needs Improvement'
    } (< 1% ideal)`
  );
  console.log(
    `   Throughput: ${
      throughput > 10
        ? '✅ Excellent'
        : throughput > 5
        ? '✅ Good'
        : '⚠️  Needs Improvement'
    } (> 10 req/s ideal)`
  );
  
  if (result.failed > 0) {
    console.log(`\n❌ Failed Requests:`);
    const errorCounts: Record<string, number> = {};
    result.results
      .filter((r) => !r.success)
      .forEach((r) => {
        const key = r.error || `Status ${r.statusCode}`;
        errorCounts[key] = (errorCounts[key] || 0) + 1;
      });
    
    Object.entries(errorCounts).forEach(([error, count]) => {
      console.log(`   - ${error}: ${count} times`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

/**
 * Main function
 */
async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const concurrent = parseInt(process.env.CONCURRENT || '5', 10);
  const total = parseInt(process.env.TOTAL || '50', 10);
  const imagePath =
    process.argv[2] || join(process.cwd(), 'public', 'uploads', 'test-image.jpg');
  
  console.log('🚀 Image Upload Load Test');
  console.log(`   Base URL: ${baseUrl}`);
  console.log(`   Concurrent: ${concurrent}`);
  console.log(`   Total Requests: ${total}`);
  console.log(`   Image Path: ${imagePath}`);
  
  if (!existsSync(imagePath)) {
    console.error(`\n❌ Image file not found: ${imagePath}`);
    console.log('\nUsage:');
    console.log('  tsx scripts/test-image-upload-load.ts [image-path]');
    console.log('  BASE_URL=http://localhost:3000 CONCURRENT=5 TOTAL=50 tsx scripts/test-image-upload-load.ts');
    process.exit(1);
  }
  
  console.log(`\n📤 Starting load test...\n`);
  
  const result = await runLoadTest({
    baseUrl,
    concurrent,
    total,
    imagePath,
  });
  
  printLoadTestResults(result);
  
  // Exit with error code if error rate is too high
  if (result.errorRate > 5) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { runLoadTest, printLoadTestResults };

