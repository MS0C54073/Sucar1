/**
 * Comprehensive Login Test Script
 * Tests login functionality and identifies issues
 */

const axios = require('axios');
const bcrypt = require('bcryptjs');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test credentials
const testUsers = [
  { email: 'admin@sucar.com', password: 'admin123', role: 'admin' },
  { email: 'john.mwansa@email.com', password: 'client123', role: 'client' },
  { email: 'sparkle@carwash.com', password: 'carwash123', role: 'carwash' },
  { email: 'james.mulenga@driver.com', password: 'driver123', role: 'driver' },
];

async function testBackendHealth() {
  console.log('\n🔍 Step 1: Testing Backend Health...');
  try {
    const response = await axios.get(`${API_URL.replace('/api', '')}/api/health`);
    console.log('✅ Backend is running');
    console.log('   Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend is NOT running or not accessible');
    console.error('   Error:', error.message);
    console.error('   URL:', API_URL);
    return false;
  }
}

async function testLogin(email, password, expectedRole) {
  console.log(`\n🔐 Testing login for: ${email}`);
  console.log(`   Expected role: ${expectedRole}`);
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    }, {
      validateStatus: () => true, // Don't throw on any status
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200 && response.data.success) {
      const user = response.data.data;
      console.log(`   ✅ Login successful!`);
      console.log(`   User: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Token: ${user.token ? 'Present' : 'Missing'}`);
      
      if (user.role !== expectedRole) {
        console.log(`   ⚠️  Role mismatch! Expected ${expectedRole}, got ${user.role}`);
      }
      
      return { success: true, user };
    } else {
      console.log(`   ❌ Login failed`);
      console.log(`   Response:`, JSON.stringify(response.data, null, 2));
      
      if (response.status === 500) {
        console.log(`   💡 This is a server error - check backend logs`);
      } else if (response.status === 401) {
        console.log(`   💡 Authentication failed - check credentials or user exists`);
      } else if (response.status === 400) {
        console.log(`   💡 Bad request - check request format`);
      }
      
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error(`   ❌ Network/Connection error`);
    console.error(`   Error:`, error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error(`   💡 Backend server is not running`);
      console.error(`   Fix: Start backend with 'cd backend && npm run dev'`);
    } else if (error.code === 'ENOTFOUND') {
      console.error(`   💡 Cannot resolve hostname`);
    }
    
    return { success: false, error: error.message };
  }
}

async function testPasswordHash(email, password) {
  console.log(`\n🔑 Testing password hash for: ${email}`);
  
  // This would require database access, so we'll just show what the hash should look like
  const sampleHash = await bcrypt.hash(password, 10);
  console.log(`   Sample hash for '${password}': ${sampleHash.substring(0, 30)}...`);
  console.log(`   💡 If login fails, password might not be hashed correctly in database`);
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 Comprehensive Login Test Suite');
  console.log('═══════════════════════════════════════════════════════');
  
  // Test 1: Backend Health
  const backendHealthy = await testBackendHealth();
  if (!backendHealthy) {
    console.log('\n❌ Backend is not running. Cannot proceed with login tests.');
    console.log('   Fix: Start backend with "cd backend && npm run dev"');
    process.exit(1);
  }
  
  // Test 2: Login for each test user
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔐 Testing Login for All Users');
  console.log('═══════════════════════════════════════════════════════');
  
  const results = [];
  for (const testUser of testUsers) {
    const result = await testLogin(testUser.email, testUser.password, testUser.role);
    results.push({ ...testUser, ...result });
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 Test Summary');
  console.log('═══════════════════════════════════════════════════════');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful logins: ${successful}/${results.length}`);
  console.log(`❌ Failed logins: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Logins:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.email}: ${r.error?.message || 'Unknown error'}`);
    });
    
    console.log('\n💡 Common Fixes:');
    console.log('   1. Ensure Supabase is running: supabase start');
    console.log('   2. Check if users exist in database');
    console.log('   3. Verify passwords are correctly hashed');
    console.log('   4. Check backend console for detailed error logs');
    console.log('   5. Run seed data script: node scripts/seed-data.js');
  } else {
    console.log('\n✅ All login tests passed!');
  }
  
  // Test 3: Password hash info
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔑 Password Hash Information');
  console.log('═══════════════════════════════════════════════════════');
  await testPasswordHash('test@example.com', 'test123');
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ Test Suite Complete');
  console.log('═══════════════════════════════════════════════════════');
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
