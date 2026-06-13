/**
 * Verify all seed role logins against running API.
 * Usage: node scripts/test-all-logins.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const API = process.env.API_BASE || 'http://localhost:5000/api';

const accounts = [
  { email: 'admin@sucar.com', password: 'admin123', role: 'admin' },
  { email: 'john.mwansa@email.com', password: 'client123', role: 'client' },
  { email: 'james.mulenga@driver.com', password: 'driver123', role: 'driver' },
  { email: 'sparkle@carwash.com', password: 'carwash123', role: 'carwash' },
];

async function main() {
  console.log('Testing logins at', API);
  let ok = 0;
  for (const a of accounts) {
    try {
      const res = await axios.post(`${API}/auth/login`, {
        email: a.email,
        password: a.password,
      });
      const data = res.data?.data || {};
      const role = data.role;
      const token = data.token;
      if (res.data.success && token && role === a.role) {
        console.log(`✅ ${a.role}: ${a.email}`);
        ok++;
      } else {
        console.log(`❌ ${a.email}: unexpected response`, res.data);
      }
    } catch (e) {
      console.log(`❌ ${a.email}:`, e.response?.data?.message || e.message);
    }
  }
  console.log(`\n${ok}/${accounts.length} passed`);
  process.exit(ok === accounts.length ? 0 : 1);
}

main();
