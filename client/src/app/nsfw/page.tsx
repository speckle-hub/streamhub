'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import MediaCard from '@/components/MediaCard';
import DetailModal from '@/components/DetailModal';
import { useSettingsStore } from '@/store/settings';
import { useSearchStore } from '@/store';
import styles from '../page.module.css'; // Reuse main layout styles
import nsfwStyles from './nsfw.module.css';

export default function NsfwPage() {
  const router = useRouter();
  const [selectedMeta, setSelectedMeta] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'adult' | 'hentai'>('adult');
  const { settings } = useSettingsStore();

  const { data: nsfwData, isLoading } = useQuery({
    queryKey: ['nsfw-home'],
    queryFn: () => api.getNsfwHome(),
  });

  const handleSelect = (id: string, type: string, sourceAddon?: string) => {
    setSelectedMeta({ id, type, name: 'Loading...', sourceAddon });
  };

  if (isLoading) {
    return (
      <main className={`${styles.main} ${settings.blurNsfw ? nsfwStyles.blurEnabled : ''}`}>
        <div className={styles.loadingWrap}>
          <div className={styles.loader} />
        </div>
      </main>
    );
  }

  // Determine which featured hero to show based on active tab
  const hero = activeTab === 'adult' 
    ? nsfwData?.adult?.[0] 
    : nsfwData?.hentai?.[0];

  const currentTrending = activeTab === 'adult' ? nsfwData?.adult : nsfwData?.hentai;

  return (
    <main className={`${styles.main} ${settings.blurNsfw ? nsfwStyles.blurEnabled : ''}`}>
      {/* NSFW Header specific extensions */}
      <div className={nsfwStyles.nsfwSubNav}>
        <div className={nsfwStyles.tabs}>
          <button 
            className={`${nsfwStyles.tab} ${activeTab === 'adult' ? nsfwStyles.activeTab : ''}`}
            onClick={() => setActiveTab('adult')}
          >
            Adult Center
          </button>
          <button 
            className={`${nsfwStyles.tab} ${activeTab === 'hentai' ? nsfwStyles.activeTab : ''}`}
            onClick={() => setActiveTab('hentai')}
          >
            Hentai Hub
          </button>
        </div>
        <div className={nsfwStyles.nsfwWarning}>
          ⚠️ 18+ ISOLATED ZONE
        </div>
      </div>

      {/* Hero */}
      {hero && (
        <section className={styles.hero} style={{ backgroundImage: `url(${hero.poster})` }}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>NSFW TRENDING #1</div>
            <h1 className={styles.heroTitle}>{hero.name}</h1>
            <p className={styles.heroDesc}>Explore premium 18+ content from selected adult sources.</p>
            <div className={styles.heroActions}>
              <button 
                className={styles.heroPlayBtn} 
                onClick={() => handleSelect(hero.id, hero.type, hero.sourceAddon)}
              >
                ▶ Watch Now
              </button>
            </div>
          </div>
          <div className={styles.heroOverlay} />
        </section>
      )}

      <div className={styles.contentWrap}>
        
        {/* Watchlist Section - Always visible, applies to both adult and hentai */}
        {nsfwData?.watchlist?.continue?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Continue Watching</h2>
            <div className={styles.horizontalScroll}>
              {nsfwData.watchlist.continue.map((item: any) => (
                <MediaCard
                  key={item.contentId}
                  meta={{
                    id: item.contentId,
                    type: item.type,
                    name: item.title,
                    poster: 'https://via.placeholder.com/342x513?text=Adult+Content', // Hide explicit posters in history
                    progress: item.progress
                  }}
                  onClick={() => handleSelect(item.contentId, item.type)}
                />
              ))}
            </div>
          </section>
        )}

        {nsfwData?.watchlist?.all?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>NSFW Watchlist</h2>
            <div className={styles.horizontalScroll}>
              {nsfwData.watchlist.all.map((item: any) => (
                <MediaCard
                  key={item.id}
                  meta={{
                    id: item.contentId,
                    type: item.contentType,
                    name: item.title || 'Unknown',
                    poster: item.poster,
                    sourceAddon: item.sourceAddon
                  }}
                  onClick={() => handleSelect(item.contentId, item.contentType, item.sourceAddon)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Tab-specific Content */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Trending {activeTab === 'adult' ? 'Adult' : 'Hentai'}
          </h2>
          <div className={styles.horizontalScroll}>
            {currentTrending?.map((item: any) => (
              <MediaCard
                key={item.id}
                meta={{
                  ...item,
                  progress: 0
                }}
                onClick={() => handleSelect(item.id, item.type, item.sourceAddon)}
              />
            ))}
          </div>
        </section>
      </div>

      {selectedMeta && (
        <DetailModal
          meta={selectedMeta}
          onClose={() => setSelectedMeta(null)}
          isNsfwMode={true}
        />
      )}
    </main>
  );
}
