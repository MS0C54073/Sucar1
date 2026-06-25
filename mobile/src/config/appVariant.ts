import Constants from 'expo-constants';

export type AppVariant = 'client' | 'driver';

export function getAppVariant(): AppVariant {
  const extra = Constants.expoConfig?.extra as { appVariant?: string } | undefined;
  return extra?.appVariant === 'driver' ? 'driver' : 'client';
}

export function isClientApp(): boolean {
  return getAppVariant() === 'client';
}

export function isDriverApp(): boolean {
  return getAppVariant() === 'driver';
}

export function getRequiredRole(): 'client' | 'driver' {
  return isDriverApp() ? 'driver' : 'client';
}

export function getAppDisplayName(): string {
  return isDriverApp() ? 'SuCAR Driver' : 'SuCAR';
}

export function getOtherAppName(): string {
  return isDriverApp() ? 'SuCAR (Client)' : 'SuCAR Driver';
}
