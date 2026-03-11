'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useSearchStore } from '@/store';
import { api } from '@/lib/api';
import SearchOverlay from '@/components/SearchOverlay';
import DetailModal from '@/components/DetailModal';
import ContinueWatching from '@/components/ContinueWatching';
import MediaCard from '@/components/MediaCard';
import SettingsModal from '@/components/SettingsModal';
import AgeGate from '@/components/AgeGate';
import { useSettingsStore } from '@/store/settings';
import styles from './page.module.css';

export default function HomePage() {
  const router = useRouter();
  const [selectedMeta, setSelectedMeta] = useState<any>(null);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const { openSearch } = useSearchStore();
  const { openSettings, ageVerified } = useSettingsStore();

  const handleNsfwClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (ageVerified) {
      router.push('/nsfw');
    } else {
      setShowAgeGate(true);
    }
  };

  const { data: homeData, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: () => api.getHome(),
    refetchInterval: 60000, // Refresh every minute
  });

  const handleSelect = (id: string, type: string) => {
    setSelectedMeta({ id, type, name: 'Loading...' }); // Partial meta to trigger modal
  };

  return (
    <main className={styles.main}>
      {/* Header / Nav */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>▶</span>
          <span>StreamHub</span>
        </div>
        <nav className={styles.nav}>
          <a href="#" className={styles.navLink}>Home</a>
          <a href="#" className={styles.navLink}>Movies</a>
          <a href="#" className={styles.navLink}>TV Shows</a>
          <a href="#" className={styles.navLink}>Anime</a>
          <a href="/nsfw" className={`${styles.navLink} ${styles.nsfwLink}`} onClick={handleNsfwClick}>
            NSFW <span className={styles.nsfwBadge}>18+</span>
          </a>
        </nav>
        <button
          className={styles.searchTrigger}
          onClick={openSearch}
          aria-label="Open search (Ctrl+K)"
        >
          <span className={styles.searchIcon}>⌕</span>
          <span className={styles.searchText}>Search…</span>
          <kbd className={styles.kbd}>⌘K</kbd>
        </button>
        <button 
          className={styles.settingsBtn} 
          onClick={openSettings}
          aria-label="Settings"
        >
          ⚙
        </button>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>TRENDING #1</div>
          <h1 className={styles.heroTitle}>Stream Everything.</h1>
          <p className={styles.heroDesc}>
            Access millions of movies, TV shows, and anime instantly. 
            All your favorites, one unified experience.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.heroPlayBtn} onClick={openSearch}>
              ▶ Start Exploring
            </button>
          </div>
        </div>
        <div className={styles.heroBg} />
      </section>

      {/* Dynamic Content Sections */}
      <div className={styles.contentWrap}>
        {/* Continue Watching */}
        {homeData?.continueWatching?.length > 0 && (
          <ContinueWatching 
            items={homeData.continueWatching} 
            onSelect={handleSelect}
          />
        )}

        {/* Watchlist */}
        {homeData?.watchlist?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Your Watchlist</h2>
            <div className={styles.horizontalScroll}>
              {homeData.watchlist.map((item: any) => (
                <MediaCard
                  key={item.contentId}
                  meta={{
                    id: item.contentId,
                    type: item.content.type,
                    name: item.content.title,
                    poster: item.content.posterPath,
                  }}
                  onClick={() => handleSelect(item.contentId, item.content.type)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Trending */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Trending This Week</h2>
          {isLoading ? (
            <div className={styles.loadingGrid}>
              {[...Array(6)].map((_, i) => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : (
            <div className={styles.mediaGrid}>
              {homeData?.trending?.map((item: any) => (
                <MediaCard
                  key={item.id}
                  meta={{
                    id: item.id,
                    type: item.type,
                    name: item.name || item.title || 'Unknown',
                    poster: item.poster,
                    imdbRating: item.imdbRating,
                    year: item.year
                  }}
                  onClick={() => handleSelect(item.id, item.type)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Search Overlay */}
      <SearchOverlay onSelectMeta={setSelectedMeta} />

      {/* Detail Modal */}
      {selectedMeta && (
        <DetailModal
          meta={selectedMeta}
          onClose={() => setSelectedMeta(null)}
        />
      )}
      {/* Settings Modal */}
      <SettingsModal />

      {/* Age Verification Gate */}
      <AgeGate 
        isOpen={showAgeGate}
        onVerify={() => {
          setShowAgeGate(false);
          router.push('/nsfw');
        }}
        onCancel={() => setShowAgeGate(false)}
      />
    </main>
  );
}
