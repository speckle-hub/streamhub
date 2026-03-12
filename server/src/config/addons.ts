export const ADDONS: Record<string, { url: string; enabled: boolean; priority: number; nsfw?: boolean }> = {
  cinemata: {
    url: 'https://cinemata-stremio.addons.workers.dev/manifest.json',
    enabled: true,
    priority: 0,
  },
  mediafusion: {
    url: 'https://mediafusion.elfhosted.com/manifest.json',
    enabled: true,
    priority: 1,
  },
  webstreamr: { 
    url: 'https://webstreamr.hayd.uk/manifest.json', 
    enabled: true, 
    priority: 2 
  },
  autostream: { 
    url: 'https://autostreamtest.onrender.com/manifest.json', 
    enabled: true, 
    priority: 3 
  },
  streamvix: { 
    url: 'https://streamvix.hayd.uk/manifest.json', 
    enabled: true, 
    priority: 2 
  },
  notorrent: { 
    url: 'https://addon-osvh.onrender.com/manifest.json', 
    enabled: true, 
    priority: 1 
  },
  tstream: { 
    url: 'https://tstrm.org/manifest.json', 
    enabled: true, 
    priority: 3 
  },
  stremify: { 
    url: 'https://stremify.elfhosted.com/manifest.json', 
    enabled: true, 
    priority: 1 
  },
  nodebrid: { 
    url: 'https://nodebrid.fly.dev/manifest.json', 
    enabled: true, 
    priority: 2 
  },
  animestream: { 
    url: 'https://animestream-addon.keypop3750.workers.dev/manifest.json', 
    enabled: true, 
    priority: 2 
  },
  
  // NSFW Addons
  porntube: { 
    url: 'https://dirty-pink.ers.pw/manifest.json', 
    enabled: true, 
    nsfw: true, 
    priority: 1 
  },
  onlyporn: { 
    url: 'https://07b88951aaab-jaxxx-v2.baby-beamup.club/manifest.json', 
    enabled: true, 
    nsfw: true, 
    priority: 1 
  },
  xxxclub: { 
    url: 'https://xclub-stremio.vercel.app/manifest.json', 
    enabled: true, 
    nsfw: true, 
    priority: 1 
  },
  hianime: { 
    url: 'https://streamio-hianime.onrender.com/manifest.json', 
    enabled: true, 
    nsfw: true, 
    priority: 1 
  },
  hentaistream: { 
    url: 'https://hentaistream-addon.keypop3750.workers.dev/manifest.json', 
    enabled: true, 
    nsfw: true, 
    priority: 1 
  },
  hanime: { 
    url: 'https://hanime-stremio.fly.dev/manifest.json', 
    enabled: true, 
    nsfw: true, 
    priority: 1 
  },
};
