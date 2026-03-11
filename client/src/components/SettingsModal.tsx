'use client';

import React from 'react';
import { useSettingsStore } from '@/store/settings';
import styles from './SettingsModal.module.css';

export default function SettingsModal() {
  const { 
    isSettingsOpen: isOpen, 
    closeSettings, 
    debridKey, setDebridKey,
    autoplay, setAutoplay,
    nsfwEnabled, setNsfwEnabled,
    settings, updateSettings,
    saveSettings
  } = useSettingsStore();

  if (!isOpen) return null;

  const handleClose = async () => {
    await saveSettings();
    closeSettings();
  };

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Settings</h2>
          <button className={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3>Persistence & Debrid</h3>
            <div className={styles.field}>
              <label>Real-Debrid API Key</label>
              <input 
                type="password" 
                value={debridKey} 
                onChange={(e) => setDebridKey(e.target.value)}
                placeholder="Paste your API key here..."
              />
              <p className={styles.hint}>Required for Real-Debrid streams and performance.</p>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Privacy & NSFW</h3>
            <div className={styles.settingItem}>
              <div className={styles.settingLabel}>
                <span>NSFW Content</span>
                <p>Show adult sections and addons</p>
              </div>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={nsfwEnabled}
                  onChange={(e) => setNsfwEnabled(e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>

            {nsfwEnabled && (
              <>
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <span>Blur Thumbnails</span>
                    <p>Blur adult content previews</p>
                  </div>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={settings.blurNsfw}
                      onChange={(e) => updateSettings({ blurNsfw: e.target.checked })}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <span>PIN Protection</span>
                    <p>Require 4-digit PIN for NSFW access</p>
                  </div>
                  <div className={styles.pinControls}>
                    {settings.nsfwPin && (
                      <button 
                        className={styles.clearPinBtn}
                        onClick={() => updateSettings({ nsfwPin: '' })}
                      >
                        Remove
                      </button>
                    )}
                    <button 
                      className={styles.pinBtn}
                      onClick={() => {
                        const pin = prompt('Enter 4-digit PIN (numbers only):');
                        if (pin === null) return;
                        if (/^\d{4}$/.test(pin)) {
                          updateSettings({ nsfwPin: pin });
                        } else {
                          alert('PIN must be exactly 4 digits.');
                        }
                      }}
                    >
                      {settings.nsfwPin ? 'Change PIN' : 'Set PIN'}
                    </button>
                  </div>
                </div>
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>
                    <span>Auto-clear History</span>
                    <p>Clear NSFW history on session end</p>
                  </div>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={settings.autoClearHistory === 'session'}
                      onChange={(e) => updateSettings({ autoClearHistory: e.target.checked ? 'session' : 'never' })}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>
              </>
            )}
          </section>

          <section className={styles.section}>
            <h3>Playback</h3>
            <div className={styles.toggleField}>
              <div>
                <label>Autoplay Next Episode</label>
                <p>Automatically start the next episode in a series.</p>
              </div>
              <input 
                type="checkbox" 
                checked={autoplay} 
                onChange={(e) => setAutoplay(e.target.checked)}
              />
            </div>
          </section>
        </div>

        <div className={styles.footer}>
          <button className={styles.saveBtn} onClick={handleClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
