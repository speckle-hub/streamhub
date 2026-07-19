import { useEffect, useRef } from 'react';
import { api } from '../lib/api';

interface ProgressData {
  contentId: string;
  type: 'movie' | 'tv';
  position: number;
  duration: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
}

export function useProgress(data: ProgressData | null, isActive: boolean) {
  const lastSavedRef = useRef<number>(0);
  const dataRef = useRef<ProgressData | null>(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!isActive || !data) return;

    const saveProgress = async () => {
      const current = dataRef.current;
      if (!current) return;

      // Avoid double saving same position
      if (current.position === lastSavedRef.current) return;

      try {
        await api.updateProgress(current);
        lastSavedRef.current = current.position;
      } catch (err) {
        console.error('Failed to auto-save progress:', err);
      }
    };

    // Auto-save every 10 seconds
    const interval = setInterval(saveProgress, 10000);

    // Save on unmount or when inactive
    return () => {
      clearInterval(interval);
      saveProgress();
    };
  }, [isActive, !!data]);
}
