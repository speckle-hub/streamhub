'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './VideoPlayer.module.css';

import { useProgress } from '@/hooks/useProgress';

interface VideoPlayerProps {
  streamUrl: string;
  type: 'hls' | 'direct';
  title?: string;
  onError?: () => void;
  onClose?: () => void;
  meta?: {
    id: string;
    type: 'movie' | 'tv';
    season?: number;
    episode?: number;
    episodeTitle?: string;
  };
}

export default function VideoPlayer({ streamUrl, type, title, meta, onError, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-save progress
  useProgress(
    meta && duration > 0 ? {
      contentId: meta.id,
      type: meta.type,
      position: currentTime,
      duration: duration,
      seasonNumber: meta.season,
      episodeNumber: meta.episode,
      episodeTitle: meta.episodeTitle
    } : null,
    isPlaying
  );

  const handleError = useCallback((msg: string) => {
    setError(msg);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);

    let hlsInstance: any = null;

    const initPlayer = async () => {
      if (type === 'hls' || streamUrl.includes('.m3u8')) {
        const Hls = (await import('hls.js')).default;
        if (Hls.isSupported()) {
          hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            maxBufferLength: 30,
          });
          hlsInstance.loadSource(streamUrl);
          hlsInstance.attachMedia(video);
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
            setIsLoading(false);
          });
          hlsInstance.on(Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) handleError('HLS stream error. Try another source.');
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS
          video.src = streamUrl;
          video.play().catch(() => {});
          setIsLoading(false);
        } else {
          handleError('HLS not supported in this browser.');
        }
      } else {
        // Direct MP4 or other
        video.src = streamUrl;
        video.play().catch(() => {});
      }
    };

    initPlayer();

    return () => {
      hlsInstance?.destroy();
      video.pause();
      video.src = '';
    };
  }, [streamUrl, type, handleError]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  };

  const toggleFullscreen = () => {
    const el = videoRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen();
    else document.exitFullscreen();
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.playerWrap} onMouseMove={handleMouseMove}>
      {title && <div className={styles.title}>{title}</div>}
      {onClose && (
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close player">✕</button>
      )}

      <video
        ref={videoRef}
        className={styles.video}
        onPlay={() => { setIsPlaying(true); setIsLoading(false); }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onDurationChange={() => setDuration(videoRef.current?.duration || 0)}
        onError={() => handleError('Video failed to load')}
        playsInline
      />

      {isLoading && !error && (
        <div className={styles.overlay}>
          <div className={styles.spinner} />
          <p>Loading stream…</p>
        </div>
      )}

      {error && (
        <div className={styles.overlay}>
          <span className={styles.errorIcon}>⚠</span>
          <p>{error}</p>
          {onError && <button className={styles.retryBtn} onClick={onError}>Try Next Source</button>}
        </div>
      )}

      {!error && (
        <div className={`${styles.controls} ${showControls ? styles.visible : ''}`}>
          <input
            type="range"
            className={styles.seek}
            min={0}
            max={duration || 1}
            value={currentTime}
            step={0.1}
            onChange={(e) => {
              const t = Number(e.target.value);
              setCurrentTime(t);
              if (videoRef.current) videoRef.current.currentTime = t;
            }}
          />
          <div className={styles.controlRow}>
            <button className={styles.ctrlBtn} onClick={togglePlay} aria-label="Play/Pause">
              {isPlaying ? '⏸' : '▶'}
            </button>
            <span className={styles.time}>{formatTime(currentTime)} / {formatTime(duration)}</span>
            <div className={styles.volumeWrap}>
              <span>🔊</span>
              <input
                type="range"
                className={styles.volume}
                min={0} max={1} step={0.05}
                value={volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  if (videoRef.current) videoRef.current.volume = v;
                }}
              />
            </div>
            <button className={styles.ctrlBtn} onClick={toggleFullscreen} aria-label="Fullscreen">⛶</button>
          </div>
        </div>
      )}
    </div>
  );
}
