import { BaseKeyring } from './BaseKeyring';
import type { DerivedKey, KeyringType } from '../types';
import { WalletError, ERR } from '../types/errors';

type Deps = {
  id: string;
  address: string;
  publicKey?: string;
  chain: string;
};

export class WatchOnlyKeyring extends BaseKeyring {
  readonly id: string;
  readonly type: KeyringType = 'watch';

  private readonly address: string;
  private readonly publicKey: string;
  private readonly chain: string;

  constructor(deps: Deps) {
    super();
    this.id = deps.id;
    this.address = deps.address;
    this.publicKey = deps.publicKey ?? '';
    this.chain = deps.chain;
  }

  async deriveAccount(chain: string): Promise<DerivedKey> {
    if (chain !== this.chain) {
      throw new WalletError(ERR.CHAIN_UNSUPPORTED, 'wrong chain for watch-only keyring');
    }
    return {
      address: this.address,
      publicKey: this.publicKey,
      index: 0,
      path: 'watch',
      chain,
    };
  }

  async deriveAccounts(chain: string): Promise<DerivedKey[]> {
    return [await this.deriveAccount(chain)];
  }

  async exportPrivateKey(): Promise<string> {
    throw new WalletError(ERR.KEYRING_TYPE_UNSUPPORTED, 'watch-only cannot export');
  }

  lock(): void {}
}
