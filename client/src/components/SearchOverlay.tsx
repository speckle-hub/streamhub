'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchStore } from '@/store';
import { api } from '@/lib/api';
import MediaCard from './MediaCard';
import styles from './SearchOverlay.module.css';

interface SearchOverlayProps {
  onSelectMeta: (meta: any) => void;
}

export default function SearchOverlay({ onSelectMeta }: SearchOverlayProps) {
  const { isOpen, query, closeSearch, setQuery } = useSearchStore();
  const [results, setResults] = useState<any[]>([]);
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
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(query);
        setResults(data.metas || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  if (!isOpen) return null;

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

        {results.length > 0 && (
          <>
            <div className={styles.resultsMeta}>{results.length} results for &quot;{query}&quot;</div>
            <div className={styles.grid}>
              {results.map((m) => (
                <MediaCard
                  key={m.id}
                  meta={m}
                  onClick={() => { onSelectMeta(m); closeSearch(); }}
                />
              ))}
            </div>
          </>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <div className={styles.empty}>No results found for &quot;{query}&quot;</div>
        )}

        {query.length < 2 && (
          <div className={styles.hint}>Start typing to search…  <kbd>Esc</kbd> to close</div>
        )}
      </div>
    </div>
  );
}
