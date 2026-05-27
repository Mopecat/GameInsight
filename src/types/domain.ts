export const countries = ['US', 'JP', 'KR', 'BR', 'DE', 'TH'] as const;
export const platforms = ['ios', 'android'] as const;
export const channels = ['facebook', 'google', 'tiktok', 'organic'] as const;
export const versions = ['1.0.0', '1.1.0', '1.2.0'] as const;

export type Country = (typeof countries)[number];
export type Platform = (typeof platforms)[number];
export type Channel = (typeof channels)[number];
export type Version = (typeof versions)[number];

export type PageKey = 'dashboard' | 'retention' | 'funnel' | 'userPath' | 'builder';
export type FilterKey = 'country' | 'platform' | 'channel' | 'version';

export interface GlobalFilters {
  country: Country | 'all' | string;
  platform: Platform | 'all' | string;
  channel: Channel | 'all' | string;
  version: Version | 'all' | string;
}

export type GameEventName =
  | 'install'
  | 'register'
  | 'tutorial_complete'
  | 'battle_start'
  | 'shop_view'
  | 'gacha'
  | 'payment';

export interface GameEvent {
  id: string;
  playerId: string;
  eventName: GameEventName;
  timestamp: number;
  country: Country;
  platform: Platform;
  channel: Channel;
  version: Version;
  revenueUsd?: number;
}
