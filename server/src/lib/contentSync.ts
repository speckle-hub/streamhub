import { prisma } from '../lib/prisma';
import { tmdb } from '../services/tmdb';
import { addonProxy } from '../services/addonProxy';

export async function ensureContent(contentId: string, type: 'movie' | 'tv' | 'anime') {
  // Check if exists
  const existing = await prisma.content.findUnique({
    where: { id: contentId }
  });

  if (existing) return existing;

  // Not in DB, try TMDB first if it looks like an IMDB or TMDB ID
  const imdbId = contentId.startsWith('tt') ? contentId : null;
  
  try {
    if (imdbId) {
      const meta = await tmdb.getMovieDetails(imdbId);
      if (meta && !meta.mock) {
        return await prisma.content.create({
          data: {
            id: contentId,
            type: type === 'anime' ? 'movie' : type, // Keep base type
            title: meta.title || meta.name || 'Unknown Title',
            overview: meta.overview,
            posterPath: meta.poster_path,
            backdropPath: meta.backdrop_path,
            releaseDate: meta.release_date ? new Date(meta.release_date) : null,
            rating: meta.vote_average,
            genres: JSON.stringify(meta.genres?.map((g: any) => g.name) || []) as any,
            episodeRunTime: JSON.stringify(meta.episode_run_time || []) as any
          }
        });
      }
    }

    // Fallback: Fetch from Cinemata if TMDB fails or it's a specific cinemata ID
    const cinemataMeta = await addonProxy.fetchMeta('cinemata', type === 'tv' ? 'series' : 'movie', contentId);
    if (cinemataMeta && cinemataMeta.meta) {
      const m = cinemataMeta.meta;
      return await prisma.content.create({
        data: {
          id: contentId,
          type: type === 'anime' ? 'movie' : type,
          title: m.name || 'Unknown Title',
          overview: m.description,
          posterPath: m.poster,
          backdropPath: m.background,
          releaseDate: m.year ? new Date(m.year) : null,
          rating: parseFloat(m.imdbRating) || 0,
          genres: JSON.stringify(m.genres || []) as any,
          episodeRunTime: "[]"
        }
      });
    }

    return null;
  } catch (err) {
    console.error('Failed to ensure content in DB:', err);
    return null;
  }
}
