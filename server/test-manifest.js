const axios = require('axios');

const urls = [
  'https://mediafusion.elfhosted.com/manifest.json',
  'https://stremify.elfhosted.com/manifest.json',
  'https://tstrm.org/manifest.json'
];

async function test() {
  for (const url of urls) {
    try {
      const res = await axios.get(url);
      const catalogs = res.data.catalogs || [];
      console.log(`\n--- ${url} ---`);
      console.log(`Log ${catalogs.length} catalogs:`);
      catalogs.slice(0, 3).forEach(c => {
        console.log(`Type: ${c.type}, Id: ${c.id}, Extra: ${JSON.stringify(c.extra)}`);
      });
    } catch(e) { console.error(`Error for ${url}:`, e.message); }
  }
}
test();
