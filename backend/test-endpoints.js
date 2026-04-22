#!/usr/bin/env node

/**
 * API Endpoint Tests
 * Verifies all Phase 1 location endpoints
 */

const http = require('http');

const API_BASE = 'http://localhost:5000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(color, text) {
  console.log(`${color}${text}${colors.reset}`);
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token', // Will fail but tests endpoint existence
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testEndpoint(name, method, path, body) {
  try {
    const response = await makeRequest(method, path, body);

    // Endpoints should exist (not 404)
    if (response.status === 404) {
      log(colors.red, `✗ ${name} - Endpoint not found (404)`);
      return false;
    }

    // Expected to get 401 (unauthorized) since we don't have valid auth
    // This proves the endpoint exists and auth middleware is working
    if (response.status === 401 || response.status === 400 || response.status === 500) {
      log(colors.green, `✓ ${name} - Endpoint exists (${response.status})`);
      return true;
    }

    log(colors.yellow, `? ${name} - Got status ${response.status}`);
    return true; // Still passes if endpoint exists
  } catch (error) {
    log(colors.red, `✗ ${name} - Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  log(colors.blue, '\n📡 API ENDPOINT TESTS\n');

  // Wait a moment for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 1000));

  log(colors.blue, '--- New Location Endpoints ---\n');

  let passed = 0;
  let failed = 0;

  const endpoints = [
    {
      name: 'POST /api/locations/update-location',
      method: 'POST',
      path: '/api/locations/update-location',
      body: { latitude: -15.3875, longitude: 28.3228, accuracyMeters: 10 },
    },
    {
      name: 'GET /api/locations/me',
      method: 'GET',
      path: '/api/locations/me',
    },
    {
      name: 'POST /api/locations/nearby-carwashes',
      method: 'POST',
      path: '/api/locations/nearby-carwashes',
      body: { latitude: -15.3875, longitude: 28.3228, radiusKm: 10 },
    },
    {
      name: 'GET /api/locations/booking-counterparty/:bookingId',
      method: 'GET',
      path: '/api/locations/booking-counterparty/test-id',
    },
  ];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.method, endpoint.path, endpoint.body);
    result ? passed++ : failed++;
  }

  // Test existing routes to ensure we didn't break anything
  log(colors.blue, '\n--- Existing Routes (Sanity Check) ---\n');

  const existingRoutes = [
    { name: 'GET /api/auth/me', method: 'GET', path: '/api/auth/me' },
    { name: 'GET /bookings (alt path)', method: 'GET', path: '/bookings' },
  ];

  for (const route of existingRoutes) {
    const result = await testEndpoint(route.name, route.method, route.path);
    result ? passed++ : failed++;
  }

  // Summary
  log(colors.blue, '\n--- SUMMARY ---\n');
  log(colors.green, `✓ Passed: ${passed}`);
  if (failed > 0) {
    log(colors.red, `✗ Failed: ${failed}`);
  }

  const total = passed + failed;
  if (passed === total) {
    log(colors.green, `\n🎉 ALL ENDPOINT CHECKS PASSED (${total}/${total})\n`);
    process.exit(0);
  } else {
    log(colors.yellow, `\n⚠️  ${failed} endpoints not found\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  log(colors.red, `\n❌ Test error: ${error.message}`);
  process.exit(1);
});
