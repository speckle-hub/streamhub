'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchStore, useSettingsStore } from '@/store';
import { api } from '@/lib/api';
import MediaCard from './MediaCard';
import styles from './SearchOverlay.module.css';

interface SearchOverlayProps {
  onSelectMeta: (meta: any) => void;
}

export default function SearchOverlay({ onSelectMeta }: SearchOverlayProps) {
  const { isOpen, query, closeSearch, setQuery } = useSearchStore();
  const { ageVerified } = useSettingsStore();
  const [results, setResults] = useState<any>({ movies: [], tv: [], anime: [], nsfw: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useSearchStore.getState().openSearch();
      }
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeSearch]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setResults({ movies: [], tv: [], anime: [], nsfw: [] });
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { 
      setResults({ movies: [], tv: [], anime: [], nsfw: [] }); 
      return; 
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query, ageVerified);
        setResults({
          movies: data.movies || [],
          tv: data.tv || [],
          anime: data.anime || [],
          nsfw: data.nsfw || []
        });
      } catch {
        setResults({ movies: [], tv: [], anime: [], nsfw: [] });
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce since it parallel fetches multiple addons
  }, [query, ageVerified]);

  if (!isOpen) return null;

  const totalResults = results.movies.length + results.tv.length + results.anime.length + (results.nsfw?.length || 0);

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && closeSearch()}>
      <div className={styles.panel}>
        <div className={styles.inputRow}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Search movies, shows, anime…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {loading && <div className={styles.spinner} />}
          <button className={styles.closeBtn} onClick={closeSearch} aria-label="Close search">✕</button>
        </div>

        <div className={styles.scrollContainer}>
          {totalResults > 0 && (
            <div className={styles.resultsMeta}>{totalResults} results for &quot;{query}&quot;</div>
          )}

          {results.movies?.length > 0 && (
            <div className={styles.categorySection}>
              <h3 className={styles.categoryTitle}>Movies</h3>
              <div className={styles.grid}>
                {results.movies.map((m: any) => (
                  <MediaCard
                    key={m.id}
                    meta={{...m, progress: 0}}
                    onClick={() => { onSelectMeta(m); closeSearch(); }}
                  />
                ))}
              </div>
            </div>
          )}

          {results.tv?.length > 0 && (
            <div className={styles.categorySection}>
              <h3 className={styles.categoryTitle}>TV Shows</h3>
              <div className={styles.grid}>
                {results.tv.map((m: any) => (
                  <MediaCard
                    key={m.id}
                    meta={{...m, progress: 0}}
                    onClick={() => { onSelectMeta(m); closeSearch(); }}
                  />
                ))}
              </div>
            </div>
          )}

          {results.anime?.length > 0 && (
            <div className={styles.categorySection}>
              <h3 className={styles.categoryTitle}>Anime</h3>
              <div className={styles.grid}>
                {results.anime.map((m: any) => (
                  <MediaCard
                    key={m.id}
                    meta={{...m, progress: 0}}
                    onClick={() => { onSelectMeta(m); closeSearch(); }}
                  />
                ))}
              </div>
            </div>
          )}

          {results.nsfw?.length > 0 && ageVerified && (
            <div className={styles.categorySection}>
              <h3 className={styles.categoryTitle} style={{color: '#ef4444'}}>Adult Content (18+)</h3>
              <div className={styles.grid}>
                {results.nsfw.map((m: any) => (
                  <MediaCard
                    key={m.id}
                    meta={{...m, progress: 0}}
                    onClick={() => { onSelectMeta(m); closeSearch(); }}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && query.length >= 2 && totalResults === 0 && (
            <div className={styles.empty}>No results found for &quot;{query}&quot;</div>
          )}

          {query.length < 2 && (
            <div className={styles.hint}>Start typing to search…  <kbd>Esc</kbd> to close</div>
          )}
        </div>
      </div>
    </div>
  );
}
