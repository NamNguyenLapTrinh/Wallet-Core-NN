import { BaseKeyring } from './BaseKeyring';
import type { IWalletCoreAdapter } from '../adapters/IWalletCoreAdapter';
import type { ISecureStorage } from '../storage/ISecureStorage';
import type { DerivedKey, KeyringType } from '../types';
import { WalletError, ERR } from '../types/errors';
import { wipeString } from '../utils/memory';

type Deps = {
  id: string;
  storageKey: string;
  adapter: IWalletCoreAdapter;
  storage: ISecureStorage;
};

export class HDKeyring extends BaseKeyring {
  readonly id: string;
  readonly type: KeyringType = 'hd';

  private readonly storageKey: string;
  private readonly adapter: IWalletCoreAdapter;
  private readonly storage: ISecureStorage;

  constructor(deps: Deps) {
    super();
    this.id = deps.id;
    this.storageKey = deps.storageKey;
    this.adapter = deps.adapter;
    this.storage = deps.storage;
  }

  async deriveAccount(chain: string, index: number): Promise<DerivedKey> {
    return this.withMnemonic((m) =>
      this.adapter.derivedKey({ mnemonic: m, chain, index }),
    );
  }

  async deriveAccounts(chain: string, indexes: number[]): Promise<DerivedKey[]> {
    return this.withMnemonic((m) =>
      this.adapter.derivedKeys({ mnemonic: m, chain, indexes }),
    );
  }

  async exportPrivateKey(chain: string, index: number): Promise<string> {
    return this.withMnemonic((m) =>
      this.adapter.derivePrivateKey({ mnemonic: m, chain, index }),
    );
  }

  lock(): void {}

  // Every call hits Keychain with biometric — no in-memory session cache.
  // Caller is responsible for not retaining the result.
  private async withMnemonic<T>(fn: (m: string) => Promise<T>): Promise<T> {
    const mnemonic = await this.storage.getItem(this.storageKey, {
      requireBiometric: true,
      promptMessage: 'Authenticate to access wallet',
    });
    if (!mnemonic) throw new WalletError(ERR.AUTH_FAILED, 'authentication failed');
    try {
      return await fn(mnemonic);
    } finally {
      wipeString(mnemonic);
    }
  }
}
