'use client';
import { useState } from 'react';
import Image from 'next/image';
import tmdbLoader from '@/lib/imageLoader';
import styles from './MediaCard.module.css';

interface Meta {
  id: string;
  type: string;
  name: string;
  poster?: string;
  year?: number;
  imdbRating?: string;
  progress?: number;
  sourceAddon?: string;
}

interface MediaCardProps {
  meta: Meta;
  onClick: () => void;
}

const QUALITY_BADGES = ['4K', '1080p'];

export default function MediaCard({ meta, onClick }: MediaCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <article className={styles.card} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className={styles.posterWrap}>
        {meta.poster && !imgError ? (
          <Image
            loader={tmdbLoader}
            src={meta.poster}
            alt={meta.name}
            className={styles.poster}
            width={342}
            height={513}
            onError={() => setImgError(true)}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
          />
        ) : (
          <div className={styles.posterFallback}>
            <span>🎬</span>
          </div>
        )}
        <div className={styles.hoverOverlay}>
          <button className={styles.playBtn}>▶ Play</button>
          <button className={styles.infoBtn}>⋯ More</button>
        </div>
        {/* Quality badges */}
        <div className={styles.badges}>
          {QUALITY_BADGES.map((q) => (
            <span key={q} className={styles.qualityBadge}>{q}</span>
          ))}
        </div>
      </div>
      <div className={styles.info}>
        <p className={styles.title}>{meta.name}</p>
        <div className={styles.subRow}>
          {meta.year && <span className={styles.year}>{meta.year}</span>}
          {meta.imdbRating && <span className={styles.rating}>⭐ {meta.imdbRating}</span>}
        </div>
      </div>
    </article>
  );
}
