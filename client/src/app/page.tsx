'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import DetailModal from '@/components/DetailModal';
import MediaCard from '@/components/MediaCard';
import styles from './page.module.css';

export default function HomePage() {
  const [selectedMeta, setSelectedMeta] = useState<any>(null);

  const { data: homeData, isLoading, error, refetch } = useQuery({
    queryKey: ['home'],
    queryFn: () => api.getHome(),
    refetchInterval: 60000,
    retry: 2,
  });

  const handleSelect = (id: string, type: string) => {
    setSelectedMeta({ id, type, name: 'Loading...' });
  };

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.loader} />
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.5)' }}>Loading your entertainment...</p>
      </div>
    );
  }

  if (error || (!homeData?.hero && !homeData?.rows?.length)) {
    return (
      <div className={styles.loadingWrap} style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>⚠️ Content failed to load</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
          {error ? (error as any).message : "Check your internet connection or Cinemata API status."}
        </p>
        <button 
          onClick={() => refetch()}
          style={{
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const hero = homeData?.hero;
  const rows = homeData?.rows || [];

  return (
    <main className={styles.main}>
      {/* Hero */}
      {hero && (
        <section className={styles.hero} style={{ backgroundImage: `url(${hero.poster})` }}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>TRENDING #1</div>
            <h1 className={styles.heroTitle}>{hero.name}</h1>
            <p className={styles.heroDesc}>
              {hero.description || 'Access millions of movies, TV shows, and anime instantly. All your favorites, one unified experience.'}
            </p>
            <div className={styles.heroActions}>
              <button className={styles.heroPlayBtn} onClick={() => handleSelect(hero.id, hero.type)}>
                ▶ Watch Now
              </button>
            </div>
          </div>
          <div className={styles.heroOverlay} />
        </section>
      )}

      {/* Dynamic Content Sections */}
      <div className={styles.contentWrap}>
        {rows.map((row: any, idx: number) => (
          row.items?.length > 0 && (
            <section key={idx} className={styles.section}>
              <h2 className={styles.sectionTitle}>{row.title}</h2>
              <div className={styles.horizontalScroll}>
                {row.items.map((item: any) => (
                  <MediaCard
                    key={item.id || item.contentId}
                    meta={{
                      id: item.id || item.contentId,
                      type: item.type,
                      name: item.name || item.title,
                      poster: item.poster || item.posterPath,
                      imdbRating: item.imdbRating,
                      year: item.year,
                      progress: item.progress
                    }}
                    onClick={() => handleSelect(item.id || item.contentId, item.type)}
                  />
                ))}
              </div>
            </section>
          )
        ))}
      </div>

      {/* Local Detail Modal Trigger (Optional, layout already has one but local control is fine) */}
      {selectedMeta && (
        <DetailModal
          meta={selectedMeta}
          onClose={() => setSelectedMeta(null)}
        />
      )}
    </main>
  );
}
