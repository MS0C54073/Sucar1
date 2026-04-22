#!/usr/bin/env node

/**
 * Quick SQL Schema Verification Test
 * Run via: node verify-schema.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54325';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (error && error.code === '42P01') {
      log(colors.red, `✗ Table ${tableName} does not exist`);
      return false;
    }

    log(colors.green, `✓ Table ${tableName} exists`);
    return true;
  } catch (err) {
    log(colors.red, `✗ Error checking ${tableName}: ${err.message}`);
    return false;
  }
}

async function checkRPC(rpcName, params) {
  try {
    const { data, error } = await supabase.rpc(rpcName, params);

    if (error && error.message.includes('Unknown function')) {
      log(colors.red, `✗ RPC function ${rpcName} does not exist`);
      return false;
    }

    log(colors.green, `✓ RPC function ${rpcName} exists and is callable`);
    return true;
  } catch (err) {
    log(colors.red, `✗ Error calling ${rpcName}: ${err.message}`);
    return false;
  }
}

async function runTests() {
  log(colors.blue, '\n📊 SCHEMA VERIFICATION TEST\n');

  const baseTables = ['users', 'vehicles', 'services', 'bookings', 'payments'];
  const locationTables = ['user_locations'];
  const allTables = [...baseTables, ...locationTables];

  let passed = 0;
  let failed = 0;

  // Test base tables
  log(colors.blue, '--- Base Tables ---\n');
  for (const table of baseTables) {
    const result = await checkTable(table);
    result ? passed++ : failed++;
  }

  // Test location tables
  log(colors.blue, '\n--- Location Tracking Tables ---\n');
  for (const table of locationTables) {
    const result = await checkTable(table);
    result ? passed++ : failed++;
  }

  // Test RPC functions
  log(colors.blue, '\n--- RPC Functions ---\n');
  const rpcResult = await checkRPC('nearby_car_washes', {
    user_lat: -15.3875,
    user_lng: 28.3228,
    radius_km: 10,
  });
  rpcResult ? passed++ : failed++;

  // Summary
  log(colors.blue, `\n--- SUMMARY ---\n`);
  log(colors.green, `✓ Passed: ${passed}`);
  if (failed > 0) {
    log(colors.red, `✗ Failed: ${failed}`);
  }

  const total = passed + failed;
  if (passed === total) {
    log(colors.green, `\n🎉 ALL CHECKS PASSED (${total}/${total})\n`);
    process.exit(0);
  } else {
    log(colors.red, `\n⚠️  SOME CHECKS FAILED (${passed}/${total})\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  log(colors.red, `\n❌ Test error: ${error.message}`);
  process.exit(1);
});
