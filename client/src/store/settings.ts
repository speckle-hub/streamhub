import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface UserSettings {
  blurNsfw?: boolean;
  nsfwPin?: string;
  autoClearHistory?: 'session' | 'day' | 'never';
}

interface SettingsState {
  debridKey: string;
  autoplay: boolean;
  nsfwEnabled: boolean;
  ageVerified: boolean;
  isSettingsOpen: boolean;
  settings: UserSettings;
  setDebridKey: (key: string) => void;
  setAutoplay: (enabled: boolean) => void;
  setNsfwEnabled: (enabled: boolean) => void;
  setAgeVerified: (verified: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  saveSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      debridKey: '',
      autoplay: true,
      nsfwEnabled: false,
      ageVerified: false,
      isSettingsOpen: false,
      settings: {
        blurNsfw: true,
        autoClearHistory: 'never'
      },

      setDebridKey: (debridKey) => set({ debridKey }),
      setAutoplay: (autoplay) => set({ autoplay }),
      setNsfwEnabled: (nsfwEnabled) => set({ nsfwEnabled }),
      setAgeVerified: (verified) => set({ ageVerified: verified }),
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
      updateSettings: (newSettings) => 
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      saveSettings: async () => {
        const { debridKey, autoplay, nsfwEnabled, settings } = get();
        try {
          await api.updateSettings({
            debridKey,
            autoplay,
            nsfwEnabled,
            ...settings
          });
        } catch (err) {
          console.error('Failed to save settings:', err);
        }
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);
