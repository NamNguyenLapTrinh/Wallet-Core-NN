import { BaseKeyring } from './BaseKeyring';
import type { IWalletCoreAdapter } from '../adapters/IWalletCoreAdapter';
import type { ISecureStorage } from '../storage/ISecureStorage';
import type { DerivedKey, KeyringType } from '../types';
import { WalletError, ERR } from '../types/errors';
import { wipeString } from '../utils/memory';

type Deps = {
  id: string;
  storageKey: string;
  chain: string;
  adapter: IWalletCoreAdapter;
  storage: ISecureStorage;
};

export class ImportedKeyring extends BaseKeyring {
  readonly id: string;
  readonly type: KeyringType = 'imported';

  private readonly storageKey: string;
  private readonly chain: string;
  private readonly adapter: IWalletCoreAdapter;
  private readonly storage: ISecureStorage;

  constructor(deps: Deps) {
    super();
    this.id = deps.id;
    this.storageKey = deps.storageKey;
    this.chain = deps.chain;
    this.adapter = deps.adapter;
    this.storage = deps.storage;
  }

  async deriveAccount(chain: string, index: number): Promise<DerivedKey> {
    if (chain !== this.chain || index !== 0) {
      throw new WalletError(ERR.CHAIN_UNSUPPORTED, 'imported keyring is single-chain, single-index');
    }
    const pk = await this.fetchPK();
    try {
      const { address, publicKey } = await this.adapter.addressFromPrivateKey({
        privateKey: pk,
        chain,
      });
      return { address, publicKey, index: 0, path: 'imported', chain };
    } finally {
      wipeString(pk);
    }
  }

  async deriveAccounts(chain: string, indexes: number[]): Promise<DerivedKey[]> {
    if (indexes.length !== 1 || indexes[0] !== 0) {
      throw new WalletError(ERR.CHAIN_UNSUPPORTED, 'imported keyring supports only index 0');
    }
    return [await this.deriveAccount(chain, 0)];
  }

  async exportPrivateKey(): Promise<string> {
    return this.fetchPK();
  }

  lock(): void {}

  private async fetchPK(): Promise<string> {
    const pk = await this.storage.getItem(this.storageKey, {
      requireBiometric: true,
      promptMessage: 'Authenticate to access wallet',
    });
    if (!pk) throw new WalletError(ERR.LOCKED, 'wallet is locked');
    return pk;
  }
}
