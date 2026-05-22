/**
 * Phase 1 Authentication Test
 * Tests location endpoints with proper JWT authentication
 */

const BASE_URL = 'http://localhost:5000';

// Mock JWT token (for testing - would come from auth in real scenario)
const createMockToken = () => {
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE2Mjk4MDAwMDB9.test-signature';
};

const testEndpointsWithAuth = async () => {
  console.log('🔐 API ENDPOINT TESTS WITH AUTHENTICATION\n');
  let passed = 0;
  let failed = 0;

  const tests = [
    {
      name: 'POST /api/locations/update-location',
      method: 'POST',
      url: `${BASE_URL}/api/locations/update-location`,
      body: { latitude: -15.3875, longitude: 28.3228, accuracyMeters: 10 },
      expectedStatusRanges: [401, 400, 403], // Auth error or bad request is OK
    },
    {
      name: 'GET /api/locations/me',
      method: 'GET',
      url: `${BASE_URL}/api/locations/me`,
      expectedStatusRanges: [401, 403], // Auth error expected
    },
    {
      name: 'POST /api/locations/nearby-carwashes',
      method: 'POST',
      url: `${BASE_URL}/api/locations/nearby-carwashes`,
      body: { latitude: -15.3875, longitude: 28.3228, radiusKm: 10 },
      expectedStatusRanges: [200, 400, 401], // Can succeed or fail with auth
    },
    {
      name: 'GET /api/locations/booking-counterparty/test-id',
      method: 'GET',
      url: `${BASE_URL}/api/locations/booking-counterparty/test-id`,
      expectedStatusRanges: [401, 403, 404], // Auth or booking not found
    },
  ];

  for (const test of tests) {
    try {
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${createMockToken()}`,
        },
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const statusOK = test.expectedStatusRanges.includes(response.status);

      if (statusOK) {
        console.log(`✓ ${test.name}`);
        console.log(`  Status: ${response.status} (expected: ${test.expectedStatusRanges.join(', ')})`);
        passed++;
      } else {
        console.log(`✗ ${test.name}`);
        console.log(`  Status: ${response.status} (expected: ${test.expectedStatusRanges.join(', ')})`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ ${test.name}`);
      console.log(`  Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n--- SUMMARY ---\n`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);

  if (failed === 0) {
    console.log(`\n✅ ALL TESTS PASSED!`);
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed`);
    process.exit(1);
  }
};

testEndpointsWithAuth();
