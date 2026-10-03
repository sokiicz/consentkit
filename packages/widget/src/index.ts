/**
 * index.ts — ConsentKit widget entry point.
 *
 * Execution order:
 * 1. startBlocking() — synchronously block non-essential scripts IMMEDIATELY
 * 2. initGCMDefaults() — fire GCM v2 'denied' defaults before any user interaction
 * 3. DOMContentLoaded — fetch config, check existing consent, render banner if needed
 */

import { startBlocking, applyConsent } from './blocker';
import { initGCMDefaults, updateGCMConsent, pushConsentUpdateEvent } from './gcm';
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

// The one banner instance; ConsentKit.openPreferences() uses it. Set once the config is loaded.
let activeBanner: ConsentBanner | null = null;

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

  const banner = new ConsentBanner(config, (choices) => handleVisitorChoice(config, logUrl, choices));
  activeBanner = banner;

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
      banner.mountReopenerOnly();
    }
    return;
  }

  // ─── No consent yet — show banner ────────────────────────────────────────────
  banner.mount();
}

// Runs when the visitor decides (banner or re-opened preferences). Automatic GPC/DNT
// rejects and stored consent applied on load are not visitor decisions and skip the event.
async function handleVisitorChoice(
  config: ConsentKitConfig,
  logUrl: string,
  choices: ConsentChoices
): Promise<void> {
  setConsent(config, choices);
  applyConsent(choices);
  updateGCMConsent(config, choices);
  pushConsentUpdateEvent();
  await logConsentToServer(logUrl, config, choices);
}

// ─── Kick off after DOM is ready ─────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { init(); });
} else {
  init();
}

// ─── Public API ───────────────────────────────────────────────────────────────
export { getConsent, setConsent, hasConsent } from './consent';

/** Opens the preferences panel from anywhere, e.g. a "Cookie settings" link in the footer:
 *  <a href="#" onclick="ConsentKit.openPreferences(); return false;">Cookie settings</a>
 *  Does nothing until the widget has loaded its config. */
export function openPreferences(): void {
  activeBanner?.openPreferences();
}
