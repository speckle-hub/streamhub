'use client';
import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { usePlayerStore } from '@/store';
import { api } from '@/lib/api';
import styles from './DetailModal.module.css';

const API_BASE = 'http://localhost:3001';

const VideoPlayer = dynamic(() => import('./VideoPlayer'), { ssr: false });

interface Meta {
  id: string;
  type: string;
  name: string;
  poster?: string;
  background?: string;
  description?: string;
  year?: number;
  imdbRating?: string;
  genres?: string[];
}

interface Stream {
  name: string;
  url: string;
  quality?: string;
  size?: string;
  addon: string;
}

interface DetailModalProps {
  meta: Meta | null;
  onClose: () => void;
}

const QUALITY_COLORS: Record<string, string> = {
  '4K': '#a78bfa',
  '2160p': '#a78bfa',
  '1080p': '#34d399',
  '720p': '#60a5fa',
  '480p': '#9ca3af',
};

function QualityBadge({ quality }: { quality?: string }) {
  if (!quality) return null;
  const color = QUALITY_COLORS[quality] || '#6b7280';
  return (
    <span className={styles.qualityBadge} style={{ background: color + '22', color }}>
      {quality}
    </span>
  );
}

// ── Addon Health Badge ─────────────────────────────────────────────────────
interface HealthEntry {
  key: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number | null;
}

const STATUS_ICON: Record<string, string> = {
  healthy: '✓',
  degraded: '⚡',
  down: '✕',
};
const STATUS_COLOR: Record<string, string> = {
  healthy: '#34d399',
  degraded: '#fbbf24',
  down: '#ef4444',
};

function AddonHealthBadge({ addonKey, healthData }: { addonKey: string; healthData: HealthEntry[] | undefined }) {
  const entry = healthData?.find((h) => h.key.toLowerCase() === addonKey.toLowerCase());
  if (!entry) return <span className={styles.addonTag}>{addonKey}</span>;
  const color = STATUS_COLOR[entry.status];
  const icon = STATUS_ICON[entry.status];
  const title = entry.latencyMs ? `${entry.status} · ${entry.latencyMs}ms` : entry.status;
  return (
    <span className={styles.addonTag} title={title} style={{ borderColor: color + '66' }}>
      {addonKey}
      <span className={styles.healthDot} style={{ color }}>&#8203;{icon}</span>
    </span>
  );
}

type Tab = 'overview' | 'sources';

export default function DetailModal({ meta, onClose }: DetailModalProps) {
  const [tab, setTab] = useState<Tab>('sources');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [activeStreamIndex, setActiveStreamIndex] = useState<number | null>(null);
  const { setStream, currentStream, closePlayer } = usePlayerStore();

  const { data: healthData } = useQuery<HealthEntry[]>({
    queryKey: ['addonHealth'],
    queryFn: () => fetch(`${API_BASE}/api/health/addons`).then((r) => r.json()),
    staleTime: 60_000, // refresh every minute
    retry: false,
  });

  useEffect(() => {
    if (!meta) return;
    setLoadingStreams(true);
    setStreams([]);
    api.getStreams(meta.type, meta.id)
      .then((data) => setStreams(data.streams || []))
      .catch(() => setStreams([]))
      .finally(() => setLoadingStreams(false));
  }, [meta?.id, meta?.type]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handlePlay = useCallback((stream: Stream, index: number) => {
    const isHls = stream.url.includes('.m3u8') || stream.name?.toLowerCase().includes('hls');
    setActiveStreamIndex(index);
    setStream({
      url: `http://localhost:3001${stream.url}`,
      title: meta?.name || '',
      quality: stream.quality || 'Unknown',
      type: isHls ? 'hls' : 'direct',
      addon: stream.addon,
    });
    setTab('sources'); // Keep on sources so player shows within modal
  }, [meta?.name, setStream]);

  const handleNextSource = useCallback(() => {
    if (activeStreamIndex === null) return;
    const next = activeStreamIndex + 1;
    if (next < streams.length) handlePlay(streams[next], next);
  }, [activeStreamIndex, streams, handlePlay]);

  if (!meta) return null;

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Hero */}
        <div className={styles.hero} style={{ backgroundImage: meta.background ? `url(${meta.background})` : undefined }}>
          <div className={styles.heroGrad} />
          {meta.poster && <img src={meta.poster} alt={meta.name} className={styles.poster} />}
          <div className={styles.heroInfo}>
            <h1 className={styles.title}>{meta.name}</h1>
            <div className={styles.metaRow}>
              {meta.year && <span>{meta.year}</span>}
              {meta.imdbRating && <span>⭐ {meta.imdbRating}</span>}
              {meta.genres?.slice(0, 3).map((g) => <span key={g} className={styles.genre}>{g}</span>)}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {(['overview', 'sources'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'sources' && streams.length > 0 && (
                <span className={styles.badge}>{streams.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.body}>
          {/* Inline player when stream selected */}
          {currentStream && tab === 'sources' && (
            <div className={styles.playerWrap}>
              <VideoPlayer
                streamUrl={currentStream.url}
                type={currentStream.type}
                title={`${currentStream.quality} · ${currentStream.addon}`}
                onError={handleNextSource}
                onClose={() => { closePlayer(); setActiveStreamIndex(null); }}
              />
            </div>
          )}

          {tab === 'overview' && (
            <p className={styles.desc}>{meta.description || 'No description available.'}</p>
          )}

          {tab === 'sources' && (
            <div className={styles.sourcesList}>
              {loadingStreams && (
                <div className={styles.loadingRow}>
                  <div className={styles.spinner} />
                  <span>Fetching sources from all addons…</span>
                </div>
              )}
              {!loadingStreams && streams.length === 0 && (
                <p className={styles.empty}>No sources available for this title.</p>
              )}
              {streams.map((s, i) => (
                <div
                  key={i}
                  className={`${styles.sourceRow} ${activeStreamIndex === i ? styles.active : ''}`}
                >
                  <QualityBadge quality={s.quality} />
                  <span className={styles.sourceName}>{s.name || s.addon}</span>
                  {s.size && <span className={styles.size}>{s.size}</span>}
                  <AddonHealthBadge addonKey={s.addon} healthData={healthData} />
                  <button
                    className={styles.playBtn}
                    onClick={() => handlePlay(s, i)}
                  >
                    ▶ Play
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
