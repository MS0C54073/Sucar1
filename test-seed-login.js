/**
 * Test Seed Data Login Credentials
 * Tests login for users from each role
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test credentials from each role
const testCreds = [
    { email: 'admin@sucar.com', password: 'admin123', role: 'admin', name: 'Admin' },
    { email: 'john.mwansa@email.com', password: 'client123', role: 'client', name: 'Client (John Mwansa)' },
    { email: 'james.mulenga@driver.com', password: 'driver123', role: 'driver', name: 'Driver (James Mulenga)' },
    { email: 'sparkle@carwash.com', password: 'carwash123', role: 'carwash', name: 'Car Wash (Sparkle)' }
];

async function testLogin(email, password, expectedRole, name) {
    try {
        console.log(`\n🧪 Testing ${name}...`);
        console.log(`   Email: ${email}`);
        
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email,
            password
        });

        if (response.status === 200 && response.data?.success) {
            const data = response.data.data || {};
            const token = data.token;
            console.log(`✅ LOGIN SUCCESSFUL`);
            console.log(`   Token received: ${token ? token.substring(0, 30) + '...' : 'NO TOKEN'}`);
            console.log(`   User role: ${data.role}`);
            console.log(`   User name: ${data.name}`);
            
            if (data.role === expectedRole) {
                console.log(`   ✅ Role matches expected: ${expectedRole}`);
            } else {
                console.log(`   ⚠️  Role mismatch! Expected: ${expectedRole}, Got: ${data.role}`);
            }
            
            return true;
        }
    } catch (error) {
        console.log(`❌ LOGIN FAILED`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Message: ${error.response.data?.message || error.message}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
        return false;
    }
}

async function runTests() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SEED DATA LOGIN CREDENTIAL TEST');
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;

    for (const cred of testCreds) {
        const success = await testLogin(cred.email, cred.password, cred.role, cred.name);
        if (success) passed++;
        else failed++;
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    console.log('='.repeat(60) + '\n');

    process.exit(failed > 0 ? 1 : 0);
}

// Give API time to fully start
setTimeout(runTests, 2000);
