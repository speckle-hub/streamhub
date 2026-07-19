'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MediaCard from './MediaCard';
import DetailModal from './DetailModal';
import styles from '../app/page.module.css';

interface CategoryLayoutProps {
  title: string;
  queryKey: string;
  fetchFn: () => Promise<any>;
}

export default function CategoryLayout({ title, queryKey, fetchFn }: CategoryLayoutProps) {
  const [selectedMeta, setSelectedMeta] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: fetchFn,
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

  const hero = data?.hero;
  const rows = data?.rows || [];

  return (
    <div className={styles.categoryRoot}>
      {/* Hero */}
      {hero && (
        <section className={styles.hero} style={{ backgroundImage: `url(${hero.poster})` }}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>FEATURED {title.toUpperCase()}</div>
            <h1 className={styles.heroTitle}>{hero.name}</h1>
            <p className={styles.heroDesc}>{hero.description || `Explore the best of ${title} on StreamHub.`}</p>
            <div className={styles.heroActions}>
              <button 
                className={styles.heroPlayBtn} 
                onClick={() => handleSelect(hero.id, hero.type)}
              >
                ▶ Watch Now
              </button>
            </div>
          </div>
        </section>
      )}

      <div className={styles.contentWrap}>
        {rows.map((row: any, idx: number) => (
          row.items?.length > 0 && (
            <section key={idx} className={styles.section}>
              <h2 className={styles.sectionTitle}>{row.title}</h2>
              <div className={styles.horizontalScroll}>
                {row.items.map((item: any) => (
                  <MediaCard
                    key={item.id}
                    meta={item}
                    onClick={() => handleSelect(item.id, item.type)}
                  />
                ))}
              </div>
            </section>
          )
        ))}
      </div>

      {selectedMeta && (
        <DetailModal
          meta={selectedMeta}
          onClose={() => setSelectedMeta(null)}
        />
      )}
    </div>
  );
}
