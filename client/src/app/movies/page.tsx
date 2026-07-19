'use client';
import CategoryLayout from '@/components/CategoryLayout';
import { api } from '@/lib/api';

export default function MoviesPage() {
  return (
    <CategoryLayout 
      title="Movies" 
      queryKey="movies" 
      fetchFn={() => api.getMovies()} 
    />
  );
}
