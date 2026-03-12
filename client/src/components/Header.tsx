'use client';
import { useRouter } from 'next/navigation';
import { useSearchStore, useSettingsStore } from '@/store';
import styles from '../app/page.module.css';

export default function Header() {
  const router = useRouter();
  const { openSearch } = useSearchStore();
  const { openSettings, ageVerified } = useSettingsStore();

  const handleNsfwClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (ageVerified) {
      router.push('/nsfw');
    } else {
      // Typically there would be a trigger for age gate here
      // For now we'll just push and let the page handle it if needed
      router.push('/nsfw');
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo} onClick={() => router.push('/')} style={{cursor: 'pointer'}}>
        <span className={styles.logoIcon}>▶</span>
        <span>StreamHub</span>
      </div>
      <nav className={styles.nav}>
        <button onClick={() => router.push('/')} className={styles.navLink} style={{ color: 'rgba(255,255,255,0.8)' }}>Home</button>
        <button onClick={() => router.push('/movies')} className={styles.navLink} style={{ color: 'rgba(255,255,255,0.8)' }}>Movies</button>
        <button onClick={() => router.push('/tv')} className={styles.navLink} style={{ color: 'rgba(255,255,255,0.8)' }}>TV Shows</button>
        <button onClick={() => router.push('/anime')} className={styles.navLink} style={{ color: 'rgba(255,255,255,0.8)' }}>Anime</button>
        <button onClick={() => router.push('/watchlist')} className={styles.navLink} style={{ color: 'rgba(255,255,255,0.8)' }}>Watchlist</button>
        <button onClick={handleNsfwClick} className={`${styles.navLink} ${styles.nsfwLink}`} style={{ color: '#ff4757' }}>
          NSFW <span className={styles.nsfwBadge}>18+</span>
        </button>
      </nav>
      <div className={styles.headerActions}>
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
      </div>
    </header>
  );
}
