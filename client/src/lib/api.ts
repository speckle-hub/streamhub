// API client for StreamHub backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

  async search(query: string, type: string = 'movie', nsfw: boolean = false) {
    const params = new URLSearchParams({ q: query, type, nsfw: String(nsfw) });
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

  async updateProgress(data: any) {
    const res = await fetch(`${API_BASE}/api/user/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getContinueWatching() {
    const res = await fetch(`${API_BASE}/api/user/continue-watching`);
    if (!res.ok) throw new Error('Continue watching fetch failed');
    return res.json();
  },

  async updateWatchlist(contentId: string, type: string, action: 'add' | 'remove') {
    const res = await fetch(`${API_BASE}/api/user/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, type, action }),
    });
    return res.json();
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

  async getNsfwHistory() {
    const res = await fetch(`${API_BASE}/api/nsfw/history`);
    return res.json();
  },

  async clearNsfwHistory() {
    const res = await fetch(`${API_BASE}/api/nsfw/history`, { method: 'DELETE' });
    return res.json();
  },

  getProxiedStreamUrl(token: string) {
    return `${API_BASE}/api/stream/proxy?token=${token}`;
  },
};
