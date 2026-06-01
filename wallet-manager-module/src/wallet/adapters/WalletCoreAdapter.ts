import { NativeWalletCore } from '../../native/NativeWalletCore';
import type { IWalletCoreAdapter } from './IWalletCoreAdapter';
import type { DerivedKey } from '../types';
import { CHAINS, resolvePath } from '../types';
import { WalletError, ERR } from '../types/errors';
import { wipeString } from '../utils/memory';

export class WalletCoreAdapter implements IWalletCoreAdapter {
  constructor(private readonly core = NativeWalletCore) {}

  async generateSeedPhrase(strength: 128 | 256 = 128): Promise<string> {
    return this.core.generateSeedPhrase(strength);
  }

  validateMnemonic(mnemonic: string): Promise<boolean> {
    return this.core.validateMnemonic(mnemonic);
  }

  generatePrivateKey(): Promise<string> {
    return this.core.generatePrivateKey();
  }

  validatePrivateKey(privateKey: string, chain: string): Promise<boolean> {
    const c = this.requireChain(chain);
    return this.core.validatePrivateKey(privateKey, c.twCoinType);
  }

  async derivedKey({
    mnemonic,
    chain,
    index,
  }: {
    mnemonic: string;
    chain: string;
    index: number;
  }): Promise<DerivedKey> {
    const c = this.requireChain(chain);
    const path = resolvePath(c, index);
    const res = await this.core.derivedKey(mnemonic, c.twCoinType, path);
    return {
      address: res.address,
      publicKey: res.publicKey,
      index,
      path,
      chain,
    };
  }

  async derivedKeys({
    mnemonic,
    chain,
    indexes,
  }: {
    mnemonic: string;
    chain: string;
    indexes: number[];
  }): Promise<DerivedKey[]> {
    const c = this.requireChain(chain);
    const paths = indexes.map((i) => resolvePath(c, i));
    const res = await this.core.derivedKeys(mnemonic, c.twCoinType, paths);
    return res.map((r, i) => ({
      address: r.address,
      publicKey: r.publicKey,
      index: indexes[i],
      path: paths[i],
      chain,
    }));
  }

  /**
   * @deprecated UNSAFE — see {@link IWalletCoreAdapter.derivePrivateKey}.
   * Kept only for "export private key" UX in Settings. Caller MUST wipe
   * the returned string via `wipeString(pk)` immediately after use.
   */
  async derivePrivateKey({
    mnemonic,
    chain,
    index,
  }: {
    mnemonic: string;
    chain: string;
    index: number;
  }): Promise<string> {
    const c = this.requireChain(chain);
    const path = resolvePath(c, index);
    return this.core.derivePrivateKey(mnemonic, c.twCoinType, path);
  }

  async addressFromPrivateKey({
    privateKey,
    chain,
  }: {
    privateKey: string;
    chain: string;
  }): Promise<{ address: string; publicKey: string }> {
    const c = this.requireChain(chain);
    return this.core.addressFromPrivateKey(privateKey, c.twCoinType);
  }

  async signTransaction({
    chain,
    input,
    privateKey,
  }: {
    chain: string;
    input: string;
    privateKey: string;
  }): Promise<string> {
    const c = this.requireChain(chain);
    try {
      return await this.core.signTransaction(c.twCoinType, input, privateKey);
    } finally {
      // Defensive: wipe the JS-heap copy of the private key as soon as
      // signing returns. Caller is expected to also drop its reference.
      wipeString(privateKey);
    }
  }

  async signMessage({
    chain,
    message,
    privateKey,
  }: {
    chain: string;
    message: string;
    privateKey: string;
  }): Promise<string> {
    const c = this.requireChain(chain);
    try {
      return await this.core.signMessage(c.twCoinType, message, privateKey);
    } finally {
      wipeString(privateKey);
    }
  }

  private requireChain(id: string) {
    const c = CHAINS[id];
    if (!c) throw new WalletError(ERR.CHAIN_UNSUPPORTED, `chain ${id} not supported`);
    return c;
  }
}
