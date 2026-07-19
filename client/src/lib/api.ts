// API client for StreamHub backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

export const api = {
  client: {
    async get(url: string, config: any = {}) {
      const res = await fetch(`${API_BASE}${url}`, {
        ...config,
        method: 'GET',
      });
      return { data: await res.json(), status: res.status, headers: res.headers };
    },
    async post(url: string, body: any, config: any = {}) {
      const res = await fetch(`${API_BASE}${url}`, {
        ...config,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...config.headers },
        body: JSON.stringify(body),
      });
      return { data: await res.json(), status: res.status, headers: res.headers };
    }
  },

  async search(query: string, nsfw: boolean = false) {
    const params = new URLSearchParams({ q: query, nsfw: String(nsfw) });
    const res = await fetch(`${API_BASE}/api/content/search?${params}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async getStreams(type: string, id: string, nsfw: boolean = false) {
    const params = new URLSearchParams({ nsfw: String(nsfw) });
    const res = await fetch(`${API_BASE}/api/content/streams/${type}/${id}?${params}`);
    if (!res.ok) throw new Error('Streams fetch failed');
    return res.json();
  },

  async getHome() {
    const res = await fetch(`${API_BASE}/api/home`);
    if (!res.ok) throw new Error('Home fetch failed');
    return res.json();
  },

  // Category Pages
  async getMovies() {
    const res = await fetch(`${API_BASE}/api/movies`);
    if (!res.ok) throw new Error('Movies fetch failed');
    return res.json();
  },

  async getTVShows() {
    const res = await fetch(`${API_BASE}/api/tv`);
    if (!res.ok) throw new Error('TV fetch failed');
    return res.json();
  },

  async getAnime() {
    const res = await fetch(`${API_BASE}/api/anime`);
    if (!res.ok) throw new Error('Anime fetch failed');
    return res.json();
  },

  async updateProgress(data: any) {
    const res = await fetch(`${API_BASE}/api/user/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getWatchlist() {
    const res = await fetch(`${API_BASE}/api/user/watchlist`);
    if (!res.ok) throw new Error('Watchlist fetch failed');
    return res.json();
  },

  async updateWatchlist(contentId: string, type: string, action: 'add' | 'remove', status: string = 'watch_later', sourceAddon?: string) {
    const res = await fetch(`${API_BASE}/api/user/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, type, action, status, sourceAddon }),
    });
    return res.json();
  },

  // NSFW Hub
  async getNsfwHome() {
    const res = await fetch(`${API_BASE}/api/nsfw/home`);
    if (!res.ok) throw new Error('NSFW home fetch failed');
    return res.json();
  },

  async updateNsfwWatchlist(data: any, action: 'add' | 'remove') {
    if (action === 'add') {
      const res = await fetch(`${API_BASE}/api/nsfw/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    } else {
      const res = await fetch(`${API_BASE}/api/nsfw/watchlist/${data.contentId}`, {
        method: 'DELETE',
      });
      return res.json();
    }
  },

  async updateSettings(settings: any) {
    const res = await fetch(`${API_BASE}/api/user/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async verifyAge(confirmed: boolean) {
    const res = await fetch(`${API_BASE}/api/user/verify-age`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed }),
    });
    return res.json();
  },

  async verifyPin(pin: string) {
    const res = await fetch(`${API_BASE}/api/user/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    return res.json();
  },

  getProxiedStreamUrl(token: string) {
    return `${API_BASE}/api/stream/proxy?token=${token}`;
  },
};
