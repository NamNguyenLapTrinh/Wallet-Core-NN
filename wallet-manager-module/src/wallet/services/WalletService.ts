import { WalletManager } from '../manager/WalletManager';
import { WalletCoreAdapter } from '../adapters/WalletCoreAdapter';
import { KeychainSecureStorage } from '../storage/KeychainSecureStorage';
import type { IWalletCoreAdapter } from '../adapters/IWalletCoreAdapter';
import type { ISecureStorage } from '../storage/ISecureStorage';

let singleton: WalletManager | null = null;

export type WalletServiceOverrides = {
  adapter?: IWalletCoreAdapter;
  storage?: ISecureStorage;
};

export function initWalletService(overrides: WalletServiceOverrides = {}): WalletManager {
  if (singleton) return singleton;
  singleton = new WalletManager({
    adapter: overrides.adapter ?? new WalletCoreAdapter(),
    storage: overrides.storage ?? new KeychainSecureStorage(),
  });
  return singleton;
}

export function getWalletManager(): WalletManager {
  if (!singleton) throw new Error('WalletService not initialized — call initWalletService() first');
  return singleton;
}

export function resetWalletService(): void {
  singleton = null;
}
