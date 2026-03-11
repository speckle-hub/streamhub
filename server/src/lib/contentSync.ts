import { prisma } from '../lib/prisma';
import { tmdb } from '../services/tmdb';

export async function ensureContent(contentId: string, type: 'movie' | 'tv') {
  // Check if exists
  const existing = await prisma.content.findUnique({
    where: { id: contentId }
  });

  if (existing) return existing;

  // Not in DB, fetch from TMDB and cache it
  const imdbId = contentId.startsWith('tt') ? contentId : null;
  if (!imdbId) return null;

  try {
    const meta = await tmdb.getMovieDetails(imdbId);
    if (!meta || meta.mock) return null;

    return await prisma.content.create({
      data: {
        id: contentId,
        type: type,
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
  } catch (err) {
    console.error('Failed to ensure content in DB:', err);
    return null;
  }
}
