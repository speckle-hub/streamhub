import { create } from 'zustand';

export interface StreamInfo {
  url: string;
  title: string;
  quality: string;
  type: 'hls' | 'direct';
  addon: string;
}

interface PlayerStore {
  currentStream: StreamInfo | null;
  isPlaying: boolean;
  isFullscreen: boolean;
  setStream: (stream: StreamInfo) => void;
  closePlayer: () => void;
  setFullscreen: (v: boolean) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentStream: null,
  isPlaying: false,
  isFullscreen: false,
  setStream: (stream) => set({ currentStream: stream, isPlaying: true }),
  closePlayer: () => set({ currentStream: null, isPlaying: false, isFullscreen: false }),
  setFullscreen: (v) => set({ isFullscreen: v }),
}));

export interface SearchState {
  isOpen: boolean;
  query: string;
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (q: string) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  isOpen: false,
  query: '',
  openSearch: () => set({ isOpen: true }),
  closeSearch: () => set({ isOpen: false, query: '' }),
  setQuery: (query) => set({ query }),
}));

export * from './settings';
