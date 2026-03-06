export type BannerPosition = 'bottom-bar' | 'bottom-left' | 'bottom-right' | 'center-popup';

export type GCMValue = 'granted' | 'denied';

export interface GeoConfig {
  showInGDPRCountries: boolean;
  showInCCPAStates: boolean;
  showGlobally: boolean;
}

export interface BannerConfig {
  position: BannerPosition;
  title: string;
  description: string;
  acceptAllLabel: string;
  rejectAllLabel: string;
  customizeLabel: string;
  savePreferencesLabel: string;
  privacyPolicyUrl: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  borderRadius: string;
  logoUrl: string;
}

export interface CategoryConfig {
  key: string;
  label: string;
  description: string;
  locked: boolean;
  defaultEnabled: boolean;
}

export interface ConsentLoggingConfig {
  enabled: boolean;
  retentionDays: number;
}

export interface GoogleConsentModeConfig {
  enabled: boolean;
  defaultAdStorage: GCMValue;
  defaultAnalyticsStorage: GCMValue;
  defaultFunctionalityStorage: GCMValue;
  defaultPersonalizationStorage: GCMValue;
  defaultAdUserData: GCMValue;
  defaultSecurityStorage: GCMValue;
}

export interface CCPAConfig {
  enabled: boolean;
  doNotSellLinkText: string;
}

export interface ConsentKitConfig {
  version: string;
  lang: string;
  geo: GeoConfig;
  banner: BannerConfig;
  categories: CategoryConfig[];
  consentLogging: ConsentLoggingConfig;
  googleConsentMode: GoogleConsentModeConfig;
  ccpa: CCPAConfig;
}

export interface ConsentChoices {
  [key: string]: boolean;
}

export interface ConsentRecord {
  version: string;
  timestamp: string;
  visitorId: string;
  choices: ConsentChoices;
}

export interface ConsentPayload {
  visitorId: string;
  timestamp: string;
  choices: ConsentChoices;
  bannerVersion: string;
  userAgent: string;
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    consentKitConfig?: ConsentKitConfig;
  }
}
