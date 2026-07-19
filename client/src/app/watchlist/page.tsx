'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import MediaCard from '@/components/MediaCard';
import DetailModal from '@/components/DetailModal';
import styles from '../page.module.css';

export default function WatchlistPage() {
  const [selectedMeta, setSelectedMeta] = useState<any>(null);

  const { data: watchlistData, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.getWatchlist(),
  });

  const handleSelect = (id: string, type: string) => {
    setSelectedMeta({ id, type, name: 'Loading...' });
  };

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loader} />
      </div>
    );
  }

  const sections = [
    { title: 'Currently Watching', items: watchlistData?.watching || [] },
    { title: 'Watch Later', items: watchlistData?.watch_later || [] },
    { title: 'Finished', items: watchlistData?.finished || [] },
  ];

  const isEmpty = sections.every(s => s.items.length === 0);

  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Your Watchlist</h1>
        <p className={styles.pageSubtitle}>Keep track of everything you're watching across all sources.</p>
      </header>

      <div className={styles.contentWrap}>
        {isEmpty ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔖</div>
            <h3>Your watchlist is empty</h3>
            <p>Start exploring and add some content to watch later!</p>
          </div>
        ) : (
          sections.map((section, idx) => (
            section.items.length > 0 && (
              <section key={idx} className={styles.section}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <div className={styles.horizontalScroll}>
                  {section.items.map((item: any) => (
                    <MediaCard
                      key={item.id}
                      meta={{
                        id: item.id,
                        type: item.type,
                        name: item.title,
                        poster: item.posterPath,
                        imdbRating: item.rating,
                        year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined
                      }}
                      onClick={() => handleSelect(item.id, item.type)}
                    />
                  ))}
                </div>
              </section>
            )
          ))
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
