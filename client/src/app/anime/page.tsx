'use client';
import CategoryLayout from '@/components/CategoryLayout';
import { api } from '@/lib/api';

export default function AnimePage() {
  return (
    <CategoryLayout 
      title="Anime" 
      queryKey="anime" 
      fetchFn={() => api.getAnime()} 
    />
  );
}
