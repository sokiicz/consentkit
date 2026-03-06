/**
 * index.ts — ConsentKit widget entry point.
 *
 * Execution order:
 * 1. startBlocking() — synchronously block non-essential scripts IMMEDIATELY
 * 2. initGCMDefaults() — fire GCM v2 'denied' defaults before any user interaction
 * 3. DOMContentLoaded — fetch config, check existing consent, render banner if needed
 */

import { startBlocking, applyConsent } from './blocker';
import { initGCMDefaults, updateGCMConsent } from './gcm';
import {
  hasConsent,
  getConsent,
  setConsent,
  logConsentToServer,
  buildAllDeniedChoices,
} from './consent';
import { ConsentBanner } from './banner';
import type { ConsentKitConfig, ConsentChoices } from './types';

// ─── Step 1: Block scripts synchronously before anything else ────────────────
startBlocking();

// Capture currentScript synchronously — it becomes null after the IIFE finishes
const _currentScript = document.currentScript as HTMLScriptElement | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getServerOrigin(): string {
  if (_currentScript?.src) {
    try {
      const url = new URL(_currentScript.src);
      return url.origin;
    } catch {
      // fall through
    }
  }
  return window.location.origin;
}

function getLogUrl(serverOrigin: string): string {
  // data-log-url lets FTP/PHP users point at consent-log.php (or any endpoint)
  return _currentScript?.getAttribute('data-log-url') ?? `${serverOrigin}/api/consent`;
}

async function fetchConfig(serverOrigin: string): Promise<ConsentKitConfig> {
  // 1. Inline config via window.__consentKitConfig — works on file://, no fetch needed
  const w = window as typeof window & { __consentKitConfig?: ConsentKitConfig };
  if (w.__consentKitConfig) return w.__consentKitConfig;
  // 2. data-config attribute: URL to a static JSON file (deployed sites)
  const configUrl = _currentScript?.getAttribute('data-config') ?? `${serverOrigin}/api/config`;
  const res = await fetch(configUrl);
  if (!res.ok) throw new Error(`ConsentKit: failed to fetch config (${res.status})`);
  return res.json() as Promise<ConsentKitConfig>;
}

function shouldHonorGPC(): boolean {
  // navigator.globalPrivacyControl is not yet in standard lib types
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

function shouldHonorDNT(): boolean {
  return navigator.doNotTrack === '1';
}

async function init(): Promise<void> {
  const serverOrigin = getServerOrigin();
  const logUrl = getLogUrl(serverOrigin);

  let config: ConsentKitConfig;
  try {
    config = await fetchConfig(serverOrigin);
  } catch (err) {
    console.warn('ConsentKit: could not load config.', err);
    return;
  }

  // ─── Step 2: GCM v2 defaults (must fire before any user interaction) ───────
  initGCMDefaults(config);

  // ─── Step 3: Global Privacy Control — auto-reject, no banner ────────────────
  if (shouldHonorGPC()) {
    const choices = buildAllDeniedChoices(config);
    setConsent(config, choices);
    applyConsent(choices);
    updateGCMConsent(config, choices);
    await logConsentToServer(logUrl, config, choices);
    return;
  }

  // ─── DNT — treat as reject-all ───────────────────────────────────────────────
  if (shouldHonorDNT()) {
    const choices = buildAllDeniedChoices(config);
    setConsent(config, choices);
    applyConsent(choices);
    updateGCMConsent(config, choices);
    await logConsentToServer(logUrl, config, choices);
    return;
  }

  // ─── Existing valid consent ──────────────────────────────────────────────────
  if (hasConsent(config)) {
    const existing = getConsent();
    if (existing) {
      applyConsent(existing.choices);
      updateGCMConsent(config, existing.choices);
      mountReopener(config, logUrl);
    }
    return;
  }

  // ─── No consent yet — show banner ────────────────────────────────────────────
  const banner = new ConsentBanner(config, async (choices: ConsentChoices) => {
    setConsent(config, choices);
    applyConsent(choices);
    updateGCMConsent(config, choices);
    await logConsentToServer(logUrl, config, choices);
  });

  banner.mount();
}

function mountReopener(config: ConsentKitConfig, logUrl: string): void {
  const banner = new ConsentBanner(config, async (choices: ConsentChoices) => {
    setConsent(config, choices);
    applyConsent(choices);
    updateGCMConsent(config, choices);
    await logConsentToServer(logUrl, config, choices);
  });
  banner.mountReopenerOnly();
}

// ─── Kick off after DOM is ready ─────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { init(); });
} else {
  init();
}

// ─── Public API ───────────────────────────────────────────────────────────────
export { getConsent, setConsent, hasConsent } from './consent';
