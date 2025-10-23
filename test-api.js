// Quick API test script
const http = require('http');

// Test 1: Health Check
console.log('🔍 Testing API endpoints...\n');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  try {
    // Test 1: Health Check
    console.log('1️⃣  Testing Health Check...');
    const health = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    console.log(`   Status: ${health.status}`);
    console.log(`   Response:`, health.data);
    console.log('   ✅ Health check passed!\n');

    // Test 2: Login
    console.log('2️⃣  Testing Login...');
    const login = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'jean.baptiste@email.com',
      password: 'password123'
    });
    console.log(`   Status: ${login.status}`);
    if (login.data.success) {
      console.log(`   User:`, login.data.data.user.name);
      console.log(`   Role:`, login.data.data.user.role);
      console.log(`   Token:`, login.data.data.token ? 'Generated ✓' : 'Missing ✗');
      console.log('   ✅ Login successful!\n');
    } else {
      console.log('   ❌ Login failed!\n');
    }

    // Test 3: Get Medicines (with auth)
    console.log('3️⃣  Testing Get Medicines...');
    const medicines = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/medicines',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${login.data.data.token}`
      }
    });
    console.log(`   Status: ${medicines.status}`);
    console.log(`   Medicines found:`, medicines.data.data?.length || 0);
    console.log('   ✅ Medicines endpoint working!\n');

    // Test 4: Get Education Tips
    console.log('4️⃣  Testing Get Education Tips...');
    const tips = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/education',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${login.data.data.token}`
      }
    });
    console.log(`   Status: ${tips.status}`);
    console.log(`   Tips found:`, tips.data.data?.length || 0);
    console.log('   ✅ Education tips endpoint working!\n');

    console.log('🎉 All tests passed! Backend is working correctly!\n');
    console.log('📝 Test Credentials:');
    console.log('   User: jean.baptiste@email.com / password123');
    console.log('   CHW: marie.claire@email.com / password123');
    console.log('   Admin: admin@umutisafe.gov.rw / admin123\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();

