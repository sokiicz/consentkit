/**
 * i18n.ts — texts the widget adds itself (labels for screen readers, "Learn more", …).
 * Banner copy, button labels and category texts come from the config and are not here.
 * Pick a table with `lang`; override any single text with `strings` in the config.
 */

import type { ConsentKitConfig, UiStrings } from './types';

const EN: UiStrings = {
  logoAlt: 'Logo',
  learnMore: 'Learn more',
  preferencesTitle: 'Cookie Preferences',
  backToBanner: 'Back to cookie banner',
  alwaysOn: 'Always On',
  categoryToggle: '{label} cookies',
  reopenerLabel: 'Manage cookie preferences',
  stateOn: 'On',
  stateOff: 'Off',
};

const CS: UiStrings = {
  logoAlt: 'Logo',
  learnMore: 'Více v zásadách',
  preferencesTitle: 'Nastavení cookies',
  backToBanner: 'Zpět na lištu',
  alwaysOn: 'Vždy zapnuto',
  categoryToggle: 'Cookies: {label}',
  reopenerLabel: 'Nastavení cookies',
  stateOn: 'Zapnuto',
  stateOff: 'Vypnuto',
};

const TABLES: Record<string, UiStrings> = { en: EN, cs: CS };

export function getStrings(config: ConsentKitConfig): UiStrings {
  // "cs-CZ" and "cs_CZ" both pick the "cs" table; unknown languages fall back to English.
  const base = String(config.lang || 'en').toLowerCase().split(/[-_]/)[0];
  return { ...EN, ...(TABLES[base] || {}), ...(config.strings || {}) };
}

export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
}
