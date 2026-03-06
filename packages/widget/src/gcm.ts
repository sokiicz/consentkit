/**
 * gcm.ts — Google Consent Mode v2 integration.
 * Fires 'denied' defaults before any user interaction (required by GCM v2 spec).
 */

import type { ConsentKitConfig, ConsentChoices, GCMValue } from './types';

function ensureGtag(): void {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  if (typeof window.gtag !== 'function') {
    window.gtag = function (...args: unknown[]) {
      window.dataLayer.push(args);
    };
  }
}

export function initGCMDefaults(config: ConsentKitConfig): void {
  if (!config.googleConsentMode.enabled) return;
  ensureGtag();

  const gcm = config.googleConsentMode;

  window.gtag('consent', 'default', {
    ad_storage: gcm.defaultAdStorage,
    analytics_storage: gcm.defaultAnalyticsStorage,
    functionality_storage: gcm.defaultFunctionalityStorage,
    personalization_storage: gcm.defaultPersonalizationStorage,
    ad_user_data: gcm.defaultAdUserData,
    security_storage: gcm.defaultSecurityStorage,
    wait_for_update: 500,
  });

  // Inform GCM that the URL contains consent info (for URL passthrough)
  window.gtag('set', 'url_passthrough', true);
}

export function updateGCMConsent(
  config: ConsentKitConfig,
  choices: ConsentChoices
): void {
  if (!config.googleConsentMode.enabled) return;
  ensureGtag();

  const analyticsGranted: GCMValue = choices['analytics'] ? 'granted' : 'denied';
  const marketingGranted: GCMValue = choices['marketing'] ? 'granted' : 'denied';
  const functionalGranted: GCMValue = choices['functional'] ? 'granted' : 'denied';

  window.gtag('consent', 'update', {
    ad_storage: marketingGranted,
    analytics_storage: analyticsGranted,
    functionality_storage: functionalGranted,
    personalization_storage: functionalGranted,
    ad_user_data: marketingGranted,
    security_storage: 'granted', // always granted — necessary
  });
}
