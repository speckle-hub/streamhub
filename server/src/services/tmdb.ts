import axios from 'axios';
import { cache } from './cache';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

export interface TMDBMovie {
  id: string;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  runtime?: number;
  credits?: {
    cast: { name: string; character: string; profile_path: string }[];
  };
}

export class TMDBService {
  private isKeyValid(): boolean {
    return !!API_KEY && API_KEY !== 'your_tmdb_api_key_here';
  }

  async getMovieDetails(imdbId: string): Promise<any> {
    if (!this.isKeyValid()) {
      console.warn('TMDB_API_KEY not set, using mock data');
      return this.getMockMovieDetails(imdbId);
    }

    const cacheKey = `tmdb:meta:${imdbId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      // 1. Find the TMDB ID from the IMDB ID
      const findRes = await axios.get(`${TMDB_BASE}/find/${imdbId}`, {
        params: {
          api_key: API_KEY,
          external_source: 'imdb_id',
        },
      });

      const movie = findRes.data.movie_results?.[0];
      const tv = findRes.data.tv_results?.[0];
      
      if (!movie && !tv) return this.getMockMovieDetails(imdbId);

      const type = movie ? 'movie' : 'tv';
      const tmdbId = movie ? movie.id : tv.id;

      // 2. Get full details + credits
      const detailsRes = await axios.get(`${TMDB_BASE}/${type}/${tmdbId}`, {
        params: {
          api_key: API_KEY,
          append_to_response: 'credits,videos,recommendations',
        },
      });

      const result = {
        ...detailsRes.data,
        type,
        external_id: imdbId
      };

      await cache.set(cacheKey, JSON.stringify(result), 86400); // 24h cache
      return result;
    } catch (err: any) {
      console.error('TMDB API Error:', err.message);
      return this.getMockMovieDetails(imdbId);
    }
  }

  async getTrending(type: 'movie' | 'tv' = 'movie', timeWindow: 'day' | 'week' = 'week'): Promise<any[]> {
    if (!this.isKeyValid()) return [];

    const cacheKey = `tmdb:trending:${type}:${timeWindow}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
      console.log(`[TMDB] Fetching trending ${type}/${timeWindow}`);
      const res = await axios.get(`${TMDB_BASE}/trending/${type}/${timeWindow}`, {
        params: { api_key: API_KEY },
      });
      const results = res.data.results || [];
      await cache.set(cacheKey, JSON.stringify(results), 21600);
      return results;
    } catch (err: any) {
      console.error(`[TMDB] Trending Error for ${type}:`, err.response?.status, err.message);
      return [];
    }
  }

  getPosterUrl(path: string, size: 'w342' | 'w780' | 'original' = 'w780'): string {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  private getMockMovieDetails(imdbId: string) {
    return {
      id: imdbId,
      external_id: imdbId,
      title: 'Meta Data Loading...',
      overview: 'Full metadata will be available once a valid TMDB API key is configured.',
      poster_path: '/placeholder.jpg',
      backdrop_path: '/placeholder-bg.jpg',
      release_date: '2024-01-01',
      vote_average: 0,
      genres: [],
      mock: true
    };
  }
}

export const tmdb = new TMDBService();
