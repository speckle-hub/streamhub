import axios from 'axios';
import { ADDONS } from '../config/addons';
import { cache } from './cache';
import { createToken } from './tokens';

export interface StreamSource {
  name: string;
  url: string;
  quality?: string;
  size?: string;
  debridRequired?: boolean;
  addon: string;
}

export class AddonProxy {
  async fetchManifest(addonId: string): Promise<any> {
    const addon = ADDONS[addonId];
    if (!addon) throw new Error(`Unknown addon: ${addonId}`);
    
    const cacheKey = `manifest:v2:${addonId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    try {
      const response = await axios.get(addon.url, { 
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
      });
      await cache.set(cacheKey, JSON.stringify(response.data), 86400); // 24h
      return response.data;
    } catch (err: any) {
      console.error(`[AddonProxy] Failed to fetch manifest for ${addonId}:`, err.message);
      throw err;
    }
  }
  
  async fetchCatalog(addonId: string, type: string, catalogId: string, extra?: string): Promise<any> {
    const manifest = await this.fetchManifest(addonId);
    const addonConfig = ADDONS[addonId];
    
    let url = '';
    const baseUrl = addonConfig.url.replace('/manifest.json', '');
    
    if (extra) {
       url = `${baseUrl}/catalog/${type}/${catalogId}/${extra}.json`;
    } else {
       url = `${baseUrl}/catalog/${type}/${catalogId}.json`;
    }
    
    const cacheKey = `catalog:v2:${addonId}:${type}:${catalogId}:${extra || 'none'}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const response = await axios.get(url, { 
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      await cache.set(cacheKey, JSON.stringify(response.data), parseInt(process.env.CACHE_TTL_CATALOG || '3600'));
      return response.data;
    } catch (err: any) {
      console.error(`[AddonProxy] Failed to fetch catalog for ${addonId} (${url}):`, err.message);
      return { metas: [] };
    }
  }

  async fetchMeta(addonId: string, type: string, id: string): Promise<any> {
    const addonConfig = ADDONS[addonId];
    const baseUrl = addonConfig.url.replace('/manifest.json', '');
    const url = `${baseUrl}/meta/${type}/${id}.json`;

    const cacheKey = `meta:v2:${addonId}:${type}:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      const response = await axios.get(url, { timeout: 10000 });
      await cache.set(cacheKey, JSON.stringify(response.data), 86400);
      return response.data;
    } catch (err: any) {
      console.error(`[AddonProxy] Failed to fetch meta for ${addonId} (${id}):`, err.message);
      return { meta: null };
    }
  }
  
  async fetchStreams(addonId: string, type: string, id: string): Promise<StreamSource[]> {
    const addonConfig = ADDONS[addonId];
    if (!addonConfig) return [];
    
    const cacheKey = `stream:v2:${addonId}:${type}:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const baseUrl = addonConfig.url.replace('/manifest.json', '');
    const streamUrl = `${baseUrl}/stream/${type}/${id}.json`;
    
    try {
      const response = await axios.get(streamUrl, { timeout: 15000 });
      const streams = (response.data.streams || []).map((s: any) => ({
        name: s.name || s.title || `${addonId} Source`,
        url: this.createProxiedUrl(s.url, addonId, s.infoHash),
        quality: this.extractQuality(s.name || s.title || ''),
        size: s.behaviorHints?.videoSize ? this.formatSize(s.behaviorHints.videoSize) : undefined,
        debridRequired: s.url?.includes('real-debrid') || s.url?.includes('alldebrid') || s.url?.includes('premiumize'),
        addon: addonId,
      }));
      
      await cache.set(cacheKey, JSON.stringify(streams), parseInt(process.env.CACHE_TTL_STREAM || '900'));
      return streams;
    } catch (err: any) {
      console.error(`[AddonProxy] Failed to fetch streams for ${addonId}:`, err.message);
      return [];
    }
  }
  
  private createProxiedUrl(url: string | undefined, addonId: string, infoHash?: string): string {
    if (!url && !infoHash) return '';
    // If it's an infoHash, we might need special handling for debrid later
    // but for now, we proxy anything that has a URL
    if (url) {
      const token = createToken(url, addonId);
      return `/api/stream/proxy?token=${token}`;
    }
    return ''; // Todo: handle magnet/infoHash if needed
  }
  
  private extractQuality(name: string): string | undefined {
    const match = name.match(/(4K|2160p|1080p|720p|480p)/i);
    return match?.[1];
  }
  
  private formatSize(bytes: number): string {
    if (bytes === 0) return 'Unknown';
    const gb = bytes / 1024 / 1024 / 1024;
    return `${gb.toFixed(1)} GB`;
  }
}

export const addonProxy = new AddonProxy();
