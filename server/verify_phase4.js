const axios = require('axios');
const { spawn } = require('child_process');

async function test() {
  const base = 'http://localhost:3001';
  
  console.log('--- Phase 4: NSFW Verification Test ---');

  try {
    // 1. Initial Access (Expected 403)
    console.log('\n1. Testing Protected Search (Expected 403)...');
    const home = await axios.get(`${base}/api/home`);
    const cookie = home.headers['set-cookie'][0].split(';')[0];
    
    try {
      await axios.get(`${base}/api/nsfw/search?q=test`);
      console.log('FAIL: Accessed NSFW without verification');
    } catch (err) {
      console.log('SUCCESS: Got Status', err.response?.status, 'Code:', err.response?.data?.code);
    }

    // 2. Verify Age
    console.log('\n2. Verifying Age...');
    const verifyRes = await axios.post(`${base}/api/user/verify-age`, 
      { confirmed: true }, 
      { headers: { Cookie: cookie } }
    );
    console.log('Status:', verifyRes.status, 'Success:', verifyRes.data.success);

    // 3. Access Again (Expected 200)
    console.log('\n3. Testing Protected Search Again (Expected 200)...');
    const nsfwRes = await axios.get(`${base}/api/nsfw/search?q=test`, 
      { headers: { Cookie: cookie } }
    );
    console.log('Status:', nsfwRes.status, 'Results Count:', nsfwRes.data.length);

    console.log('\n--- VERIFICATION PASSED ---');
  } catch (err) {
    console.error('VERIFICATION FAILED:', err.response?.data || err.message);
  }
}

// Start server and run test
const server = spawn('cmd.exe', ['/c', 'npx ts-node src/index.ts'], { stdio: 'inherit', cwd: process.cwd() });

setTimeout(async () => {
  await test();
  server.kill();
  process.exit();
}, 8000);
