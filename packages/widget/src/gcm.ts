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
    // Consent Mode v2 has four ad signals; without this one Google treats
    // remarketing in the EEA as unconsented even after "Accept all".
    ad_personalization: gcm.defaultAdPersonalization ?? 'denied',
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
    ad_personalization: marketingGranted,
    security_storage: 'granted', // always granted — necessary
  });
}

/**
 * Pushes a `consent_update` event after a visitor changes their consent. Tags that
 * wait for consent only re-check on the next trigger, so without this event they
 * would fire on the next page view instead of right after the click.
 * No payload on purpose: the consent state itself travels in gtag('consent', 'update').
 */
export function pushConsentUpdateEvent(): void {
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  window.dataLayer.push({ event: 'consent_update' });
}
