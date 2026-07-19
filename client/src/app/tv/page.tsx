'use client';
import CategoryLayout from '@/components/CategoryLayout';
import { api } from '@/lib/api';

export default function TVPage() {
  return (
    <CategoryLayout 
      title="TV Shows" 
      queryKey="tv" 
      fetchFn={() => api.getTVShows()} 
    />
  );
}
