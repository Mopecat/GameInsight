import type { Channel, Country, Platform, Version } from '../types/domain';

export interface MarketRule {
  installWeight: number;
  registerRate: number;
  tutorialRate: number;
  baseDay1Retention: number;
  payRate: number;
  arppuUsd: number;
}

export interface ChannelRule {
  installWeight: number;
  registerLift: number;
  tutorialLift: number;
  payLift: number;
  acquisitionCostUsd: number;
}

export const countryRules: Record<Country, MarketRule> = {
  US: {
    installWeight: 24,
    registerRate: 0.78,
    tutorialRate: 0.72,
    baseDay1Retention: 0.42,
    payRate: 0.085,
    arppuUsd: 18
  },
  JP: {
    installWeight: 18,
    registerRate: 0.82,
    tutorialRate: 0.76,
    baseDay1Retention: 0.48,
    payRate: 0.105,
    arppuUsd: 28
  },
  KR: {
    installWeight: 14,
    registerRate: 0.8,
    tutorialRate: 0.74,
    baseDay1Retention: 0.44,
    payRate: 0.092,
    arppuUsd: 22
  },
  BR: {
    installWeight: 16,
    registerRate: 0.68,
    tutorialRate: 0.6,
    baseDay1Retention: 0.3,
    payRate: 0.038,
    arppuUsd: 8
  },
  DE: {
    installWeight: 12,
    registerRate: 0.74,
    tutorialRate: 0.69,
    baseDay1Retention: 0.38,
    payRate: 0.064,
    arppuUsd: 16
  },
  TH: {
    installWeight: 16,
    registerRate: 0.7,
    tutorialRate: 0.62,
    baseDay1Retention: 0.33,
    payRate: 0.042,
    arppuUsd: 7
  }
};

export const channelRules: Record<Channel, ChannelRule> = {
  facebook: {
    installWeight: 32,
    registerLift: -0.02,
    tutorialLift: -0.04,
    payLift: 0.96,
    acquisitionCostUsd: 2.4
  },
  google: {
    installWeight: 28,
    registerLift: 0.02,
    tutorialLift: 0.01,
    payLift: 1.04,
    acquisitionCostUsd: 2.1
  },
  tiktok: {
    installWeight: 24,
    registerLift: -0.04,
    tutorialLift: -0.05,
    payLift: 0.88,
    acquisitionCostUsd: 1.45
  },
  organic: {
    installWeight: 16,
    registerLift: 0.05,
    tutorialLift: 0.08,
    payLift: 1.12,
    acquisitionCostUsd: 0
  }
};

export const platformRules: Record<Platform, { installWeight: number; payLift: number }> = {
  ios: {
    installWeight: 44,
    payLift: 1.18
  },
  android: {
    installWeight: 56,
    payLift: 0.9
  }
};

export const versionRules: Record<Version, { installWeight: number; retentionLift: number }> = {
  '1.0.0': {
    installWeight: 18,
    retentionLift: 0.94
  },
  '1.1.0': {
    installWeight: 36,
    retentionLift: 1
  },
  '1.2.0': {
    installWeight: 46,
    retentionLift: 1.07
  }
};
