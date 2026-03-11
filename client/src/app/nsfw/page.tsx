'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import MediaCard from '@/components/MediaCard';
import DetailModal from '@/components/DetailModal';
import { useSearchStore } from '@/store';
import { useSettingsStore } from '@/store/settings';
import styles from './nsfw.module.css';

export default function NsfwPage() {
  const router = useRouter();
  const [selectedMeta, setSelectedMeta] = useState<any>(null);
  const [query, setQuery] = useState('');
  const { openSearch } = useSearchStore();
  const { settings } = useSettingsStore();

  const { data: results, isLoading } = useQuery({
    queryKey: ['nsfw-search', query],
    queryFn: () => api.client.get(`/api/nsfw/search?q=${query}`).then(res => res.data),
    enabled: query.length > 2,
  });

  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ['nsfw-history'],
    queryFn: () => api.getNsfwHistory(),
  });

  useEffect(() => {
    if (settings.autoClearHistory === 'session') {
      const handleUnload = () => {
        navigator.sendBeacon(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/nsfw/history`);
      };
      window.addEventListener('beforeunload', handleUnload);
      return () => window.removeEventListener('beforeunload', handleUnload);
    }
  }, [settings.autoClearHistory]);

  const handleClearHistory = async () => {
    if (confirm('Clear all NSFW history?')) {
      await api.clearNsfwHistory();
      refetchHistory();
    }
  };

  return (
    <main className={`${styles.main} ${settings.blurNsfw ? styles.blurEnabled : ''}`}>
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => window.location.href = '/'}>
          <span className={styles.logoIcon}>🔞</span>
          <span>NSFW Section</span>
        </div>
        <div className={styles.searchBar}>
          <input 
            type="text" 
            placeholder="Search adult content..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button className={styles.clearBtn} onClick={handleClearHistory}>
          Clear History
        </button>
      </header>

      <div className={styles.content}>
        {query.length <= 2 ? (
          <div className={styles.historySection}>
            <h2 className={styles.sectionTitle}>NSFW History</h2>
            {history?.length > 0 ? (
              <div className={styles.grid}>
                {history.map((item: any) => (
                  <MediaCard
                    key={item.id}
                    meta={{
                      id: item.contentId,
                      type: item.contentType,
                      name: item.title,
                      poster: 'https://via.placeholder.com/342x513?text=Adult+History',
                    }}
                    onClick={() => setSelectedMeta(item)}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <h2>No History</h2>
                <p>Your isolated NSFW watch history will appear here.</p>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className={styles.loading}>Searching...</div>
        ) : results?.length > 0 ? (
          <div className={styles.grid}>
            {results.map((item: any) => (
              <MediaCard
                key={item.id}
                meta={{
                  id: item.id,
                  type: item.type,
                  name: item.title,
                  poster: item.posterPath,
                }}
                onClick={() => setSelectedMeta(item)}
              />
            ))}
          </div>
        ) : (
          <div className={styles.noResults}>No adult content found for "{query}"</div>
        )}
      </div>

      {selectedMeta && (
        <DetailModal
          meta={selectedMeta}
          onClose={() => setSelectedMeta(null)}
        />
      )}
    </main>
  );
}
