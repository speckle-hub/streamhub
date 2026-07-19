const http = require('http');

setTimeout(() => {
  http.get('http://localhost:3001/api/content/search?q=inception&type=movie', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const json = JSON.parse(data);
        console.log(`Received ${json?.metas?.length || 0} results for Inception.`);
        if (json?.metas?.length > 0) {
          console.log('Sample result sourceAddon:', json.metas[0].sourceAddon);
        }
      } catch(e) {
        console.log('Response:', data.substring(0, 500));
      }
    });
  }).on('error', err => console.log('Error:', err.message));
}, 3000); // give server time to boot
