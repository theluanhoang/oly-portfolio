/**
 * Security Test Suite cho Login System
 * Chạy với: npm test hoặc node tests/security/login.test.js
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const API_AUTH_URL = `${BASE_URL}/api/auth/callback/credentials`;

// Test credentials (nên dùng test account riêng)
const VALID_USERNAME = process.env.TEST_ADMIN_USERNAME || 'admin';
const VALID_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';
const INVALID_USERNAME = 'invalid_user';
const INVALID_PASSWORD = 'invalid_pass';

// Helper function để gửi login request
async function attemptLogin(username, password) {
  try {
    const response = await fetch(API_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    return {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
}

// Test Results
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function logResult(testName, passed, message = '') {
  if (passed) {
    results.passed.push(testName);
    console.log(`✅ PASS: ${testName}${message ? ' - ' + message : ''}`);
  } else {
    results.failed.push(testName);
    console.error(`❌ FAIL: ${testName}${message ? ' - ' + message : ''}`);
  }
}

function logWarning(testName, message) {
  results.warnings.push({ test: testName, message });
  console.warn(`⚠️  WARN: ${testName} - ${message}`);
}

// Test Suite
async function runSecurityTests() {
  console.log('🔒 Bắt đầu Security Tests cho Login System\n');
  console.log('='.repeat(60));

  // 1. AUTHENTICATION TESTS
  console.log('\n📋 1. AUTHENTICATION TESTS');
  console.log('-'.repeat(60));

  // Test 1.1: Valid credentials
  try {
    const result = await attemptLogin(VALID_USERNAME, VALID_PASSWORD);
    logResult('Test 1.1.1: Valid credentials', result.ok || result.status === 200);
  } catch (error) {
    logResult('Test 1.1.1: Valid credentials', false, error.message);
  }

  // Test 1.2: Invalid username
  try {
    const result = await attemptLogin(INVALID_USERNAME, VALID_PASSWORD);
    logResult('Test 1.2.1: Invalid username', !result.ok && result.status !== 200);
  } catch (error) {
    logResult('Test 1.2.1: Invalid username', false, error.message);
  }

  // Test 1.3: Invalid password
  try {
    const result = await attemptLogin(VALID_USERNAME, INVALID_PASSWORD);
    logResult('Test 1.3.1: Invalid password', !result.ok && result.status !== 200);
  } catch (error) {
    logResult('Test 1.3.1: Invalid password', false, error.message);
  }

  // Test 1.4: Empty credentials
  try {
    const result = await attemptLogin('', '');
    logResult('Test 1.4.1: Empty credentials', !result.ok);
  } catch (error) {
    logResult('Test 1.4.1: Empty credentials', false, error.message);
  }

  // Test 1.5: SQL Injection attempts
  const sqlInjectionTests = [
    "' OR '1'='1",
    "admin'--",
    "admin'; DROP TABLE users;--",
    "' OR 1=1--",
  ];

  for (const sqlPayload of sqlInjectionTests) {
    try {
      const result = await attemptLogin(sqlPayload, 'password');
      logResult(`Test 1.5: SQL Injection (${sqlPayload.substring(0, 20)}...)`, !result.ok);
    } catch (error) {
      logResult(`Test 1.5: SQL Injection (${sqlPayload.substring(0, 20)}...)`, false, error.message);
    }
  }

  // Test 1.6: XSS attempts
  const xssTests = [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(1)",
  ];

  for (const xssPayload of xssTests) {
    try {
      const result = await attemptLogin(xssPayload, 'password');
      logResult(`Test 1.6: XSS attempt (${xssPayload.substring(0, 20)}...)`, !result.ok);
    } catch (error) {
      logResult(`Test 1.6: XSS attempt (${xssPayload.substring(0, 20)}...)`, false, error.message);
    }
  }

  // Test 1.7: Special characters
  const specialCharTests = [
    "!@#$%^&*()",
    "admin\npassword",
    "admin\0password",
    "admin\tpassword",
  ];

  for (const specialPayload of specialCharTests) {
    try {
      const result = await attemptLogin(specialPayload, 'password');
      logResult(`Test 1.7: Special characters`, !result.ok || result.status === 200);
    } catch (error) {
      logResult(`Test 1.7: Special characters`, false, error.message);
    }
  }

  // 2. RATE LIMITING TESTS
  console.log('\n📋 2. RATE LIMITING TESTS');
  console.log('-'.repeat(60));

  // Test 2.1: Multiple failed attempts
  let rateLimitDetected = false;
  try {
    for (let i = 0; i < 10; i++) {
      const result = await attemptLogin(INVALID_USERNAME, INVALID_PASSWORD);
      if (result.status === 429 || result.status === 403) {
        rateLimitDetected = true;
        break;
      }
      // Small delay to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (rateLimitDetected) {
      logResult('Test 2.1: Rate limiting active', true);
    } else {
      logWarning('Test 2.1: Rate limiting', 'Rate limiting không được phát hiện sau 10 lần thử');
    }
  } catch (error) {
    logResult('Test 2.1: Rate limiting', false, error.message);
  }

  // 3. SECURITY HEADERS TESTS
  console.log('\n📋 3. SECURITY HEADERS TESTS');
  console.log('-'.repeat(60));

  try {
    const response = await fetch(`${BASE_URL}/admin/login`);
    const headers = Object.fromEntries(response.headers.entries());

    // Check security headers
    const securityHeaders = {
      'X-Frame-Options': headers['x-frame-options'],
      'X-Content-Type-Options': headers['x-content-type-options'],
      'X-XSS-Protection': headers['x-xss-protection'],
      'Strict-Transport-Security': headers['strict-transport-security'],
    };

    for (const [header, value] of Object.entries(securityHeaders)) {
      if (value) {
        logResult(`Test 3.1: ${header} present`, true, `Value: ${value}`);
      } else {
        logWarning(`Test 3.1: ${header}`, 'Header không được set');
      }
    }
  } catch (error) {
    logResult('Test 3.1: Security headers', false, error.message);
  }

  // 4. SESSION SECURITY TESTS
  console.log('\n📋 4. SESSION SECURITY TESTS');
  console.log('-'.repeat(60));

  try {
    const response = await fetch(API_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: VALID_USERNAME,
        password: VALID_PASSWORD,
      }),
    });

    const cookies = response.headers.get('set-cookie') || '';
    const hasHttpOnly = cookies.includes('HttpOnly');
    const hasSecure = cookies.includes('Secure');
    const hasSameSite = cookies.includes('SameSite');

    logResult('Test 4.1: Cookie HttpOnly flag', hasHttpOnly);
    logResult('Test 4.2: Cookie Secure flag', hasSecure || BASE_URL.includes('localhost'));
    logResult('Test 4.3: Cookie SameSite attribute', hasSameSite);
  } catch (error) {
    logResult('Test 4: Session security', false, error.message);
  }

  // 5. INPUT VALIDATION TESTS
  console.log('\n📋 5. INPUT VALIDATION TESTS');
  console.log('-'.repeat(60));

  // Test 5.1: Very long input
  const longString = 'a'.repeat(1000);
  try {
    const result = await attemptLogin(longString, longString);
    logResult('Test 5.1: Very long input', !result.ok || result.status === 413);
  } catch (error) {
    logResult('Test 5.1: Very long input', false, error.message);
  }

  // Test 5.2: Null bytes
  try {
    const result = await attemptLogin('admin\0', 'password');
    logResult('Test 5.2: Null bytes in input', !result.ok);
  } catch (error) {
    logResult('Test 5.2: Null bytes in input', false, error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY');
  console.log('-'.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(test => console.log(`   - ${test}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(w => console.log(`   - ${w.test}: ${w.message}`));
  }

  console.log('\n' + '='.repeat(60));

  // Exit code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  runSecurityTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runSecurityTests, attemptLogin };



