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
    if (!addon) throw new Error('Unknown addon');
    
    const cacheKey = `manifest:${addonId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await axios.get(addon.url, { timeout: 10000 });
      await cache.set(cacheKey, response.data, 3600);
      return response.data;
    } catch (err: any) {
      console.error(`Failed to fetch manifest for ${addonId}:`, err.message);
      throw err;
    }
  }
  
  async fetchCatalog(addonId: string, type: string, id: string, extra?: string): Promise<any> {
    const manifest = await this.fetchManifest(addonId);
    
    // Find the right catalog from capabilities
    let catalog;
    if (extra && extra.startsWith('search=')) {
      catalog = manifest.catalogs?.find((c: any) => c.type === type && c.extraSupported?.includes('search'));
    }
    if (!catalog) {
      catalog = manifest.catalogs?.find((c: any) => c.type === type && c.id === id);
    }
    if (!catalog && manifest.catalogs?.length > 0) {
      // Fallback: pick the first catalog of this type if it supports search
      catalog = manifest.catalogs.find((c: any) => c.type === type);
    }

    if (!catalog) return { metas: [] };
    
    let url = '';
    
    if (extra && catalog.extraSupported && catalog.extraSupported.includes(extra.split('=')[0])) {
       // Typically catalogs have URLs like https://addon.com/catalog/movie/search/search=inception.json
       const baseUrl = ADDONS[addonId].url.replace('/manifest.json', '');
       url = `${baseUrl}/catalog/${type}/${catalog.id}/${extra}.json`;
    } else {
       const baseUrl = ADDONS[addonId].url.replace('/manifest.json', '');
       url = `${baseUrl}/catalog/${type}/${catalog.id}.json`;
    }
    
    const cacheKey = `catalog:${addonId}:${type}:${id}:${extra || 'none'}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(url, { timeout: 10000 });
      await cache.set(cacheKey, response.data, parseInt(process.env.CACHE_TTL_CATALOG || '3600'));
      return response.data;
    } catch (err: any) {
      console.error(`Failed to fetch catalog for ${addonId}:`, err.message);
      return { metas: [] };
    }
  }
  
  async fetchStreams(addonId: string, type: string, id: string): Promise<StreamSource[]> {
    const manifest = await this.fetchManifest(addonId);
    const streamResource = manifest.resources?.find((r: any) => 
      r.name === 'stream' || (typeof r === 'string' && r === 'stream')
    );
    if (!streamResource) return [];
    
    const cacheKey = `stream:${addonId}:${type}:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Construct stream URL from manifest base
    const baseUrl = ADDONS[addonId].url.replace('/manifest.json', '');
    const streamUrl = `${baseUrl}/stream/${type}/${id}.json`;
    
    try {
      const response = await axios.get(streamUrl, { timeout: 15000 });
      const streams = (response.data.streams || []).map((s: any) => ({
        name: s.name || s.title || `${addonId} Source`,
        url: this.createProxiedUrl(s.url, addonId),
        quality: this.extractQuality(s.name || s.title || ''),
        size: s.behaviorHints?.videoSize ? this.formatSize(s.behaviorHints.videoSize) : undefined,
        debridRequired: s.url?.includes('real-debrid') || s.url?.includes('alldebrid') || s.url?.includes('premiumize'),
        addon: addonId,
      }));
      
      await cache.set(cacheKey, streams, parseInt(process.env.CACHE_TTL_STREAM || '900'));
      return streams;
    } catch (err: any) {
      console.error(`Failed to fetch streams for ${addonId}:`, err.message);
      return [];
    }
  }
  
  private createProxiedUrl(originalUrl: string, addonId: string): string {
    if (!originalUrl) return '';
    // Create signed JWT token that maps to real URL server-side
    const token = createToken(originalUrl, addonId);
    return `/api/stream/proxy?token=${token}`;
  }
  
  private extractQuality(name: string): string | undefined {
    const match = name.match(/(4K|2160p|1080p|720p|480p)/i);
    return match?.[1];
  }
  
  private formatSize(bytes: number): string {
    const gb = bytes / 1024 / 1024 / 1024;
    return `${gb.toFixed(1)} GB`;
  }
}
