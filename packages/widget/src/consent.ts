/**
 * consent.ts — Consent storage (localStorage) and server logging.
 */

import type { ConsentKitConfig, ConsentChoices, ConsentRecord, ConsentPayload } from './types';

const LS_CONSENT_KEY = 'ck_consent';
const LS_VISITOR_KEY = 'ck_vid';

function getOrCreateVisitorId(): string {
  let vid = localStorage.getItem(LS_VISITOR_KEY);
  if (!vid) {
    vid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    localStorage.setItem(LS_VISITOR_KEY, vid);
  }
  return vid;
}

export function hasConsent(config: ConsentKitConfig): boolean {
  const raw = localStorage.getItem(LS_CONSENT_KEY);
  if (!raw) return false;
  try {
    const record: ConsentRecord = JSON.parse(raw);
    return record.version === config.version;
  } catch {
    return false;
  }
}

export function getConsent(): ConsentRecord | null {
  const raw = localStorage.getItem(LS_CONSENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ConsentRecord;
  } catch {
    return null;
  }
}

export function setConsent(
  config: ConsentKitConfig,
  choices: ConsentChoices
): ConsentRecord {
  const visitorId = getOrCreateVisitorId();
  const record: ConsentRecord = {
    version: config.version,
    timestamp: new Date().toISOString(),
    visitorId,
    choices,
  };
  localStorage.setItem(LS_CONSENT_KEY, JSON.stringify(record));
  return record;
}

export function resetConsent(): void {
  localStorage.removeItem(LS_CONSENT_KEY);
}

export async function logConsentToServer(
  logUrl: string,
  config: ConsentKitConfig,
  choices: ConsentChoices
): Promise<void> {
  if (!config.consentLogging.enabled) return;

  const visitorId = getOrCreateVisitorId();
  const payload: ConsentPayload = {
    visitorId,
    timestamp: new Date().toISOString(),
    choices,
    bannerVersion: config.version,
    userAgent: navigator.userAgent,
  };

  try {
    await fetch(logUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Silent fail — consent is already saved locally
  }
}

export function buildAllDeniedChoices(config: ConsentKitConfig): ConsentChoices {
  const choices: ConsentChoices = {};
  for (const cat of config.categories) {
    choices[cat.key] = cat.locked ? true : false;
  }
  return choices;
}

export function buildAllGrantedChoices(config: ConsentKitConfig): ConsentChoices {
  const choices: ConsentChoices = {};
  for (const cat of config.categories) {
    choices[cat.key] = true;
  }
  return choices;
}
