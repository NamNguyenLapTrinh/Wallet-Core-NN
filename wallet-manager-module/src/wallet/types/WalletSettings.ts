export type UnlockMethodSetting = 'passcode' | 'biometric';

export type WalletSettings = {
  unlockMethod: UnlockMethodSetting;
  autoLockMs: number;
  selectedChain: string;
  currency: string;
  appearance: 'system' | 'light' | 'dark';
};

export const DEFAULT_SETTINGS: WalletSettings = {
  unlockMethod: 'passcode',
  autoLockMs: 5 * 60_000,
  selectedChain: 'ethereum',
  currency: 'USD',
  appearance: 'system',
};
