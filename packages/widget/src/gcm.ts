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
    // Google tags read commands only from pushed `arguments` objects. Pushing an array
    // (rest parameters) looks the same in the dataLayer but is ignored, so consent
    // default and update never took effect. Keep this a plain function using `arguments`.
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
  }
}

type GCMDefaults = Record<string, GCMValue>;

// Every consent signal denied except security_storage: what a site has before it asks.
const DENIED_DEFAULTS: GCMDefaults = {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  ad_user_data: 'denied',
  // Consent Mode v2 has four ad signals; without this one Google treats
  // remarketing in the EEA as unconsented even after "Accept all".
  ad_personalization: 'denied',
  security_storage: 'granted',
};

let defaultsSent = false;
let sentDefaults: GCMDefaults = DENIED_DEFAULTS;

function defaultsFromConfig(config: ConsentKitConfig): GCMDefaults {
  const gcm = config.googleConsentMode;
  return {
    ad_storage: gcm.defaultAdStorage,
    analytics_storage: gcm.defaultAnalyticsStorage,
    functionality_storage: gcm.defaultFunctionalityStorage,
    personalization_storage: gcm.defaultPersonalizationStorage,
    ad_user_data: gcm.defaultAdUserData,
    ad_personalization: gcm.defaultAdPersonalization ?? 'denied',
    security_storage: gcm.defaultSecurityStorage,
  };
}

function sendDefaults(values: GCMDefaults): void {
  ensureGtag();
  window.gtag('consent', 'default', { ...values, wait_for_update: 500 });
  // Inform GCM that the URL contains consent info (for URL passthrough)
  window.gtag('set', 'url_passthrough', true);
  defaultsSent = true;
  sentDefaults = values;
}

/**
 * Runs the moment the script executes, before the config has been fetched. A Google tag
 * that starts before the consent default exists treats consent as granted, so the default
 * must not wait for the network. Without a config in hand the safe default is "denied":
 * sent when the site says it uses Consent Mode (data-gcm="on" on the script tag), or with
 * the real values when the config is inline (window.__consentKitConfig).
 */
export function initEarlyGCMDefaults(inlineConfig: ConsentKitConfig | undefined, optedIn: boolean): void {
  if (inlineConfig) {
    if (inlineConfig.googleConsentMode?.enabled) sendDefaults(defaultsFromConfig(inlineConfig));
    return;
  }
  if (optedIn) sendDefaults(DENIED_DEFAULTS);
}

export function initGCMDefaults(config: ConsentKitConfig): void {
  if (!config.googleConsentMode.enabled) return;

  const wanted = defaultsFromConfig(config);

  if (!defaultsSent) {
    // The Google tag may already have started. Say so, because its first events ran
    // without a consent default.
    if (window.dataLayer && window.dataLayer.some((e) => !!e && (e as { event?: string }).event === 'gtm.js')) {
      console.warn(
        'ConsentKit: the Google tag started before the consent default was sent. ' +
          'Add data-gcm="on" to the ConsentKit script tag and load it before the Google tag.'
      );
    }
    sendDefaults(wanted);
    return;
  }

  // Early defaults (all denied) went out before the config arrived: move only what the
  // config wants differently, for example a "granted" default outside the EEA.
  const diff: GCMDefaults = {};
  for (const key of Object.keys(wanted)) {
    if (wanted[key] !== sentDefaults[key]) diff[key] = wanted[key];
  }
  if (Object.keys(diff).length > 0) {
    window.gtag('consent', 'update', diff);
    sentDefaults = wanted;
  }
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
