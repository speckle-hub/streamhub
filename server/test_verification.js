const axios = require('axios');

async function test() {
  const base = 'http://localhost:3001';
  try {
    console.log('Testing GET /api/home...');
    const home = await axios.get(`${base}/api/home`);
    const cookie = home.headers['set-cookie'] ? home.headers['set-cookie'][0].split(';')[0] : '';
    console.log('Home Success, Cookie:', cookie);

    console.log('\nTesting POST /api/user/settings...');
    const settings = await axios.post(`${base}/api/user/settings`, {
      debridKey: 'test_key',
      autoplay: true,
      nsfwEnabled: true
    }, { headers: { Cookie: cookie } });
    console.log('Settings Success:', settings.data);

    console.log('\nTesting POST /api/user/progress...');
    const progress = await axios.post(`${base}/api/user/progress`, {
      contentId: 'tmdb:27205',
      type: 'movie',
      position: 500,
      duration: 9000
    }, { headers: { Cookie: cookie } });
    console.log('Progress Success:', progress.data);

  } catch (err) {
    console.error('Test Failed:', err.response?.data || err.message);
  }
}

test();
