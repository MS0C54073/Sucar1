/**
 * Test All Mock Credentials
 * Verifies all seed data users can login
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const credentials = {
  admin: [
    { email: 'admin@sucar.com', password: 'password123', role: 'admin', label: 'Admin User' }
  ],
  clients: [
    { email: 'john.mwansa@email.com', password: 'client123', role: 'client', label: 'John Mwansa' },
    { email: 'sarah.banda@email.com', password: 'client123', role: 'client', label: 'Sarah Banda' },
    { email: 'peter.phiri@email.com', password: 'client123', role: 'client', label: 'Peter Phiri' },
    { email: 'mary.tembo@email.com', password: 'client123', role: 'client', label: 'Mary Tembo' },
    { email: 'david.ngoma@email.com', password: 'client123', role: 'client', label: 'David Ngoma' },
  ],
  carWashes: [
    { email: 'sparkle@carwash.com', password: 'carwash123', role: 'car_wash', label: 'Sparkle Auto Wash' },
    { email: 'crystal@carwash.com', password: 'carwash123', role: 'car_wash', label: 'Crystal Clean Car Wash' },
    { email: 'shine@carwash.com', password: 'carwash123', role: 'car_wash', label: 'Shine Bright Car Care' },
    { email: 'premium@carwash.com', password: 'carwash123', role: 'car_wash', label: 'Premium Wash Center' },
    { email: 'quick@carwash.com', password: 'carwash123', role: 'car_wash', label: 'Quick Wash Express' },
  ],
  drivers: [
    { email: 'james.mulenga@driver.com', password: 'driver123', role: 'driver', label: 'James Mulenga' },
    { email: 'michael.chanda@driver.com', password: 'driver123', role: 'driver', label: 'Michael Chanda' },
    { email: 'robert.mwanza@driver.com', password: 'driver123', role: 'driver', label: 'Robert Mwanza' },
    { email: 'thomas.banda@driver.com', password: 'driver123', role: 'driver', label: 'Thomas Banda' },
    { email: 'andrew.phiri@driver.com', password: 'driver123', role: 'driver', label: 'Andrew Phiri' },
  ]
};

async function testLogin(email, password, label) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: email.toLowerCase(),
      password
    });

    if (response.status === 200 && response.data.token) {
      console.log(`✓ ${label} - Login successful`);
      return true;
    } else {
      console.log(`✗ ${label} - Login returned status ${response.status} but no token`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`✗ ${label} - Invalid credentials (401)`);
    } else {
      console.log(`✗ ${label} - Error: ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🧪 TESTING ALL MOCK CREDENTIALS\n');
  console.log(`API URL: ${API_URL}\n`);

  let totalTests = 0;
  let passedTests = 0;

  // Test Admin
  console.log('--- ADMIN ---\n');
  for (const cred of credentials.admin) {
    const passed = await testLogin(cred.email, cred.password, cred.label);
    totalTests++;
    if (passed) passedTests++;
  }

  // Test Clients
  console.log('\n--- CLIENTS ---\n');
  for (const cred of credentials.clients) {
    const passed = await testLogin(cred.email, cred.password, cred.label);
    totalTests++;
    if (passed) passedTests++;
  }

  // Test Car Washes
  console.log('\n--- CAR WASHES ---\n');
  for (const cred of credentials.carWashes) {
    const passed = await testLogin(cred.email, cred.password, cred.label);
    totalTests++;
    if (passed) passedTests++;
  }

  // Test Drivers
  console.log('\n--- DRIVERS ---\n');
  for (const cred of credentials.drivers) {
    const passed = await testLogin(cred.email, cred.password, cred.label);
    totalTests++;
    if (passed) passedTests++;
  }

  // Summary
  console.log(`\n--- SUMMARY ---`);
  console.log(`Passed: ${passedTests}/${totalTests}`);
  console.log(`Failed: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log(`\n✅ ALL CREDENTIALS WORKING!`);
  } else {
    console.log(`\n❌ ${totalTests - passedTests} credential(s) not working`);
    process.exit(1);
  }
}

runTests();
