import { HDKeyring } from './HDKeyring';
import { ImportedKeyring } from './ImportedKeyring';
import { WatchOnlyKeyring } from './WatchOnlyKeyring';
import type { IKeyring } from './IKeyring';
import type { IWalletCoreAdapter } from '../adapters/IWalletCoreAdapter';
import type { ISecureStorage } from '../storage/ISecureStorage';
import type { KeyringMeta } from '../types';

export type KeyringFactoryDeps = {
  adapter: IWalletCoreAdapter;
  storage: ISecureStorage;
};

export type CreateKeyringInput =
  | { type: 'hd'; id: string; storageKey: string }
  | { type: 'imported'; id: string; storageKey: string; chain: string }
  | { type: 'watch'; id: string; address: string; publicKey?: string; chain: string };

export class KeyringFactory {
  constructor(private readonly deps: KeyringFactoryDeps) {}

  create(input: CreateKeyringInput): IKeyring {
    switch (input.type) {
      case 'hd':
        return new HDKeyring({
          id: input.id,
          storageKey: input.storageKey,
          adapter: this.deps.adapter,
          storage: this.deps.storage,
        });
      case 'imported':
        return new ImportedKeyring({
          id: input.id,
          storageKey: input.storageKey,
          chain: input.chain,
          adapter: this.deps.adapter,
          storage: this.deps.storage,
        });
      case 'watch':
        return new WatchOnlyKeyring(input);
    }
  }

  toMeta(k: IKeyring, storageKey: string): KeyringMeta {
    return { id: k.id, type: k.type, storageKey };
  }
}
