export const APP_TIERS = ['PoC', 'Free'] as const;

export type AppTier = (typeof APP_TIERS)[number];

declare const __DESKVITALS_APP_VERSION__: string;
declare const __DESKVITALS_BUILD_DATE__: string;
declare const __DESKVITALS_APP_TIER__: AppTier;

export const buildInfo = Object.freeze({
  version: __DESKVITALS_APP_VERSION__,
  build: __DESKVITALS_BUILD_DATE__,
  tier: __DESKVITALS_APP_TIER__,
});
