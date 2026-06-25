#!/usr/bin/env node

/**
 * Complete Database Setup & Credential Verification
 * 
 * This script:
 * 1. Checks Supabase connection
 * 2. Runs migrations (schema, location tracking, admin user)
 * 3. Seeds all mock data
 * 4. Tests all credentials
 * 
 * Usage: node setup-and-test.js
 */

require('dotenv').config();
const { exec } = require('child_process');
const axios = require('axios');
const util = require('util');
const execPromise = util.promisify(exec);

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54325';
const API_URL = 'http://localhost:5000/api';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(text) {
  console.log('\n' + '═'.repeat(60));
  log(text, 'cyan');
  console.log('═'.repeat(60));
}

async function checkSupabaseConnection() {
  header('CHECKING SUPABASE CONNECTION');
  
  try {
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
      },
      timeout: 5000,
    });
    
    log('✓ Supabase API is responding', 'green');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('✗ Cannot connect to Supabase API', 'red');
      log(`  Make sure Supabase is running:`, 'yellow');
      log(`  $ supabase start`, 'yellow');
    } else {
      log(`✗ Error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function runMigrations() {
  header('RUNNING DATABASE MIGRATIONS');
  
  try {
    log('Running: npm run migrate:auto', 'blue');
    const { stdout, stderr } = await execPromise('npm run migrate:auto', {
      cwd: __dirname + '/../backend',
      timeout: 60000,
    });
    
    if (stdout.includes('✅') || stdout.includes('All tables exist')) {
      log('✓ Migrations completed successfully', 'green');
      return true;
    } else {
      log('⚠ Migration output:' , 'yellow');
      console.log(stdout);
      return true; // Continue even if warning
    }
  } catch (error) {
    log(`✗ Migration failed: ${error.message}`, 'red');
    return false;
  }
}

async function seedDatabase() {
  header('SEEDING DATABASE');
  
  try {
    log('Running: npm run seed', 'blue');
    const { stdout, stderr } = await execPromise('npm run seed', {
      cwd: __dirname + '/../backend',
      timeout: 60000,
    });
    
    if (stdout.includes('✅') || stdout.includes('Seed completed')) {
      log('✓ Database seeded successfully', 'green');
      return true;
    } else {
      log('⚠ Seed output:' , 'yellow');
      console.log(stdout.substring(0, 500)); // First 500 chars
      return true; // Continue anyway
    }
  } catch (error) {
    log(`✗ Seed failed: ${error.message}`, 'red');
    return false;
  }
}

async function createAdminUser() {
  header('CREATING ADMIN USER');
  
  try {
    log('Running: node scripts/create-admin-simple.js', 'blue');
    const { stdout } = await execPromise('node scripts/create-admin-simple.js', {
      cwd: __dirname + '/../backend',
      timeout: 30000,
    });
    
    if (stdout.includes('✓') || stdout.includes('created') || stdout.includes('success')) {
      log('✓ Admin user created/verified', 'green');
      return true;
    } else {
      log('⚠ Admin creation output:', 'yellow');
      console.log(stdout.substring(0, 300));
      return true;
    }
  } catch (error) {
    log(`⚠ Admin creation skipped: ${error.message}`, 'yellow');
    return true; // Continue - might already exist
  }
}

async function testCredentials() {
  header('TESTING ALL CREDENTIALS');
  
  const credentials = {
    admin: [
      { email: 'admin@sucar.com', password: 'password123', role: 'admin', label: 'Admin User' }
    ],
    clients: [
      { email: 'john.mwansa@email.com', password: 'client123', role: 'client', label: 'John Mwansa' },
      { email: 'sarah.banda@email.com', password: 'client123', role: 'client', label: 'Sarah Banda' },
    ],
    carWashes: [
      { email: 'sparkle@carwash.com', password: 'carwash123', role: 'car_wash', label: 'Sparkle Auto Wash' },
      { email: 'crystal@carwash.com', password: 'carwash123', role: 'car_wash', label: 'Crystal Clean Car Wash' },
    ],
    drivers: [
      { email: 'james.mulenga@driver.com', password: 'driver123', role: 'driver', label: 'James Mulenga' },
      { email: 'michael.chanda@driver.com', password: 'driver123', role: 'driver', label: 'Michael Chanda' },
    ]
  };

  let totalTests = 0;
  let passedTests = 0;

  log('\n--- ADMIN ---\n', 'yellow');
  for (const cred of credentials.admin) {
    const passed = await testLogin(cred.email, cred.password, cred.label);
    totalTests++;
    if (passed) passedTests++;
  }

  log('\n--- CLIENTS ---\n', 'yellow');
  for (const cred of credentials.clients) {
    const passed = await testLogin(cred.email, cred.password, cred.label);
    totalTests++;
    if (passed) passedTests++;
  }

  log('\n--- CAR WASHES ---\n', 'yellow');
  for (const cred of credentials.carWashes) {
    const passed = await testLogin(cred.email, cred.password, cred.label);
    totalTests++;
    if (passed) passedTests++;
  }

  log('\n--- DRIVERS ---\n', 'yellow');
  for (const cred of credentials.drivers) {
    const passed = await testLogin(cred.email, cred.password, cred.label);
    totalTests++;
    if (passed) passedTests++;
  }

  console.log('\n' + '-'.repeat(60));
  log(`Results: ${passedTests}/${totalTests} credentials working`, passedTests === totalTests ? 'green' : 'yellow');
  
  return passedTests === totalTests;
}

async function testLogin(email, password, label) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: email.toLowerCase(),
      password
    });

    if (response.status === 200 && response.data.token) {
      log(`✓ ${label} - Login successful`, 'green');
      return true;
    } else {
      log(`✗ ${label} - Login returned status ${response.status} but no token`, 'red');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      log(`✗ ${label} - Invalid credentials (401)`, 'red');
    } else if (error.code === 'ECONNREFUSED') {
      log(`✗ ${label} - Cannot connect to API (backend not running)`, 'red');
    } else {
      log(`✗ ${label} - Error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function main() {
  log('\n🚀 SUCAR DATABASE SETUP & CREDENTIAL TEST\n', 'cyan');

  // Step 1: Check Supabase
  if (!await checkSupabaseConnection()) {
    log('\n❌ Cannot proceed without Supabase running', 'red');
    process.exit(1);
  }

  // Step 2: Run migrations
  await runMigrations();

  // Step 3: Seed data
  await seedDatabase();

  // Step 4: Create admin
  await createAdminUser();

  // Step 5: Test credentials
  const allWorking = await testCredentials();

  // Summary
  header('SETUP COMPLETE');
  if (allWorking) {
    log('✅ All credentials working! System is ready.', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Start frontend: npm run dev (from frontend/)', 'blue');
    log('2. Login at http://localhost:5173', 'blue');
    log('3. Test all roles and Phase 1 features', 'blue');
    process.exit(0);
  } else {
    log('⚠ Some credentials not working. Check logs above.', 'yellow');
    log('\nTroubleshooting:', 'cyan');
    log('1. Ensure backend is running: npm run dev (from backend/)', 'blue');
    log('2. Verify Supabase is running: supabase status', 'blue');
    log('3. Check .env values are correct', 'blue');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
