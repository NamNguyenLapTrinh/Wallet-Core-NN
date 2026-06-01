import { KeychainSecureStorage } from './KeychainSecureStorage';
import type { ISecureStorage, SecureItemOptions } from './ISecureStorage';

const MNEMONIC_KEY = (walletId: string) => `wallet.mnemonic.${walletId}`;

/**
 * SecureStorage — thin wrapper over the hardware-backed Keychain layer
 * with mnemonic-shaped helpers. Implements ISecureStorage so it's a drop-in
 * for WalletManager.
 *
 * Security:
 *   - Every mnemonic operation defaults to `requireBiometric: true`.
 *   - Items are stored only via the hardened KeychainSecureStorage backend.
 *   - Never logs the value.
 */
export class SecureStorage implements ISecureStorage {
  private readonly inner: ISecureStorage;

  constructor(inner: ISecureStorage = new KeychainSecureStorage()) {
    this.inner = inner;
  }

  setItem = (key: string, value: string, opts?: SecureItemOptions) =>
    this.inner.setItem(key, value, opts);

  getItem = (key: string, opts?: SecureItemOptions) =>
    this.inner.getItem(key, opts);

  removeItem = (key: string) => this.inner.removeItem(key);

  has = (key: string) => this.inner.has(key);

  wipeAll = () => this.inner.wipeAll();

  async saveMnemonic(walletId: string, mnemonic: string): Promise<void> {
    await this.inner.setItem(MNEMONIC_KEY(walletId), mnemonic, {
      requireBiometric: true,
    });
  }

  async getMnemonic(walletId: string, promptMessage = 'Unlock wallet'): Promise<string | null> {
    return this.inner.getItem(MNEMONIC_KEY(walletId), {
      requireBiometric: true,
      promptMessage,
    });
  }

  async removeMnemonic(walletId: string): Promise<void> {
    await this.inner.removeItem(MNEMONIC_KEY(walletId));
  }
}

export const secureStorage = new SecureStorage();
