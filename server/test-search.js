const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:3001/api/content/search?q=inception', { timeout: 30000 });
    console.log('Status:', res.status);
    const metas = res.data.metas || [];
    console.log(`Received ${metas.length} results for Inception.`);
    
    if (metas.length > 0) {
      console.log('Sample result name:', metas[0].name);
      console.log('Sample result addon:', metas[0].sourceAddon);
      
      const distinctAddons = new Set(metas.map(m => m.sourceAddon));
      console.log('Addons that returned results:', Array.from(distinctAddons).join(', '));
    } else {
      console.log('No results found.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error testing search:', err.message);
    process.exit(1);
  }
}

test();
