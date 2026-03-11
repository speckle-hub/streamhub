'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useSettingsStore } from '@/store/settings';
import styles from './AgeGate.module.css';

interface AgeGateProps {
  isOpen: boolean;
  onVerify: () => void;
  onCancel: () => void;
}

export default function AgeGate({ isOpen, onVerify, onCancel }: AgeGateProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAgeVerified, settings } = useSettingsStore();
  
  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!confirmed) return;
    
    if (settings.nsfwPin && pin !== settings.nsfwPin) {
      setError('Invalid PIN');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.verifyAge(true);
      setAgeVerified(true);
      onVerify();
    } catch (err) {
      console.error('Verification failed:', err);
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.icon}>🔞</div>
        <h2 className={styles.title}>Adult Content</h2>
        <p className={styles.description}>
          This section contains sexually explicit material (NSFW). 
          You must be at least 18 years old to proceed.
        </p>

        {settings.nsfwPin && (
          <div className={styles.pinSection}>
            <label className={styles.pinLabel}>Enter 4-digit PIN</label>
            <input 
              type="password" 
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className={styles.pinInput}
              placeholder="••••"
            />
          </div>
        )}
        
        <label className={styles.checkboxContainer}>
          <input 
            type="checkbox" 
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className={styles.checkbox}
          />
          <span className={styles.checkboxLabel}>
            I confirm that I am 18 years or older.
          </span>
        </label>

        {error && <div className={styles.error}>{error}</div>}
        
        <div className={styles.actions}>
          <button 
            onClick={onCancel} 
            className={styles.cancelBtn}
            disabled={loading}
          >
            Leave
          </button>
          <button 
            onClick={handleVerify} 
            disabled={!confirmed || loading || (!!settings.nsfwPin && pin.length < 4)}
            className={styles.enterBtn}
          >
            {loading ? 'Verifying...' : 'Enter Section'}
          </button>
        </div>
      </div>
    </div>
  );
}
