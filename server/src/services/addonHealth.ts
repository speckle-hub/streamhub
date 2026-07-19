import axios from 'axios';
import { ADDONS } from '../config/addons';

// Health status per addon URL
export interface AddonHealth {
  key: string;
  url: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number | null;
  lastChecked: Date;
  errorRate: number; // 0..1
  nsfw: boolean;
}

const healthMap = new Map<string, AddonHealth>();
const HISTORY_SIZE = 5; // rolling window
const recentResults = new Map<string, boolean[]>(); // true = success

async function pingAddon(key: string, url: string, nsfw: boolean): Promise<void> {
  const start = Date.now();
  let success = false;

  try {
    // URL is already the manifest.json path in ADDONS config
    const res = await axios.get(url, { timeout: 5000 });
    success = res.status === 200 && !!res.data?.id;
  } catch {
    success = false;
  }

  const latencyMs = success ? Date.now() - start : null;

  // Update rolling history
  const history = recentResults.get(key) ?? [];
  history.push(success);
  if (history.length > HISTORY_SIZE) history.shift();
  recentResults.set(key, history);

  const failures = history.filter((r) => !r).length;
  const errorRate = history.length > 0 ? failures / history.length : 0;

  const status: AddonHealth['status'] =
    errorRate === 0 ? 'healthy' : errorRate < 0.5 ? 'degraded' : 'down';

  healthMap.set(key, { key, url, status, latencyMs, lastChecked: new Date(), errorRate, nsfw });
}

async function runHealthCheck(): Promise<void> {
  const addons = Object.entries(ADDONS).filter(([, cfg]) => cfg.enabled);
  await Promise.allSettled(
    addons.map(([key, cfg]) => pingAddon(key, cfg.url, cfg.nsfw ?? false))
  );
  console.log(`[Health] Checked ${addons.length} addons`);
}

/** Start background health checks every 5 minutes */
export function startAddonHealthMonitor(): void {
  // Initial check after 10s (let server settle)
  setTimeout(() => {
    runHealthCheck();
    setInterval(runHealthCheck, 5 * 60 * 1000);
  }, 10_000);
}

/** Get current health snapshot for all addons */
export function getAddonHealthSnapshot(): AddonHealth[] {
  return Array.from(healthMap.values());
}
