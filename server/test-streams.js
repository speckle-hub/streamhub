const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:3001/api/content/streams/movie/tt1375666', { timeout: 30000 });
    console.log('Status:', res.status);
    const streams = res.data.streams || [];
    console.log(`Received ${streams.length} stream sources for Inception.`);
    
    if (streams.length > 0) {
      console.log('Sample streams:');
      streams.slice(0, 3).forEach(s => {
        console.log(`- ${s.name}: ${s.title?.split('\n')[0] || s.title} [Quality: ${s.quality}]`);
      });
      
      const distinctAddons = new Set(streams.map(s => s.sourceAddon));
      console.log('Addons that provided streams:', Array.from(distinctAddons).join(', '));
    }
    process.exit(0);
  } catch (err) {
    console.error('Error testing streams:', err.message);
    process.exit(1);
  }
}

test();
