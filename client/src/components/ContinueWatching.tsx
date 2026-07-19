'use client';

import React from 'react';
import MediaCard from './MediaCard';
import styles from './ContinueWatching.module.css';

interface ProgressItem {
  contentId: string;
  percent: number;
  seasonNumber?: number;
  episodeNumber?: number;
  content: {
    title: string;
    posterPath: string;
    type: string;
  };
}

interface Props {
  items: ProgressItem[];
  onSelect: (id: string, type: string) => void;
}

export default function ContinueWatching({ items, onSelect }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Continue Watching</h2>
      <div className={styles.grid}>
        {items.map((item) => (
          <div key={`${item.contentId}-${item.seasonNumber}-${item.episodeNumber}`} className={styles.item}>
            <MediaCard
              meta={{
                id: item.contentId,
                type: item.content.type,
                name: item.content.title,
                poster: item.content.posterPath,
              }}
              onClick={() => onSelect(item.contentId, item.content.type)}
            />
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${item.percent}%` }}
              />
            </div>
            {item.seasonNumber && (
              <span className={styles.episodeInfo}>
                S{item.seasonNumber} E{item.episodeNumber}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
