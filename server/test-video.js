const axios = require('axios');

async function testVideo() {
  try {
    const API_BASE = 'http://localhost:3001';
    console.log('Fetching streams for Inception...');
    const res = await axios.get(`${API_BASE}/api/content/streams/movie/tt1375666`, { timeout: 30000 });
    const streams = res.data.streams || [];
    
    if (streams.length === 0) {
      console.log('No streams found.');
      process.exit(1);
    }
    
    console.log(`Found ${streams.length} streams. Picking one with a proxy URL.`);
    
    let targetStream = null;
    for (const s of streams) {
      if (s.url && s.url.includes('/api/stream/proxy')) {
        targetStream = s;
        break;
      }
    }
    
    if (!targetStream) {
       console.log('No stream with a proxy URL found.');
       console.log('Sample stream:', streams[0]);
       process.exit(1);
    }
    
    console.log(`Selected stream from ${targetStream.sourceAddon}: ${targetStream.title}`);
    const fullProxyUrl = targetStream.url.startsWith('http') ? targetStream.url : `${API_BASE}${targetStream.url}`;
    console.log(`Full Proxy URL: ${fullProxyUrl}`);
    
    console.log('Testing proxy URL (requesting first 1KB)...');
    try {
      const videoRes = await axios.get(fullProxyUrl, { 
        responseType: 'stream',
        headers: { Range: 'bytes=0-1023' },
        timeout: 10000
      });
      
      console.log('Status Code:', videoRes.status);
      console.log('Content-Type:', videoRes.headers['content-type']);
      console.log('Content-Length:', videoRes.headers['content-length']);
      console.log('Content-Range:', videoRes.headers['content-range']);
      console.log('Access-Control-Allow-Origin:', videoRes.headers['access-control-allow-origin']);
      
      if (videoRes.status === 206 || videoRes.status === 200) {
        console.log('\n✅ Stream verification successful!');
        process.exit(0);
      } else {
        console.log('\n❌ Unexpected status code:', videoRes.status);
        process.exit(1);
      }
    } catch (e) {
      console.log('Error hitting proxy URL:', e.message);
      if (e.response) {
         console.log('Response status:', e.response.status);
         console.log('Response headers:', e.response.headers);
      }
      process.exit(1);
    }
    
  } catch (err) {
    console.error('Error testing streams:', err.message);
    process.exit(1);
  }
}

testVideo();
