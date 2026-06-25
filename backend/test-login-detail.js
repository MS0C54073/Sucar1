/**
 * Test Login Endpoint with Detailed Error Output
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function testLogin() {
  console.log('🧪 TESTING LOGIN ENDPOINT\n');
  console.log(`API URL: ${API_URL}\n`);

  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@sucar.com',
      password: 'password123'
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('Status:', error.response?.status);
    console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error:', error.message);

    if (error.response?.data?.error) {
      console.log('\nDetailed Error:', error.response.data.error);
    }
  }
}

testLogin();
